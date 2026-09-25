/**
 * POST /api/voice/session
 *
 * Public: mints a short-lived OpenAI Realtime client secret for the website's
 * "talk to our AI" button. The browser then connects to OpenAI directly over
 * WebRTC; OPENAI_API_KEY never leaves the server, and the persona is fixed here
 * so a visitor can't swap in their own instructions.
 */
import { GREETING_TRIGGER, INSTRUCTIONS, REALTIME_MODEL, VOICE } from "@/lib/voiceAgent";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const WINDOW_MS = 10 * 60_000;
const MAX_PER_WINDOW = 5;
// ponytail: per-instance memory, resets on deploy and isn't shared across
// replicas. Move to Supabase/Redis if the demo gets scraped.
const hits = new Map<string, number[]>();

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
  hits.set(ip, [...recent, now]);

  const res = await fetch("https://api.openai.com/v1/realtime/client_secrets", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "content-type": "application/json" },
    body: JSON.stringify({
      expires_after: { anchor: "created_at", seconds: 60 },
      session: {
        type: "realtime",
        model: REALTIME_MODEL,
        instructions: INSTRUCTIONS,
        audio: { output: { voice: VOICE } },
      },
    }),
  });
  if (!res.ok) return json({ error: "Could not start the demo." }, 502);
  const { value } = await res.json();
  return json({ secret: value, model: REALTIME_MODEL, greeting: GREETING_TRIGGER });
}
