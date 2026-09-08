import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/** False when the env vars are missing — the CRM is unusable, the site is fine. */
export const isSupabaseConfigured = Boolean(URL && KEY);

let client: SupabaseClient | null = null;

function getClient(): SupabaseClient {
  if (!client) {
    if (!isSupabaseConfigured)
      throw new Error(
        "Supabase is not configured — set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
      );
    client = createClient(URL as string, KEY as string);
  }
  return client;
}

/**
 * Browser client for the CRM. Unlike `lib/leads.ts` (a single anon insert,
 * done with raw fetch) the CRM needs a real session — persistence and token
 * refresh — so it uses the client library.
 *
 * Built lazily behind a proxy: `createClient` throws on an empty URL, and this
 * module is imported by the site nav, so eager construction would fail the
 * whole build on a deploy that is missing the env vars. Importing is now always
 * safe; only actually using the client requires configuration.
 */
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const c = getClient() as unknown as Record<string | symbol, unknown>;
    const value = c[prop];
    return typeof value === "function" ? value.bind(c) : value;
  },
});

export type Status =
  | "new"
  | "contacted"
  | "replied"
  | "won"
  | "lost"
  | "unqualified";

export const STATUSES: Status[] = [
  "new",
  "contacted",
  "replied",
  "won",
  "lost",
  "unqualified",
];

/**
 * Where a lead sits in the outreach sequence: the first attempt, then up to
 * four follow-ups, then done. Derived in the `crm_leads_staged` view from the
 * number of touches — never stored, so it cannot drift from the history.
 * Reads use the view; writes still go to `crm_leads`.
 */
export type Stage =
  | "not_contacted"
  | "initial"
  | "followup_1"
  | "followup_2"
  | "followup_3"
  | "followup_4"
  | "sequence_done";

export const STAGES: { key: Stage; label: string; short: string }[] = [
  { key: "not_contacted", label: "Not contacted", short: "None" },
  { key: "initial", label: "Initial attempt", short: "Initial" },
  { key: "followup_1", label: "Follow-up 1", short: "FU1" },
  { key: "followup_2", label: "Follow-up 2", short: "FU2" },
  { key: "followup_3", label: "Follow-up 3", short: "FU3" },
  { key: "followup_4", label: "Follow-up 4", short: "FU4" },
  { key: "sequence_done", label: "Sequence done", short: "Done" },
];

export const LEADS_VIEW = "crm_leads_staged";
export const LEADS_TABLE = "crm_leads";

export type Channel = "cold_call" | "outreach";

/**
 * The two channels differ in three ways only: what identifies a lead (phone vs
 * handle/email), how fast the follow-up cadence is, and what an outcome can be.
 * Everything else — the list, the log, the history — is shared.
 */
export const CHANNELS = {
  cold_call: {
    label: "Cold calls",
    market: "India",
    href: "/crm/calls",
    /** Days ahead the next follow-up lands when you log a contact. */
    gap: 3,
    outcomes: [
      "Answered",
      "No answer",
      "Call back later",
      "Not interested",
      "Wrong number",
    ],
  },
  outreach: {
    label: "Instagram & email",
    market: "France, EU, US",
    href: "/crm/outreach",
    gap: 7,
    outcomes: [
      "DM sent",
      "Email sent",
      "Replied",
      "No reply",
      "DMs restricted",
    ],
  },
} as const satisfies Record<
  Channel,
  {
    label: string;
    market: string;
    href: string;
    gap: number;
    outcomes: readonly string[];
  }
>;

export const CHANNEL_KEYS = Object.keys(CHANNELS) as Channel[];

export type Lead = {
  id: string;
  /** From the view — count of crm_touches rows. */
  touch_count: number;
  stage: Stage;
  /** Primary channel — drives the badge and the default detail UI. */
  channel: Channel;
  /** Every queue this lead appears in. A lead can be called AND DM'd. */
  channels: Channel[];
  name: string;
  company: string | null;
  email: string | null;
  contact: string | null;
  website: string | null;
  phone: string | null;
  country: string | null;
  category: string | null;
  description: string | null;
  status: Status;
  first_contacted_at: string | null;
  next_followup_at: string | null;
  notes: string | null;
  created_at: string;
};

export type Touch = {
  id: string;
  lead_id: string;
  occurred_on: string;
  outcome: string | null;
  note: string | null;
};

export const TOUCH_COLS = "id,lead_id,occurred_on,outcome,note";

/** One stint on a lead, banked by the timer on the detail panel. */
export const TIME_TABLE = "crm_time_entries";

export type TimeEntry = {
  id: string;
  lead_id: string;
  seconds: number;
  occurred_on: string;
  created_at: string;
};

/** `@handle`, a bare handle, or a pasted profile URL → an instagram.com URL. */
export function igUrl(contact: string): string | null {
  const v = contact.trim();
  if (!v) return null;
  if (/^https?:\/\//i.test(v))
    return /instagram\.com/i.test(v) ? v : null;
  const handle = v.replace(/^@/, "").replace(/\/+$/, "");
  return /^[A-Za-z0-9._]+$/.test(handle)
    ? `https://instagram.com/${handle}`
    : null;
}

/** Add the scheme a pasted domain is usually missing. */
export function siteUrl(website: string): string | null {
  const v = website.trim();
  if (!v) return null;
  return /^https?:\/\//i.test(v) ? v : `https://${v}`;
}

/** Strip scheme, `www.` and a trailing slash so links read as the domain. */
export function prettyUrl(url: string): string {
  return url.replace(/^https?:\/\//i, "").replace(/^www\./i, "").replace(/\/+$/, "");
}

/** Local-time YYYY-MM-DD. `toISOString()` would shift the date in UTC+ zones. */
export function today(offsetDays = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}
