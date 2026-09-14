/**
 * GET /api/twilio/token
 *
 * Mints a short-lived Twilio Voice Access Token for the dialer extension.
 * Gated by the caller's Supabase session: the request must carry the CRM
 * owner's bearer token (`Authorization: Bearer <supabase access token>`), which
 * we check against Supabase's own /auth/v1/user endpoint. No Twilio secret ever
 * leaves the server.
 */
import { mintVoiceToken, OWNER_EMAIL } from "@/lib/twilioServer";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/** The dialer runs from a `chrome-extension://` origin, so allow any origin but
 *  keep the endpoint useless without a valid owner token (checked below). */
const CORS = {
  "Access-Control-Allow-Origin":
    process.env.DIALER_EXTENSION_ORIGIN || "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, content-type",
  "Access-Control-Max-Age": "86400",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", ...CORS },
  });

export function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS });
}

export async function GET(req: Request) {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY)
    return json({ error: "Supabase not configured on the server." }, 500);

  const auth = req.headers.get("authorization") || "";
  const token = auth.toLowerCase().startsWith("bearer ")
    ? auth.slice(7).trim()
    : "";
  if (!token) return json({ error: "Missing bearer token." }, 401);

  // Verify the session by asking Supabase who it belongs to.
  let email: string | undefined;
  try {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!res.ok) return json({ error: "Invalid or expired session." }, 401);
    email = (await res.json())?.email;
  } catch {
    return json({ error: "Could not verify session." }, 502);
  }

  if (email?.toLowerCase() !== OWNER_EMAIL.toLowerCase())
    return json({ error: "Not authorised for the dialer." }, 403);

  try {
    return json(mintVoiceToken());
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
}
