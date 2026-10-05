/**
 * POST /api/voice/session
 *
 * Public: mints a short-lived OpenAI Realtime client secret for the website's
 * "talk to our AI" button. The browser then connects to OpenAI directly over
 * WebRTC; OPENAI_API_KEY never leaves the server, and the persona is fixed here
 * so a visitor can't swap in their own instructions.
 */
import { GREETING_TRIGGER, INSTRUCTIONS, LEGAL_INSTRUCTIONS, REALTIME_MODEL, VOICE } from "@/lib/voiceAgent";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const WINDOW_MS = 10 * 60_000;
const MAX_PER_WINDOW = 5;
// ponytail: per-instance memory, resets on deploy and isn't shared across
// replicas. Move to Supabase/Redis if the demo gets scraped. The daily cap is
// per instance too (real ceiling is DAILY_MAX x instances), so also set a
// monthly budget limit on the OpenAI project. The 5-minute call cap is
// browser-only. x-forwarded-for is only trustworthy behind a proxy that
// overwrites it.
const hits = new Map<string, number[]>();
const DAILY_MAX = Number(process.env.VOICE_DEMO_DAILY_MAX) || 150;
let day = "",
  dayCount = 0;

const json = (body: unknown, status = 200) =>
  Response.json(body, { status, headers: { "cache-control": "no-store" } });

export async function POST(req: Request) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return json({ error: "Demo not configured." }, 503);

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown";
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= MAX_PER_WINDOW)
    return json({ error: "Too many demo calls. Try again in a few minutes." }, 429);
  if (hits.size > 5000) hits.clear();
  hits.set(ip, [...recent, now]);

  const today = new Date().toISOString().slice(0, 10);
  if (today !== day) {
    day = today;
    dayCount = 0;
  }
  if (dayCount >= DAILY_MAX)
    return json({ error: "The live demo is busy today. Try again tomorrow, or book a call below." }, 429);
  dayCount++;

  const { persona } = await req.json().catch(() => ({}));
  const instructions = persona === "legal" ? LEGAL_INSTRUCTIONS : INSTRUCTIONS;

  const res = await fetch("https://api.openai.com/v1/realtime/client_secrets", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "content-type": "application/json" },
    body: JSON.stringify({
      expires_after: { anchor: "created_at", seconds: 60 },
      session: {
        type: "realtime",
        model: REALTIME_MODEL,
        instructions,
        audio: { output: { voice: VOICE } },
      },
    }),
  });
  if (!res.ok) return json({ error: "Could not start the demo." }, 502);
  const { value } = await res.json();
  return json({ secret: value, model: REALTIME_MODEL, greeting: GREETING_TRIGGER });
}
