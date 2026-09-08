"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { IconPencil } from "@/components/ui/icons";
import { cn } from "@/lib/utils";
import {
  supabase,
  STATUSES,
  CHANNELS,
  TOUCH_COLS,
  TIME_TABLE,
  today,
  igUrl,
  siteUrl,
  prettyUrl,
  type Channel,
  type Lead,
  type Status,
  type Touch,
} from "@/lib/supabase";
import { originFlag } from "@/lib/origin";
import { formatDuration, stopwatch } from "@/lib/duration";
import { input, label } from "./ui";

function ExternalLink({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer noopener"
      className="group flex items-baseline gap-2 text-sm"
    >
      <span className="w-20 shrink-0 text-xs uppercase tracking-wide text-text-muted">
        {label}
      </span>
      <span className="truncate text-accent underline decoration-accent/40 underline-offset-4 group-hover:decoration-accent">
        {children}
      </span>
      <span aria-hidden className="shrink-0 text-xs text-text-muted">
        &#8599;
      </span>
    </a>
  );
}

/**
 * Everything you do to one lead: quick action, status, next follow-up, notes,
 * the log form, and the history. Rendered inline on mobile and in the right
 * panel on desktop.
 */
export function LeadDetail({
  lead,
  viewChannel,
  categories,
  onPatch,
  onLogged,
  onError,
  timerRunning,
  timerSeconds,
  onStartTimer,
  onStopTimer,
}: {
  lead: Lead;
  /** The queue this panel was opened from — see LeadRow. */
  viewChannel: Channel;
  categories: string[];
  onPatch: (id: string, fields: Partial<Lead>) => Promise<unknown>;
  onLogged: () => void;
  onError: (m: string) => void;
  timerRunning: boolean;
  timerSeconds: number;
  onStartTimer: () => void;
  onStopTimer: () => void;
}) {
  const cfg = CHANNELS[viewChannel];
  const isCall = viewChannel === "cold_call";
  const ig = lead.contact ? igUrl(lead.contact) : null;
  const site = lead.website ? siteUrl(lead.website) : null;

  const [touches, setTouches] = useState<Touch[] | null>(null);
  const [notes, setNotes] = useState(lead.notes ?? "");
  const [logDate, setLogDate] = useState(today());
  const [logNote, setLogNote] = useState("");
  const [outcome, setOutcome] = useState<string>(cfg.outcomes[0]);
  const [nextDate, setNextDate] = useState(today(cfg.gap));
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(false);

  // Reset per-lead state when the panel switches to a different lead.
  useEffect(() => {
    setTouches(null);
    setNotes(lead.notes ?? "");
    setLogNote("");
    setOutcome(cfg.outcomes[0]);
    setLogDate(today());
    setNextDate(today(cfg.gap));
    setEditing(false);
  }, [lead.id, lead.notes, cfg]);

  useEffect(() => {
    if (touches) return;
    void supabase
      .from("crm_touches")
      .select(TOUCH_COLS)
      .eq("lead_id", lead.id)
      .order("occurred_on", { ascending: false })
      .then(({ data, error }) =>
        error ? onError(error.message) : setTouches(data as Touch[]),
      );
  }, [touches, lead.id, onError]);

  async function logContact() {
    setBusy(true);
    const { data, error } = await supabase
      .from("crm_touches")
      .insert({
        lead_id: lead.id,
        occurred_on: logDate,
        outcome,
        note: logNote.trim() || null,
      })
      .select(TOUCH_COLS)
      .single();

    if (error) {
      onError(error.message);
      setBusy(false);
      return;
    }

    setTouches((t) => [data as Touch, ...(t ?? [])]);
    await onPatch(lead.id, {
      // Only the first touch sets this; later ones leave it alone.
      first_contacted_at: lead.first_contacted_at ?? logDate,
      next_followup_at: nextDate || null,
      status: lead.status === "new" ? "contacted" : lead.status,
    });
    setLogNote("");
    setBusy(false);
    onLogged();
  }

  return (
    <div className="flex flex-col gap-5 p-4 lg:p-5">
      {editing ? null : (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          {lead.category && (
            <span className="rounded-full bg-accent-glow px-3 py-1 text-xs text-accent">
              {lead.category}
            </span>
          )}
          <OriginBadge country={lead.country} onEdit={() => setEditing(true)} />
          {lead.description && (
            <p className="w-full text-sm leading-relaxed text-text-secondary">
              {lead.description}
            </p>
          )}
        </div>
      )}

      <LeadTimer
        leadId={lead.id}
        running={timerRunning}
        seconds={timerSeconds}
        onStart={onStartTimer}
        onStop={onStopTimer}
        onError={onError}
      />

      <div className="grid gap-5 lg:grid-cols-3 lg:gap-6">
        <div className="flex flex-col gap-4">
          {isCall && lead.phone && (
            <Button href={`tel:${lead.phone.replace(/\s/g, "")}`} size="lg">
              Call {lead.phone}
            </Button>
          )}
          {editing ? (
            <EditFields
              lead={lead}
              categories={categories}
              onCancel={() => setEditing(false)}
              onSave={async (fields) => {
                await onPatch(lead.id, fields);
                setEditing(false);
              }}
            />
          ) : (
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 flex-col gap-1.5">
                {ig && (
                  <ExternalLink href={ig} label="Instagram">
                    {lead.contact?.startsWith("@")
                      ? lead.contact
                      : `@${prettyUrl(ig).replace(/^instagram\.com\//, "")}`}
                  </ExternalLink>
                )}
                {site && (
                  <ExternalLink href={site} label="Website">
                    {prettyUrl(site)}
                  </ExternalLink>
                )}
                {!ig && !site && (
                  <p className="text-sm text-text-muted">No links on file.</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setEditing(true)}
                aria-label="Edit lead details"
                title="Edit lead details"
                className="shrink-0 rounded-lg border border-border-subtle p-2 text-text-secondary transition-colors hover:border-border-active hover:text-text-primary"
              >
                <IconPencil className="h-4 w-4" />
              </button>
            </div>
          )}
          {!isCall && lead.email && (
            <Button href={`mailto:${lead.email}`} variant="ghost" size="md">
              {lead.email}
            </Button>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className={label}>Status</p>
              <select
                value={lead.status}
                onChange={(e) =>
                  onPatch(lead.id, { status: e.target.value as Status })
                }
                className={cn(input, "mt-1 capitalize")}
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s} className="capitalize">
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <p className={label}>Next follow-up</p>
              <input
                type="date"
                value={lead.next_followup_at ?? ""}
                onChange={(e) =>
                  onPatch(lead.id, { next_followup_at: e.target.value || null })
                }
                className={cn(input, "mt-1")}
              />
            </div>
          </div>

          <div>
            <p className={label}>Notes</p>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              onBlur={() =>
                notes !== (lead.notes ?? "") &&
                onPatch(lead.id, { notes: notes || null })
              }
              className={cn(input, "mt-1 h-auto py-2")}
            />
          </div>
        </div>

        <div className="rounded-xl border border-border-subtle bg-surface-elevated p-3">
          <p className={label}>{isCall ? "Log call" : "Log contact"}</p>

          <div className="mt-2 flex flex-wrap gap-1.5">
            {cfg.outcomes.map((o) => (
              <button
                key={o}
                type="button"
                onClick={() => setOutcome(o)}
                className={cn(
                  "h-8 rounded-full border px-3 text-xs transition-colors",
                  outcome === o
                    ? "border-white bg-white text-bg"
                    : "border-border-active text-text-secondary hover:border-white",
                )}
              >
                {o}
              </button>
            ))}
          </div>

          <div className="mt-2 flex flex-col gap-2 sm:flex-row">
            <label className="flex-1 text-[11px] text-text-muted">
              {isCall ? "Called on" : "Contacted on"}
              <input
                type="date"
                value={logDate}
                onChange={(e) => setLogDate(e.target.value)}
                className={cn(input, "mt-1")}
              />
            </label>
            <label className="flex-1 text-[11px] text-text-muted">
              Then follow up on
              <input
                type="date"
                value={nextDate}
                onChange={(e) => setNextDate(e.target.value)}
                className={cn(input, "mt-1")}
              />
            </label>
          </div>
          <input
            placeholder="What happened? (optional)"
            value={logNote}
            onChange={(e) => setLogNote(e.target.value)}
            className={cn(input, "mt-2")}
          />
          <Button
            onClick={logContact}
            disabled={busy}
            size="md"
            className="mt-3 w-full"
          >
            {busy ? "…" : isCall ? "Log call" : "Log contact"}
          </Button>
        </div>

        <div className="lg:border-l lg:border-border-subtle lg:pl-6">
          <p className={label}>History</p>
          {touches === null ? (
            <p className="mt-2 text-sm text-text-muted">Loading…</p>
          ) : touches.length === 0 ? (
            <p className="mt-2 text-sm text-text-muted">No contact yet.</p>
          ) : (
            <ul className="mt-2 flex flex-col gap-2">
              {touches.map((t) => (
                <li key={t.id} className="flex gap-3 text-sm">
                  <span className="shrink-0 font-mono text-xs text-text-muted">
                    {t.occurred_on}
                  </span>
                  <span className="text-text-secondary">
                    <span className="text-text-primary">
                      {t.outcome ?? "Contacted"}
                    </span>
                    {t.note && ` — ${t.note}`}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * The lead panel's view of the shared stopwatch — the live readout plus the
 * total already banked for this lead. Running state and start/stop live in
 * LeadList (one timer at a time); this is just the panel's window onto it.
 */
function LeadTimer({
  leadId,
  running,
  seconds,
  onStart,
  onStop,
  onError,
}: {
  leadId: string;
  running: boolean;
  seconds: number;
  onStart: () => void;
  onStop: () => void;
  onError: (m: string) => void;
}) {
  const [logged, setLogged] = useState<number | null>(null);

  // Total banked for this lead. Refetch when a stint ends so it stays current.
  useEffect(() => {
    setLogged(null);
    void supabase
      .from(TIME_TABLE)
      .select("seconds")
      .eq("lead_id", leadId)
      .then(({ data, error }) => {
        if (error) onError(error.message);
        else
          setLogged((data ?? []).reduce((a, r) => a + (r.seconds as number), 0));
      });
  }, [leadId, running, onError]);

  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-border-subtle bg-surface-elevated px-3 py-2">
      <span className="flex items-baseline gap-2 text-sm">
        <span aria-hidden>⏱</span>
        {running ? (
          <span className="font-mono tabular-nums text-accent">
            {stopwatch(seconds)}
          </span>
        ) : (
          <span className="text-text-muted">
            {logged == null
              ? "…"
              : logged === 0
                ? "No time logged yet"
                : `${formatDuration(logged)} logged`}
          </span>
        )}
        {running && logged != null && logged > 0 && (
          <span className="text-text-muted">
            · {formatDuration(logged)} before
          </span>
        )}
      </span>
      <button
        type="button"
        onClick={running ? onStop : onStart}
        className={cn(
          "h-8 shrink-0 rounded-full border px-3 text-xs transition-colors",
          running
            ? "border-accent bg-accent-glow text-accent"
            : "border-border-active text-text-secondary hover:border-white hover:text-text-primary",
        )}
      >
        {running ? "Stop" : "Start timer"}
      </button>
    </div>
  );
}

/**
 * Lead origin, front and centre — it's the axis the whole cold-call pipeline is
 * split and measured on (India vs everywhere else), so a missing one is a hole
 * in the metrics and nags to be filled.
 */
function OriginBadge({
  country,
  onEdit,
}: {
  country: string | null;
  onEdit: () => void;
}) {
  if (!country)
    return (
      <button
        type="button"
        onClick={onEdit}
        className="rounded-full border border-accent/50 bg-accent-glow px-3 py-1 text-xs font-medium text-accent"
      >
        ⚠ Lead origin not set — add it
      </button>
    );
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-border-active bg-surface-elevated px-3 py-1 text-xs font-medium text-text-primary">
      <span aria-hidden>{originFlag(country)}</span>
      <span className="uppercase tracking-wide text-text-muted">Origin</span>
      {country}
    </span>
  );
}

/**
 * Fix the identity fields an import got wrong. Name is required and focused on
 * open; everything else is optional and clears to null when emptied.
 */
function EditFields({
  lead,
  categories,
  onCancel,
  onSave,
}: {
  lead: Lead;
  categories: string[];
  onCancel: () => void;
  onSave: (fields: Partial<Lead>) => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);

  const rows: { key: keyof Lead; label: string; type?: string }[] = [
    { key: "name", label: "Name" },
    { key: "company", label: "Company" },
    { key: "contact", label: "Instagram handle" },
    { key: "website", label: "Website" },
    { key: "email", label: "Email", type: "email" },
    { key: "phone", label: "Phone", type: "tel" },
    { key: "country", label: "Lead origin" },
    { key: "category", label: "Category" },
  ];

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const name = (f.get("name") as string).trim();
    if (!name) return;

    const fields: Partial<Lead> = { name };
    for (const r of [...rows, { key: "description" as keyof Lead }]) {
      if (r.key === "name") continue;
      const v = ((f.get(r.key) as string) ?? "").trim();
      (fields as Record<string, unknown>)[r.key] = v || null;
    }

    setBusy(true);
    await onSave(fields);
    setBusy(false);
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-2">
      {rows.map((r, i) => (
        <label key={r.key} className="flex items-center gap-2">
          <span className="w-24 shrink-0 text-xs uppercase tracking-wide text-text-muted">
            {r.label}
          </span>
          <input
            name={r.key}
            type={r.type ?? "text"}
            required={r.key === "name"}
            autoFocus={i === 0}
            list={r.key === "category" ? "crm-categories" : undefined}
            defaultValue={(lead[r.key] as string | null) ?? ""}
            className={cn(input, "h-9 text-sm")}
          />
        </label>
      ))}
      <datalist id="crm-categories">
        {categories.map((c) => (
          <option key={c} value={c} />
        ))}
      </datalist>

      <label className="flex flex-col gap-1">
        <span className="text-xs uppercase tracking-wide text-text-muted">
          Business description
        </span>
        <textarea
          name="description"
          rows={3}
          defaultValue={lead.description ?? ""}
          className={cn(input, "h-auto py-2 text-sm")}
        />
      </label>
      <div className="mt-1 flex gap-2">
        <Button type="submit" size="md" disabled={busy}>
          {busy ? "…" : "Save"}
        </Button>
        <Button type="button" onClick={onCancel} variant="ghost" size="md">
          Cancel
        </Button>
      </div>
    </form>
  );
}
