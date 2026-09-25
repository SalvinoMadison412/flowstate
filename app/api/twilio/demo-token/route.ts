/**
 * GET /api/twilio/demo-token
 *
 * Public: mints a 5-minute Voice token for the website's "talk to our AI"
 * button. Safe because the voice webhook routes `client:demo-*` identities to
 * the voice agent only (see /api/twilio/voice), so a token can't dial out.
 */
import crypto from "node:crypto";
import { DEMO_PREFIX, mintVoiceToken } from "@/lib/twilioServer";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const WINDOW_MS = 10 * 60_000;
const MAX_PER_WINDOW = 5;
// ponytail: per-instance memory, resets on deploy and isn't shared across
// replicas. Move to Supabase/Redis if the demo gets scraped.
const hits = new Map<string, number[]>();

const json = (body: unknown, status = 200) =>
  Response.json(body, { status, headers: { "cache-control": "no-store" } });

export function GET(req: Request) {
  if (!process.env.DEMO_VOICE_AGENT_URL)
    return json({ error: "Demo not configured." }, 503);

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown";
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= MAX_PER_WINDOW)
    return json({ error: "Too many demo calls. Try again in a few minutes." }, 429);
  hits.set(ip, [...recent, now]);

  try {
    const identity = `${DEMO_PREFIX.slice("client:".length)}${crypto.randomUUID()}`;
    return json(mintVoiceToken(identity, 300));
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
}
