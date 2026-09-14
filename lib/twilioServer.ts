/**
 * Server-only Twilio helpers for the dialer route handlers. Reads secret env
 * (auth token, API secret) and uses node:crypto — never import this from a
 * client component.
 *
 * No `twilio` npm package: minting an Access Token and checking a webhook
 * signature are each ~15 lines of HMAC, and the project keeps its dependency
 * list tiny on purpose.
 */
import crypto from "node:crypto";

export const OWNER_EMAIL =
  process.env.CRM_OWNER_EMAIL || "salvinokevin7@gmail.com";

/** Identity the dialer registers as — must match on token and in the TwiML. */
export const DIALER_IDENTITY =
  process.env.TWILIO_DIALER_IDENTITY || "flowstate-owner";

type TwilioEnv = {
  accountSid: string;
  authToken: string;
  apiKey: string;
  apiSecret: string;
  twimlAppSid: string;
  callerId: string;
};

/** Throws a listing every missing var, so a misconfigured deploy fails loudly. */
export function twilioEnv(): TwilioEnv {
  const env = {
    accountSid: process.env.TWILIO_ACCOUNT_SID || "",
    authToken: process.env.TWILIO_AUTH_TOKEN || "",
    apiKey: process.env.TWILIO_API_KEY || "",
    apiSecret: process.env.TWILIO_API_SECRET || "",
    twimlAppSid: process.env.TWILIO_TWIML_APP_SID || "",
    callerId: process.env.TWILIO_PHONE_NUMBER || "",
  };
  const missing = Object.entries(env)
    .filter(([, v]) => !v)
    .map(([k]) => k);
  if (missing.length)
    throw new Error(`Twilio not configured — missing: ${missing.join(", ")}`);
  return env;
}

const b64url = (b: Buffer | string) =>
  Buffer.from(b)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

/**
 * A Twilio Voice Access Token: an HS256 JWT signed with the API Secret, with a
 * VoiceGrant that allows incoming calls and outgoing calls through our TwiML
 * app. `ttlSeconds` defaults to one hour (Twilio's max).
 */
export function mintVoiceToken(identity = DIALER_IDENTITY, ttlSeconds = 3600) {
  const { accountSid, apiKey, apiSecret, twimlAppSid } = twilioEnv();
  const now = Math.floor(Date.now() / 1000);

  const header = { typ: "JWT", alg: "HS256", cty: "twilio-fpa;v=1" };
  const payload = {
    jti: `${apiKey}-${now}`,
    iss: apiKey,
    sub: accountSid,
    iat: now,
    exp: now + ttlSeconds,
    grants: {
      identity,
      voice: {
        incoming: { allow: true },
        outgoing: { application_sid: twimlAppSid },
      },
    },
  };

  const data = `${b64url(JSON.stringify(header))}.${b64url(JSON.stringify(payload))}`;
  const sig = b64url(
    crypto.createHmac("sha256", apiSecret).update(data).digest(),
  );
  return { token: `${data}.${sig}`, identity, expiresAt: (now + ttlSeconds) * 1000 };
}

/**
 * Validate an inbound Twilio webhook via the `X-Twilio-Signature` header:
 * HMAC-SHA1 of the exact request URL followed by every POST param appended
 * `key+value` in alphabetical order, base64-encoded, compared to the header.
 * https://www.twilio.com/docs/usage/security#validating-requests
 */
export function verifyTwilioSignature(
  url: string,
  params: Record<string, string>,
  signature: string | null,
): boolean {
  if (!signature) return false;
  const { authToken } = twilioEnv();
  const data =
    url +
    Object.keys(params)
      .sort()
      .map((k) => k + params[k])
      .join("");
  const expected = crypto
    .createHmac("sha1", authToken)
    .update(Buffer.from(data, "utf-8"))
    .digest("base64");
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  } catch {
    return false;
  }
}

const xmlEscape = (s: string) =>
  s.replace(/[<>&'"]/g, (c) =>
    c === "<"
      ? "&lt;"
      : c === ">"
        ? "&gt;"
        : c === "&"
          ? "&amp;"
          : c === "'"
            ? "&apos;"
            : "&quot;",
  );

/** TwiML for a call the dialer places: bridge it to the dialed PSTN number. */
export function outboundTwiml(to: string, callerId: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?><Response><Dial callerId="${xmlEscape(
    callerId,
  )}" answerOnBridge="true"><Number>${xmlEscape(to)}</Number></Dial></Response>`;
}

/** TwiML for a PSTN call arriving on the Twilio number: ring the dialer. */
export function inboundTwiml(identity: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?><Response><Dial answerOnBridge="true"><Client>${xmlEscape(
    identity,
  )}</Client></Dial></Response>`;
}

/** TwiML fallback when a caller can't be connected. */
export function rejectTwiml(message = "Sorry, no one is available to take your call."): string {
  return `<?xml version="1.0" encoding="UTF-8"?><Response><Say>${xmlEscape(
    message,
  )}</Say><Hangup/></Response>`;
}
