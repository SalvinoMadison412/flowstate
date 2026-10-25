/**
 * POST /api/voice/chat
 *
 * Public: one conversation turn for the website's "talk to our AI" button. The
 * browser does speech-to-text and text-to-speech itself and sends the transcript
 * here; this route adds the fixed persona and asks a free OpenRouter model for the
 * reply. OPENROUTER_API_KEY never leaves the server, and the persona is fixed here
 * so a visitor can't swap in their own instructions.
 */
import { clientIp } from "@/lib/clientIp";
import { CHAT_MODELS, GREETING_TRIGGER, INSTRUCTIONS, LEGAL_INSTRUCTIONS } from "@/lib/voiceAgent";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const WINDOW_MS = 10 * 60_000;
const MAX_PER_WINDOW = 60; // turns, not calls: a 5-minute call is ~20-30 turns
// ponytail: per-instance memory, resets on deploy and isn't shared across
// replicas. Move to Supabase/Redis if the demo gets scraped. The daily cap is
// per instance too, and OpenRouter's own free-model daily limit is the real
// ceiling. See lib/clientIp.ts for how the IP is read.
const hits = new Map<string, number[]>();
const DAILY_MAX = Number(process.env.VOICE_DEMO_DAILY_MAX) || 1000;
let day = "",
  dayCount = 0;

const json = (body: unknown, status = 200) =>
  Response.json(body, { status, headers: { "cache-control": "no-store" } });

type Msg = { role: "user" | "assistant"; content: string };

export async function POST(req: Request) {
  const key = process.env.OPENROUTER_API_KEY;
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

  const { persona, messages } = await req.json().catch(() => ({}));
  const instructions = persona === "legal" ? LEGAL_INSTRUCTIONS : INSTRUCTIONS;
  // Untrusted history from the browser: only plain user/assistant text, size-capped.
  const history: Msg[] = (Array.isArray(messages) ? messages : [])
    .filter((m: Msg) => (m?.role === "user" || m?.role === "assistant") && typeof m.content === "string")
    .slice(-20)
    .map((m: Msg) => ({ role: m.role, content: m.content.slice(0, 1000) }));

  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "content-type": "application/json" },
    body: JSON.stringify({
      models: CHAT_MODELS,
      max_tokens: 200,
      messages: [
        { role: "system", content: instructions },
        { role: "user", content: GREETING_TRIGGER },
        ...history,
      ],
    }),
  });
  if (!res.ok) return json({ error: "The demo is busy right now. Please try again." }, 502);
  const reply: string = (await res.json()).choices?.[0]?.message?.content?.trim() ?? "";
  if (!reply) return json({ error: "The demo is busy right now. Please try again." }, 502);
  return json({ reply });
}
