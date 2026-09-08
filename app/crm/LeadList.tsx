"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import {
  supabase,
  STATUSES,
  STAGES,
  CHANNELS,
  LEADS_VIEW,
  LEADS_TABLE,
  TIME_TABLE,
  today,
  igUrl,
  type Channel,
  type Lead,
  type Stage,
  type Status,
} from "@/lib/supabase";
import { originFilter, originFlag, type Origin } from "@/lib/origin";
import { stopwatch } from "@/lib/duration";
import { input, label, card } from "./ui";
import { LeadDetail } from "./LeadDetail";
import { ImportDialog } from "./ImportDialog";

const PAGE = 200;

type Filter = "due" | "all" | Status;
const FILTERS: Filter[] = ["due", "all", ...STATUSES];

/** One channel's pipeline: stage counts, filters, list, and the detail panel. */
export function LeadList({ channel }: { channel: Channel }) {
  const cfg = CHANNELS[channel];
  const isCall = channel === "cold_call";

  const [leads, setLeads] = useState<Lead[]>([]);
  const [counts, setCounts] = useState({ due: 0, upcoming: 0, uncontacted: 0 });
  const [stageCounts, setStageCounts] = useState<Record<string, number>>({});
  const [filter, setFilter] = useState<Filter>(() =>
    typeof window !== "undefined" && window.location.search.includes("stage=")
      ? "all"
      : "due",
  );
  // The dashboard deep-links here as ?stage=followup_3. Read once from the URL
  // rather than useSearchParams, which would force a Suspense boundary.
  const [stage, setStage] = useState<Stage | null>(() => {
    if (typeof window === "undefined") return null;
    const s = new URLSearchParams(window.location.search).get("stage");
    return STAGES.some((x) => x.key === s) ? (s as Stage) : null;
  });
  // Cold calls now span two markets. The toggle filters the whole page — list,
  // stats and stage counts — to India only, or to everything else. Remembered
  // across visits since it's the first thing you set each session.
  const [origin, setOrigin] = useState<Origin>(() => {
    if (typeof window === "undefined") return "india";
    try {
      return localStorage.getItem("crm.callOrigin") === "foreign"
        ? "foreign"
        : "india";
    } catch {
      return "india";
    }
  });

  const pickOrigin = useCallback((o: Origin) => {
    setOrigin(o);
    setLimit(PAGE);
    try {
      localStorage.setItem("crm.callOrigin", o);
    } catch {
      /* private mode — the toggle still works for this session */
    }
  }, []);

  const [search, setSearch] = useState("");
  const [limit, setLimit] = useState(PAGE);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);

  // One lead is on the clock at a time. Starting a timer opens that lead and
  // banks whatever was already running; the stint is saved on stop, on switch
  // to another lead, and when you leave the page. Collapsing the row does not
  // stop it — the row keeps ticking so you can scroll the list while timing.
  const [timer, setTimer] = useState<{ leadId: string; start: number } | null>(
    null,
  );
  const [, bump] = useState(0);

  useEffect(() => {
    if (!timer) return;
    const t = setInterval(() => bump((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, [timer]);

  const bankTimer = useCallback(
    async (t: { leadId: string; start: number }) => {
      // ponytail: idle time counts — no pause detection. A single stint is
      // clamped to 4h so a tab left open overnight can't poison the metrics.
      const secs = Math.min(Math.round((Date.now() - t.start) / 1000), 14400);
      if (secs < 5) return; // an accidental start → stop
      const { error } = await supabase
        .from(TIME_TABLE)
        .insert({ lead_id: t.leadId, seconds: secs });
      if (error) setError(error.message);
    },
    [],
  );

  const startTimer = useCallback(
    (leadId: string) => {
      setOpenId(leadId);
      if (timer?.leadId === leadId) return;
      if (timer) void bankTimer(timer);
      setTimer({ leadId, start: Date.now() });
    },
    [timer, bankTimer],
  );

  const stopTimer = useCallback(() => {
    if (timer) void bankTimer(timer);
    setTimer(null);
  }, [timer, bankTimer]);

  // Bank a running stint if the list unmounts (navigating away from the page).
  const timerRef = useRef(timer);
  timerRef.current = timer;
  useEffect(
    () => () => {
      if (timerRef.current) void bankTimer(timerRef.current);
    },
    [bankTimer],
  );
  const [adding, setAdding] = useState(false);
  const [importing, setImporting] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [category, setCategory] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    let q = supabase
      .from(LEADS_VIEW)
      .select("*")
      .contains("channels", [channel])
      .limit(limit);

    if (stage) q = q.eq("stage", stage);
    if (isCall) q = q.or(originFilter(origin));
    if (category) q = q.eq("category", category);

    if (filter === "due") {
      q = q
        .not("next_followup_at", "is", null)
        .lte("next_followup_at", today())
        .order("next_followup_at", { ascending: true });
    } else {
      if (filter !== "all") q = q.eq("status", filter);
      q = q.order("created_at", { ascending: false });
    }

    if (search.trim()) {
      const s = search.trim().replace(/[%,()]/g, "");
      q = q.or(
        ["name", "company", "email", "contact", "phone"]
          .map((c) => `${c}.ilike.%${s}%`)
          .join(","),
      );
    }

    const { data, error } = await q;
    if (error) setError(error.message);
    else {
      setError(null);
      setLeads(data as Lead[]);
    }
    setLoading(false);
  }, [channel, isCall, origin, category, filter, stage, search, limit]);

  const loadCounts = useCallback(async () => {
    const base = () => {
      let b = supabase
        .from(LEADS_VIEW)
        .select("id", { count: "exact", head: true })
        .contains("channels", [channel]);
      if (category) b = b.eq("category", category);
      return isCall ? b.or(originFilter(origin)) : b;
    };

    const [due, upcoming, uncontacted, ...byStage] = await Promise.all([
      base().lte("next_followup_at", today()),
      base().gt("next_followup_at", today()),
      base().is("first_contacted_at", null),
      ...STAGES.map((s) => base().eq("stage", s.key)),
    ]);

    setCounts({
      due: due.count ?? 0,
      upcoming: upcoming.count ?? 0,
      uncontacted: uncontacted.count ?? 0,
    });
    setStageCounts(
      Object.fromEntries(STAGES.map((s, i) => [s.key, byStage[i].count ?? 0])),
    );
  }, [channel, isCall, origin, category]);

  useEffect(() => {
    const t = setTimeout(load, search ? 300 : 0);
    return () => clearTimeout(t);
  }, [load, search]);

  useEffect(() => {
    void loadCounts();
  }, [loadCounts]);

  // The dropdown's own option list, scoped to this queue — India's spa-resort
  // categories have no business appearing in the US outreach filter.
  useEffect(() => {
    void supabase
      .from(LEADS_VIEW)
      .select("category")
      .contains("channels", [channel])
      .not("category", "is", null)
      .limit(2000)
      .then(({ data }) =>
        setCategories(
          [...new Set((data ?? []).map((r) => r.category as string))].sort(),
        ),
      );
  }, [channel, leads.length]);

  /**
   * Writes go to the base table; the list holds rows from the view, so patch it
   * in place rather than refetching and making the list jump under you.
   */
  const patch = useCallback(
    async (id: string, fields: Partial<Lead>) => {
      const { error } = await supabase
        .from(LEADS_TABLE)
        .update(fields)
        .eq("id", id);
      if (error) return setError(error.message);
      setLeads((ls) => ls.map((l) => (l.id === id ? { ...l, ...fields } : l)));
      void loadCounts();
    },
    [loadCounts],
  );

  return (
    <>
      <div className="mt-6 flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="font-display text-2xl tracking-display">{cfg.label}</h2>
        {isCall ? (
          <OriginToggle value={origin} onChange={pickOrigin} />
        ) : (
          <span className="text-sm text-text-muted">{cfg.market}</span>
        )}
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3">
        <Stat text="Due" value={counts.due} accent={counts.due > 0} />
        <Stat text="Upcoming" value={counts.upcoming} />
        <Stat text="Not contacted" value={counts.uncontacted} />
      </div>

      {/* Where every lead sits in the sequence — click one to filter to it. */}
      <p className={cn(label, "mt-8 block")}>Sequence stage</p>
      <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-7">
        {STAGES.map((s) => {
          const active = stage === s.key;
          return (
            <button
              key={s.key}
              onClick={() => {
                setStage(active ? null : s.key);
                setLimit(PAGE);
              }}
              className={cn(
                "rounded-xl border px-3 py-2.5 text-left transition-colors",
                active
                  ? "border-white bg-white text-bg"
                  : "border-border-subtle bg-surface hover:border-border-active",
              )}
            >
              <span
                className={cn(
                  "block font-mono text-xl",
                  !active &&
                    (stageCounts[s.key]
                      ? "text-text-primary"
                      : "text-text-muted"),
                )}
              >
                {stageCounts[s.key] ?? 0}
              </span>
              <span
                className={cn(
                  "mt-0.5 block text-[11px] leading-tight",
                  active ? "text-bg" : "text-text-muted",
                )}
              >
                {s.label}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-6 flex flex-col gap-3 lg:flex-row lg:items-center">
        <input
          type="search"
          placeholder={
            isCall
              ? "Search name, company, phone"
              : "Search name, company, handle"
          }
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={cn(input, "lg:max-w-sm")}
        />
        <select
          value={category ?? ""}
          onChange={(e) => {
            setCategory(e.target.value || null);
            setLimit(PAGE);
          }}
          className={cn(input, "lg:max-w-[14rem]")}
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => {
                setFilter(f);
                setLimit(PAGE);
              }}
              className={cn(
                "h-9 shrink-0 rounded-full border px-4 text-sm capitalize transition-colors",
                filter === f
                  ? "border-white bg-white text-bg"
                  : "border-border-subtle text-text-secondary hover:border-border-active",
              )}
            >
              {f}
            </button>
          ))}
        </div>
        <div className="flex shrink-0 gap-2 lg:ml-auto">
          <button
            onClick={() => {
              setImporting((v) => !v);
              setAdding(false);
            }}
            className="h-9 shrink-0 rounded-full border border-dashed border-border-active px-4 text-sm text-text-secondary hover:border-white hover:text-text-primary"
          >
            {importing ? "Cancel import" : "Import"}
          </button>
          <button
            onClick={() => {
              setAdding((v) => !v);
              setImporting(false);
            }}
            className="h-9 shrink-0 rounded-full border border-dashed border-border-active px-4 text-sm text-text-secondary hover:border-white hover:text-text-primary"
          >
            {adding ? "Cancel" : "+ Add lead"}
          </button>
        </div>
      </div>

      {(stage || filter !== "all" || category) && (
        <p className="mt-3 text-xs text-text-muted">
          Showing {leads.length}
          {stage && ` in ${STAGES.find((s) => s.key === stage)!.label}`}
          {filter !== "all" && ` · ${filter}`}
          {category && ` · ${category}`}
          <button
            onClick={() => {
              setStage(null);
              setFilter("all");
              setCategory(null);
            }}
            className="ml-2 underline underline-offset-2 hover:text-text-primary"
          >
            clear
          </button>
        </p>
      )}

      {importing && (
        <ImportDialog
          channel={channel}
          onClose={() => setImporting(false)}
          onImported={() => {
            void load();
            void loadCounts();
          }}
        />
      )}

      {adding && (
        <AddLead
          channel={channel}
          onDone={() => {
            setAdding(false);
            void load();
            void loadCounts();
          }}
          onError={setError}
        />
      )}

      {error && (
        <p className="mt-4 rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-300">
          {error}
        </p>
      )}

      <ul className="mt-4 flex flex-col gap-2">
        {leads.map((lead) => {
          const timing = timer?.leadId === lead.id;
          return (
            <LeadRow
              key={lead.id}
              lead={lead}
              viewChannel={channel}
              categories={categories}
              selected={openId === lead.id}
              onToggle={() => setOpenId(openId === lead.id ? null : lead.id)}
              onPatch={patch}
              onLogged={loadCounts}
              onError={setError}
              timerRunning={!!timing}
              timerSeconds={
                timing && timer
                  ? Math.max(0, Math.floor((Date.now() - timer.start) / 1000))
                  : 0
              }
              onStartTimer={() => startTimer(lead.id)}
              onStopTimer={stopTimer}
            />
          );
        })}
      </ul>

      {!loading && leads.length === 0 && (
        <p className="mt-10 text-center text-sm text-text-muted">
          {filter === "due" && !stage
            ? "Nothing due. Nice."
            : "No leads match these filters."}
        </p>
      )}

      {leads.length === limit && (
        <button
          onClick={() => setLimit((l) => l + PAGE)}
          className="mt-4 h-11 w-full rounded-xl border border-border-subtle text-sm text-text-secondary hover:border-border-active"
        >
          Load more
        </button>
      )}

    </>
  );
}

/** India ⇄ everywhere-else switch for the cold-call list. */
function OriginToggle({
  value,
  onChange,
}: {
  value: Origin;
  onChange: (o: Origin) => void;
}) {
  const opts: { key: Origin; flag: string; label: string }[] = [
    { key: "india", flag: "🇮🇳", label: "India" },
    { key: "foreign", flag: "🌐", label: "International" },
  ];
  return (
    <div className="flex rounded-full border border-border-subtle p-0.5">
      {opts.map((o) => (
        <button
          key={o.key}
          type="button"
          onClick={() => onChange(o.key)}
          aria-pressed={value === o.key}
          className={cn(
            "flex items-center gap-1.5 rounded-full px-3 py-1 text-sm transition-colors",
            value === o.key
              ? "bg-white text-bg"
              : "text-text-secondary hover:text-text-primary",
          )}
        >
          <span aria-hidden>{o.flag}</span>
          {o.label}
        </button>
      ))}
    </div>
  );
}

function Stat({
  text,
  value,
  accent = false,
}: {
  text: string;
  value: number;
  accent?: boolean;
}) {
  return (
    <div className="rounded-xl border border-border-subtle bg-surface px-4 py-4">
      <p
        className={cn(
          "font-mono text-3xl",
          accent ? "text-accent" : "text-text-primary",
        )}
      >
        {value}
      </p>
      <p className="mt-1 text-[11px] uppercase tracking-wide text-text-muted">
        {text}
      </p>
    </div>
  );
}

function StagePill({ stage }: { stage: Stage }) {
  const s = STAGES.find((x) => x.key === stage);
  if (!s) return null;
  return (
    <span className="shrink-0 rounded-full bg-white/5 px-2 py-1 font-mono text-[11px] text-text-secondary">
      {s.short}
    </span>
  );
}

/**
 * Per-row stopwatch control, sitting on the right edge of every row. Idle it's
 * just the ⏱ icon; running it shows the live m:ss and stops on click. Starting
 * also opens the row (the parent does that) so a click gets you straight to the
 * data with the clock already going.
 */
function TimerButton({
  running,
  seconds,
  onClick,
}: {
  running: boolean;
  seconds: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={running}
      title={running ? "Stop timer" : "Start timer & open lead"}
      className={cn(
        "flex shrink-0 items-center gap-1.5 self-stretch border-l border-border-subtle px-3 text-xs transition-colors",
        running
          ? "bg-accent-glow font-mono tabular-nums text-accent"
          : "text-text-muted hover:bg-white/5 hover:text-text-primary",
      )}
    >
      <span aria-hidden className="text-sm">
        ⏱
      </span>
      {running && <span>{stopwatch(seconds)}</span>}
    </button>
  );
}

function LeadRow({
  lead,
  viewChannel,
  categories,
  selected,
  onToggle,
  onPatch,
  onLogged,
  onError,
  timerRunning,
  timerSeconds,
  onStartTimer,
  onStopTimer,
}: {
  lead: Lead;
  /** The list this row is rendered in. A lead can be in both queues, so the
   *  row must follow the queue you are working, not the lead's primary. */
  viewChannel: Channel;
  categories: string[];
  selected: boolean;
  onToggle: () => void;
  onPatch: (id: string, fields: Partial<Lead>) => Promise<unknown>;
  onLogged: () => void;
  onError: (m: string) => void;
  timerRunning: boolean;
  timerSeconds: number;
  onStartTimer: () => void;
  onStopTimer: () => void;
}) {
  const isCall = viewChannel === "cold_call";
  const due = lead.next_followup_at;
  const overdue = due != null && due < today();
  const dueToday = due === today();
  const handle = isCall ? lead.phone : lead.contact || lead.email;
  // Only the IG handle is a link -- a phone or email has nothing to jump to here.
  const ig = !isCall && lead.contact ? igUrl(lead.contact) : null;

  return (
    <li className={cn(card, "transition-colors", selected && "border-text-muted")}>
      <div className="flex items-stretch">
      {/* div, not button: it needs to hold a real <a> for the IG link below,
          and a <button> can't legally contain another interactive element. */}
      <div
        role="button"
        tabIndex={0}
        onClick={onToggle}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onToggle();
          }
        }}
        className="flex min-w-0 flex-1 cursor-pointer flex-wrap items-center justify-between gap-x-4 gap-y-2 p-4 text-left"
      >
        <div className="min-w-0 flex-1 basis-56">
          <p className="truncate font-medium text-text-primary">{lead.name}</p>
          <p className="mt-0.5 truncate text-sm text-text-secondary">
            {lead.company}
            {lead.company && handle && " · "}
            {ig ? (
              <a
                href={ig}
                target="_blank"
                rel="noreferrer noopener"
                onClick={(e) => e.stopPropagation()}
                className="text-accent underline decoration-accent/40 underline-offset-4 hover:decoration-accent"
              >
                {handle}
              </a>
            ) : (
              handle
            )}
            {!lead.company && !handle && "—"}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <span
            aria-hidden
            title={lead.country ? `Origin: ${lead.country}` : "Origin not set"}
            className={cn("shrink-0 text-sm", !lead.country && "opacity-40")}
          >
            {lead.country ? originFlag(lead.country) : "🌐"}
          </span>
          {lead.category && (
            <span className="hidden shrink-0 rounded-full bg-white/5 px-2.5 py-1 text-[11px] text-text-secondary sm:inline">
              {lead.category}
            </span>
          )}
          <StagePill stage={lead.stage} />
          <span className="shrink-0 rounded-full border border-border-active px-2.5 py-1 text-[11px] capitalize text-text-secondary">
            {lead.status}
          </span>
        </div>

        <p className="shrink-0 font-mono text-xs text-text-muted sm:w-44 sm:text-right">
          <span className="whitespace-nowrap">
            {lead.first_contacted_at
              ? `1st ${lead.first_contacted_at}`
              : "never contacted"}
          </span>
          {due && (
            <>
              {" · "}
              <span
                className={cn(
                  "whitespace-nowrap",
                  overdue && "text-red-400",
                  dueToday && "text-accent",
                )}
              >
                next {due}
              </span>
            </>
          )}
        </p>

        <span
          aria-hidden
          className={cn(
            "shrink-0 text-text-muted transition-transform duration-200",
            selected && "rotate-180",
          )}
        >
          &#9662;
        </span>
      </div>
        <TimerButton
          running={timerRunning}
          seconds={timerSeconds}
          onClick={timerRunning ? onStopTimer : onStartTimer}
        />
      </div>

      {selected && (
        <div className="border-t border-border-subtle">
          <LeadDetail
            lead={lead}
            viewChannel={viewChannel}
            categories={categories}
            onPatch={onPatch}
            onLogged={onLogged}
            onError={onError}
            timerRunning={timerRunning}
            timerSeconds={timerSeconds}
            onStartTimer={onStartTimer}
            onStopTimer={onStopTimer}
          />
        </div>
      )}
    </li>
  );
}

function AddLead({
  channel,
  onDone,
  onError,
}: {
  channel: Channel;
  onDone: () => void;
  onError: (m: string) => void;
}) {
  const isCall = channel === "cold_call";
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    const f = new FormData(e.currentTarget);
    const str = (k: string) => ((f.get(k) as string) ?? "").trim() || null;

    const { error } = await supabase.from(LEADS_TABLE).insert({
      channel,
      channels: [channel],
      name: (f.get("name") as string).trim(),
      company: str("company"),
      email: str("email"),
      contact: str("contact"),
      website: str("website"),
      phone: str("phone"),
      country: str("country"),
      first_contacted_at: str("first_contacted_at"),
      next_followup_at: str("next_followup_at"),
      status: str("first_contacted_at") ? "contacted" : "new",
    });

    setBusy(false);
    if (error) onError(error.message);
    else onDone();
  }

  return (
    <form onSubmit={submit} className={cn(card, "mt-4 p-4")}>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <input name="name" required placeholder="Name" className={input} />
        <input name="company" placeholder="Company" className={input} />
        {isCall && (
          <input name="phone" type="tel" placeholder="Phone" className={input} />
        )}
        <input name="contact" placeholder="Instagram handle" className={input} />
        <input name="website" placeholder="Website" className={input} />
        <input name="email" type="email" placeholder="Email" className={input} />
        <input
          name="country"
          placeholder={
            isCall ? "Lead origin (IN, US, AE…)" : "Lead origin (FR, US…)"
          }
          className={input}
        />
        <div className="grid grid-cols-2 gap-3">
          <label className="text-[11px] text-text-muted">
            First contacted
            <input
              name="first_contacted_at"
              type="date"
              className={cn(input, "mt-1")}
            />
          </label>
          <label className="text-[11px] text-text-muted">
            Next follow-up
            <input
              name="next_followup_at"
              type="date"
              className={cn(input, "mt-1")}
            />
          </label>
        </div>
      </div>
      <Button
        type="submit"
        disabled={busy}
        size="lg"
        className="mt-4 w-full sm:w-auto sm:px-10"
      >
        {busy ? "…" : "Save lead"}
      </Button>
    </form>
  );
}
