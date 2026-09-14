/**
 * POST /api/twilio/voice
 *
 * The TwiML webhook for the dialer's TwiML App. Twilio calls it for every leg:
 *
 *  - Outbound: the extension runs `device.connect({ params: { To } })`; Twilio
 *    posts here with `From=client:<identity>` — we bridge the call to `To`.
 *  - Inbound: a PSTN call reaches the Twilio number (pointed at this same TwiML
 *    App) — `From` is a real number — we ring the dialer's `<Client>`.
 *
 * Requests are authenticated with the `X-Twilio-Signature` header. Set
 * TWILIO_PUBLIC_URL to the exact origin you register in the Twilio console so
 * the signature base string matches; for an ngrok/cloudflared tunnel during
 * setup you can set TWILIO_SKIP_SIGNATURE_CHECK=true.
 */
import {
  DIALER_IDENTITY,
  inboundTwiml,
  outboundTwiml,
  rejectTwiml,
  twilioEnv,
  verifyTwilioSignature,
} from "@/lib/twilioServer";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const xml = (body: string, status = 200) =>
  new Response(body, { status, headers: { "content-type": "text/xml" } });

function requestUrl(req: Request): string {
  if (process.env.TWILIO_PUBLIC_URL)
    return `${process.env.TWILIO_PUBLIC_URL.replace(/\/$/, "")}/api/twilio/voice`;
  const h = req.headers;
  const proto = h.get("x-forwarded-proto") || "https";
  const host = h.get("x-forwarded-host") || h.get("host") || "";
  return `${proto}://${host}/api/twilio/voice`;
}

export async function POST(req: Request) {
  const form = await req.formData();
  const params: Record<string, string> = {};
  for (const [k, v] of form.entries())
    if (typeof v === "string") params[k] = v;

  if (process.env.TWILIO_SKIP_SIGNATURE_CHECK !== "true") {
    const ok = verifyTwilioSignature(
      requestUrl(req),
      params,
      req.headers.get("x-twilio-signature"),
    );
    if (!ok) return xml(rejectTwiml("Request could not be verified."), 403);
  }

  let callerId: string;
  try {
    callerId = twilioEnv().callerId;
  } catch (e) {
    return xml(rejectTwiml((e as Error).message), 500);
  }

  const from = params.From || "";
  const to = (params.To || "").trim();

  // Outbound: the leg originates from our registered client.
  if (from.startsWith("client:")) {
    if (!/^\+?[0-9]{6,15}$/.test(to.replace(/[\s()-]/g, "")))
      return xml(rejectTwiml("No valid number was dialled."));
    return xml(outboundTwiml(to, callerId));
  }

  // Inbound: a real number is calling the Twilio line — ring the dialer.
  return xml(inboundTwiml(DIALER_IDENTITY));
}
