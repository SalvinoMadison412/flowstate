/**
 * POST /api/voice/session
 *
 * Public: mints a single-use Gemini Live ephemeral token for the website's
 * "talk to our AI" button. The browser then talks to Gemini directly over a
 * WebSocket; GEMINI_API_KEY never leaves the server. The whole session setup
 * (model, voice, persona) is locked into the token, so a visitor can't swap in
 * their own instructions: Gemini ignores the setup the browser sends.
 */
import { clientIp } from "@/lib/clientIp";
import { GREETING_TRIGGER, INSTRUCTIONS, LEGAL_INSTRUCTIONS, LIVE_MODEL, VOICE } from "@/lib/voiceAgent";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const WINDOW_MS = 10 * 60_000;
const MAX_PER_WINDOW = 5;
// ponytail: per-instance memory, resets on deploy and isn't shared across
// replicas. Move to Supabase/Redis if the demo gets scraped. The daily cap is
// per instance too, and the Gemini free tier's own daily limit is the real
// ceiling. The 5-minute call cap is browser-only, but the token's expireTime
// below ends the session server-side shortly after. See lib/clientIp.ts for
// how the IP is read.
const hits = new Map<string, number[]>();
const DAILY_MAX = Number(process.env.VOICE_DEMO_DAILY_MAX) || 150;
let day = "",
  dayCount = 0;

const json = (body: unknown, status = 200) =>
  Response.json(body, { status, headers: { "cache-control": "no-store" } });

export async function POST(req: Request) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return json({ error: "Demo not configured." }, 503);

  const ip = clientIp(req);
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

  const res = await fetch("https://generativelanguage.googleapis.com/v1beta/auth_tokens", {
    method: "POST",
    headers: { "x-goog-api-key": key, "content-type": "application/json" },
    body: JSON.stringify({
      uses: 1,
      newSessionExpireTime: new Date(now + 60_000).toISOString(),
      expireTime: new Date(now + 6 * 60_000).toISOString(), // 5-minute call + slack
      bidiGenerateContentSetup: {
        model: `models/${LIVE_MODEL}`,
        generationConfig: {
          responseModalities: ["AUDIO"],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: VOICE } } },
        },
        systemInstruction: { parts: [{ text: instructions }] },
      },
    }),
  });
  if (!res.ok) {
    console.error("gemini auth_tokens failed", res.status, (await res.text()).slice(0, 300));
    return json({ error: "Could not start the demo." }, 502);
  }
  const { name } = await res.json();
  return json({ token: name, model: LIVE_MODEL, greeting: GREETING_TRIGGER });
}
