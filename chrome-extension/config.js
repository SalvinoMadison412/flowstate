// Static config for the Flow State Dialer.
//
// The Supabase URL + anon key are the same public values the CRM ships with
// (NEXT_PUBLIC_*), so they are safe to hardcode here. CRM_BASE_URL is where your
// deployed Next.js app lives — it serves /api/twilio/token. If you host the CRM
// somewhere else, change CRM_BASE_URL here AND the two host entries in
// manifest.json, then reload the extension.
//
// Nothing Twilio-secret belongs in this file. The extension only ever holds
// short-lived Access Tokens fetched from the CRM.

export const DIALER_CONFIG = {
  SUPABASE_URL: "https://ogzxvbmzyvqcspupxhak.supabase.co",
  SUPABASE_ANON_KEY:
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9nenh2Ym16eXZxY3NwdXB4aGFrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg0MTY4NzMsImV4cCI6MjEwMzk5Mjg3M30.4iw-hKivVb1D_baOHBniHLKC0spdn3ljWmRhjsecFtQ",

  // No trailing slash. Overridable at runtime in the dialer's settings panel
  // (stored in chrome.storage.local under "crmBaseUrl").
  CRM_BASE_URL: "https://your-crm-domain.com",

  // Must match TWILIO_DIALER_IDENTITY on the server.
  TWILIO_IDENTITY: "flowstate-owner",

  OWNER_EMAIL: "salvinokevin7@gmail.com",
};

/** CRM base URL, preferring a runtime override set in the settings panel. */
export async function crmBaseUrl() {
  try {
    const { crmBaseUrl } = await chrome.storage.local.get("crmBaseUrl");
    return (crmBaseUrl || DIALER_CONFIG.CRM_BASE_URL).replace(/\/$/, "");
  } catch {
    return DIALER_CONFIG.CRM_BASE_URL.replace(/\/$/, "");
  }
}
