/**
 * Lead capture — posts straight to Supabase PostgREST as the anon role.
 * The `leads` table's RLS allows anon INSERT and nothing else, so no client
 * library is needed for a single insert.
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export type ServiceInterest = "meta_ads" | "google_ads" | "geo" | "not_sure";
export type LeadType = "book_call" | "strategy_demo";

export type LeadPayload = {
  name: string;
  email: string;
  company?: string;
  service_interest?: ServiceInterest;
  lead_type: LeadType;
  message?: string;
};

export async function submitLead(payload: LeadPayload): Promise<void> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error(
      "Supabase is not configured — set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    );
  }

  const res = await fetch(`${SUPABASE_URL}/rest/v1/leads`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      Prefer: "return=minimal",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Lead submission failed (${res.status}) ${detail}`.trim());
  }
}
