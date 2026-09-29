"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { input, label, card } from "../ui";

const TABLE = "crm_agencies";

const INBOX = [
  ["unknown", "Unknown"],
  ["linkedin", "LinkedIn inbox"],
  ["email", "Email"],
  ["both", "Both"],
  ["neither", "Neither"],
] as const;

type Agency = {
  id: string;
  agency_name: string;
  target_niche: string | null;
  website: string | null;
  founder_name: string | null;
  founder_linkedin: string | null;
  agency_linkedin: string | null;
  country: string | null;
  date_added: string | null;
  email: string | null;
  phone: string | null;
  inbox_enabled: string;
  emailed_at: string | null;
  is_new: boolean;
};

type View = "new" | "email" | "inbox" | "call" | "none" | "contacted" | "all";

const hasInbox = (r: Agency) => r.inbox_enabled === "linkedin" || r.inbox_enabled === "both";

/**
 * Outreach priority: email, then LinkedIn inbox, then phone. Each un-emailed
 * lead sits in exactly one of email / inbox / call, by its best channel.
 */
const IN: Record<View, (r: Agency) => boolean> = {
  all: () => true,
  contacted: (r) => !!r.emailed_at,
  email: (r) => !r.emailed_at && !!r.email,
  inbox: (r) => !r.emailed_at && !r.email && hasInbox(r),
  call: (r) => !r.emailed_at && !r.email && !hasInbox(r) && !!r.phone,
  // Marked "Neither" with nothing to reach them on: a dead end, parked here.
  none: (r) => !r.emailed_at && !r.email && !r.phone && r.inbox_enabled === "neither",
  // Freshly scraped and not yet triaged into a channel.
  new: (r) => r.is_new && !r.emailed_at && !IN.email(r) && !IN.inbox(r) && !IN.call(r) && !IN.none(r),
};

const VIEWS: [View, string][] = [
  ["new", "New leads"],
  ["email", "Email"],
  ["inbox", "Inbox only"],
  ["call", "Call only"],
  ["none", "No contact"],
  ["contacted", "Contacted"],
  ["all", "All"],
];

const link = "text-accent underline underline-offset-4 hover:opacity-80";

function Ext({ href, children }: { href: string | null; children: React.ReactNode }) {
  if (!href) return <span className="text-text-muted">—</span>;
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={link}>
      {children}
    </a>
  );
}

/** The three hand-typed fields. Edits stay in a draft until Save is clicked. */
function Details({ r, onSave }: { r: Agency; onSave: (p: Partial<Agency>) => Promise<boolean> }) {
  const [email, setEmail] = useState(r.email ?? "");
  const [phone, setPhone] = useState(r.phone ?? "");
  const [inbox, setInbox] = useState(r.inbox_enabled);
  const [state, setState] = useState<"idle" | "saving" | "saved">("idle");
  const dirty = email.trim() !== (r.email ?? "") || phone.trim() !== (r.phone ?? "") || inbox !== r.inbox_enabled;

  async function submit() {
    setState("saving");
    const ok = await onSave({ email: email.trim() || null, phone: phone.trim() || null, inbox_enabled: inbox });
    setState(ok ? "saved" : "idle");
  }

  return (
    <>
      <label className="flex flex-col gap-1.5">
        <span className={label}>Email address</span>
        <input type="email" value={email} onChange={(e) => { setEmail(e.target.value); setState("idle"); }} className={input} />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className={label}>Phone number</span>
        <input type="tel" value={phone} onChange={(e) => { setPhone(e.target.value); setState("idle"); }} className={input} />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className={label}>LinkedIn inbox / email enabled</span>
        <select value={inbox} onChange={(e) => { setInbox(e.target.value); setState("idle"); }} className={input}>
          {INBOX.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </label>
      <div className="flex items-center gap-3 sm:col-span-2 lg:col-span-3">
        <button
          onClick={() => void submit()}
          disabled={!dirty || state === "saving"}
          className="h-9 rounded-full bg-white px-5 text-sm font-medium text-bg disabled:opacity-40"
        >
          {state === "saving" ? "Saving…" : "Save"}
        </button>
        {state === "saved" && !dirty && <span className="text-sm text-accent">Saved</span>}
      </div>
    </>
  );
}

function Info({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className={label}>{title}</span>
      <span className="text-sm text-text-primary">{children || <span className="text-text-muted">—</span>}</span>
    </div>
  );
}

/** B2B: every white-label agency partner. Email, phone and inbox are typed by hand; the rest is scraped. */
export function AgencyList() {
  const [rows, setRows] = useState<Agency[]>([]);
  const [q, setQ] = useState("");
  const [view, setView] = useState<View>("new");
  const [openId, setOpenId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void supabase
      .from(TABLE)
      .select("*")
      .order("date_added", { ascending: false })
      .order("agency_name")
      .limit(5000) // ponytail: PostgREST caps at 1000/page; raise via paging past 5k
      .then(({ data, error }) => (error ? setError(error.message) : setRows(data as Agency[])));
  }, []);

  async function save(id: string, patch: Partial<Agency>): Promise<boolean> {
    setError(null);
    const { error } = await supabase.from(TABLE).update(patch).eq("id", id);
    if (error) return setError(error.message), false; // e.g. email already on another agency
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)));
    return true;
  }

  const needle = q.toLowerCase();
  const count = Object.fromEntries(VIEWS.map(([v]) => [v, rows.filter(IN[v]).length])) as Record<View, number>;
  const shown = rows.filter(IN[view]).filter((r) =>
    [r.agency_name, r.target_niche, r.founder_name, r.country, r.email]
      .some((f) => f?.toLowerCase().includes(needle)),
  );

  return (
    <section className="mt-6">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="font-display text-lg tracking-display">
          Agencies <span className="text-text-muted">({shown.length})</span>
        </h2>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search name, niche, founder, country, email"
          className={`${input} h-9 max-w-sm text-sm`}
        />
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {VIEWS.map(([v, l]) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={cn(
              "h-9 rounded-full border px-4 text-sm transition-colors",
              view === v ? "border-white bg-white text-bg" : "border-border-subtle text-text-secondary hover:border-border-active",
            )}
          >
            {l} <span className="opacity-60">{count[v]}</span>
          </button>
        ))}
      </div>
      {error && (
        <p className="mt-4 rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-300">{error}</p>
      )}

      <ul className="mt-4 flex flex-col gap-2">
        {shown.map((r) => {
          const open = openId === r.id;
          return (
            <li key={r.id} className={cn(card, "transition-colors", open && "border-text-muted")}>
              <div
                role="button"
                tabIndex={0}
                onClick={() => setOpenId(open ? null : r.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setOpenId(open ? null : r.id);
                  }
                }}
                className="flex cursor-pointer flex-wrap items-center justify-between gap-x-4 gap-y-2 p-4"
              >
                <div className="min-w-0 flex-1 basis-56">
                  <p className="truncate font-medium text-text-primary">{r.agency_name}</p>
                  <p className="mt-0.5 truncate text-sm text-text-secondary">
                    {r.founder_name}
                    {r.founder_name && r.website && " · "}
                    {r.website && (
                      <a
                        href={r.website}
                        target="_blank"
                        rel="noreferrer noopener"
                        onClick={(e) => e.stopPropagation()}
                        className="text-accent underline decoration-accent/40 underline-offset-4 hover:decoration-accent"
                      >
                        {r.website.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "")}
                      </a>
                    )}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {r.country && (
                    <span className="hidden rounded-full bg-white/5 px-2.5 py-1 text-[11px] text-text-secondary sm:inline">
                      {r.country}
                    </span>
                  )}
                  {r.target_niche && (
                    <span className="hidden max-w-[16rem] truncate rounded-full bg-white/5 px-2.5 py-1 text-[11px] text-text-secondary sm:inline">
                      {r.target_niche}
                    </span>
                  )}
                  <span className="shrink-0 rounded-full border border-border-active px-2.5 py-1 text-[11px] text-text-secondary">
                    {r.emailed_at ? `emailed ${r.emailed_at.slice(0, 10)}` : "not emailed"}
                  </span>
                </div>
                <span aria-hidden className={cn("shrink-0 text-text-muted transition-transform duration-200", open && "rotate-180")}>
                  &#9662;
                </span>
              </div>

              {open && (
                <div className="grid gap-5 border-t border-border-subtle p-4 sm:grid-cols-2 lg:grid-cols-3">
                  <Info title="Niche">{r.target_niche}</Info>
                  <Info title="Country">{r.country}</Info>
                  <Info title="Added">{r.date_added}</Info>
                  <Info title="Founder / CEO">{r.founder_name}</Info>
                  <Info title="Founder LinkedIn">
                    {r.founder_linkedin && <a href={r.founder_linkedin} target="_blank" rel="noreferrer noopener" className={link}>Open profile</a>}
                  </Info>
                  <Info title="Agency LinkedIn">
                    {r.agency_linkedin && <a href={r.agency_linkedin} target="_blank" rel="noreferrer noopener" className={link}>Open company page</a>}
                  </Info>
                  <Details r={r} onSave={(p) => save(r.id, p)} />
                  <div className="sm:col-span-2 lg:col-span-3">
                    <button
                      onClick={() => save(r.id, { emailed_at: r.emailed_at ? null : new Date().toISOString() })}
                      className="h-9 rounded-full border border-dashed border-border-active px-4 text-sm text-text-secondary hover:border-white hover:text-text-primary"
                    >
                      {r.emailed_at ? "Clear emailed" : "Mark emailed"}
                    </button>
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
