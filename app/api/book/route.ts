/**
 * POST /api/book
 *
 * Public: books a 30-minute strategy call on the owner's Google Calendar and
 * invites the visitor (Google emails them the invite + Meet link). Uses an
 * OAuth refresh token for the owner's account, so no extra dependency; see
 * BOOKING_SETUP.md. Returns 503 when the Google env vars aren't set, so the form
 * can fall back to a plain lead.
 */
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const SLOT_MIN = 30;
const MAX_DAYS_AHEAD = 60;
const WINDOW_MS = 60 * 60_000;
const MAX_PER_WINDOW = 3;
// ponytail: per-instance memory (resets on deploy, not shared across replicas).
// This endpoint makes Google email invites on the owner's behalf, so move the
// limiter to Supabase/Redis if it gets abused.
const hits = new Map<string, number[]>();

const json = (body: unknown, status = 200) =>
  Response.json(body, { status, headers: { "cache-control": "no-store" } });

const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function accessToken(): Promise<string> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      refresh_token: process.env.GOOGLE_REFRESH_TOKEN!,
      grant_type: "refresh_token",
    }),
  });
  if (!res.ok) throw new Error(`google token ${res.status}`);
  return (await res.json()).access_token;
}

export async function POST(req: Request) {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET || !process.env.GOOGLE_REFRESH_TOKEN)
    return json({ error: "Booking not configured." }, 503);

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown";
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= MAX_PER_WINDOW) return json({ error: "Too many requests. Try again later." }, 429);
  if (hits.size > 5000) hits.clear();
  hits.set(ip, [...recent, now]);

  const b = await req.json().catch(() => null);
  const name = String(b?.name ?? "").trim().slice(0, 100);
  const email = String(b?.email ?? "").trim().slice(0, 200);
  const start = new Date(String(b?.start ?? ""));
  const timeZone = String(b?.timeZone ?? "UTC").slice(0, 64);
  if (!name || !emailRe.test(email) || Number.isNaN(start.getTime()))
    return json({ error: "Please check your name, email and time." }, 400);
  if (start.getTime() < now + 60 * 60_000 || start.getTime() > now + MAX_DAYS_AHEAD * 86_400_000)
    return json({ error: "Please pick a time between one hour and 60 days from now." }, 400);
  const end = new Date(start.getTime() + SLOT_MIN * 60_000);

  try {
    const token = await accessToken();
    const auth = { authorization: `Bearer ${token}`, "content-type": "application/json" };
    const cal = encodeURIComponent(process.env.GOOGLE_CALENDAR_ID || "primary");

    const fb = await fetch("https://www.googleapis.com/calendar/v3/freeBusy", {
      method: "POST",
      headers: auth,
      body: JSON.stringify({
        timeMin: start.toISOString(),
        timeMax: end.toISOString(),
        items: [{ id: process.env.GOOGLE_CALENDAR_ID || "primary" }],
      }),
    });
    if (!fb.ok) throw new Error(`freebusy ${fb.status}`);
    const busy = Object.values((await fb.json()).calendars ?? {}).some(
      (c) => ((c as { busy?: unknown[] }).busy ?? []).length > 0,
    );
    if (busy) return json({ error: "That time isn't available. Please pick another." }, 409);

    const description = [
      `Booked from flowstate website`,
      b?.company && `Company: ${String(b.company).slice(0, 120)}`,
      b?.service && `Interested in: ${String(b.service).slice(0, 60)}`,
      b?.message && `Message: ${String(b.message).slice(0, 500)}`,
    ]
      .filter(Boolean)
      .join("\n");

    const ev = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${cal}/events?sendUpdates=all&conferenceDataVersion=1`,
      {
        method: "POST",
        headers: auth,
        body: JSON.stringify({
          summary: `Strategy call: ${name}`,
          description,
          start: { dateTime: start.toISOString(), timeZone },
          end: { dateTime: end.toISOString(), timeZone },
          attendees: [{ email, displayName: name }],
          conferenceData: { createRequest: { requestId: crypto.randomUUID(), conferenceSolutionKey: { type: "hangoutsMeet" } } },
        }),
      },
    );
    if (!ev.ok) throw new Error(`events ${ev.status}`);
    return json({ ok: true });
  } catch (e) {
    console.error("[book]", e);
    return json({ error: "Couldn't book that time. Please try again or pick another." }, 502);
  }
}
