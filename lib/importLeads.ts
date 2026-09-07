import { supabase, LEADS_TABLE, type Channel } from "./supabase";
import { dedupeKey, type LeadDraft } from "./parseSheet";

export * from "./parseSheet";

/** Keys already in the CRM for this channel, so re-importing can't duplicate. */
export async function existingKeys(channel: Channel): Promise<Set<string>> {
  const keys = new Set<string>();
  const PAGE = 1000;
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase
      .from(LEADS_TABLE)
      .select("contact,phone,email")
      .eq("channel", channel)
      .range(from, from + PAGE - 1);
    if (error) throw new Error(error.message);
    for (const r of data ?? []) {
      const k = dedupeKey(r);
      if (k) keys.add(k);
    }
    if (!data || data.length < PAGE) break;
  }
  return keys;
}

/**
 * Insert in chunks; PostgREST chokes on very large single payloads.
 *
 * A row that arrives with a first-contact date was already worked before the
 * import, so it gets one seed touch on that date. Without it the lead would
 * read as `contacted` but sit at stage "not contacted" — stage counts touches,
 * and a lead with no history has none.
 */
export async function insertLeads(
  drafts: LeadDraft[],
  onProgress: (done: number) => void,
): Promise<void> {
  const CHUNK = 250;
  for (let i = 0; i < drafts.length; i += CHUNK) {
    const batch = drafts.slice(i, i + CHUNK);
    const { data, error } = await supabase
      .from(LEADS_TABLE)
      .insert(batch)
      .select("id");
    if (error) throw new Error(error.message);

    // PostgREST returns inserted rows in the order they were sent.
    const seeds = (data ?? [])
      .map((row, j) => ({ row, draft: batch[j] }))
      .filter(({ draft }) => draft?.first_contacted_at)
      .map(({ row, draft }) => ({
        lead_id: row.id,
        occurred_on: draft.first_contacted_at as string,
        outcome: "Imported",
        note: "Contacted before this list was imported.",
      }));

    if (seeds.length) {
      const { error: tErr } = await supabase.from("crm_touches").insert(seeds);
      if (tErr) throw new Error(tErr.message);
    }

    onProgress(Math.min(i + CHUNK, drafts.length));
  }
}
