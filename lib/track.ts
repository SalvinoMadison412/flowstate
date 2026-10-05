const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
// ponytail: anon insert-only table, same trust model as `leads`; spammable. Move behind a route + limiter if it gets abused.
export function track(event: "demo_start" | "demo_end" | "demo_error" | "cta_click", label?: string) {
  if (!URL || !KEY || typeof window === "undefined") return;
  void fetch(`${URL}/rest/v1/site_events`, {
    method: "POST", keepalive: true,
    headers: { "Content-Type": "application/json", apikey: KEY, Authorization: `Bearer ${KEY}`, Prefer: "return=minimal" },
    body: JSON.stringify({ event, label: label?.slice(0, 80), path: location.pathname }),
  }).catch(() => {});
}
