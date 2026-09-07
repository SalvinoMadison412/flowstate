"use client";

import { useCallback, useState } from "react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { CHANNELS, type Channel } from "@/lib/supabase";
import { parseSheet, type Sheet } from "@/lib/parseSheet";
import {
  FIELDS,
  guessMapping,
  buildDrafts,
  dedupeKey,
  existingKeys,
  insertLeads,
  type Field,
  type Mapping,
  type LeadDraft,
} from "@/lib/importLeads";
import { input, label, card } from "./ui";

type Step =
  | { k: "pick" }
  | { k: "parsing" }
  | { k: "map"; sheet: Sheet; mapping: Mapping; file: string }
  | { k: "writing"; done: number; total: number }
  | { k: "done"; added: number; skipped: number };

/**
 * Drop a .xlsx or .csv, confirm how its columns map onto the CRM, see what will
 * be skipped, then write. Nothing is inserted until the user confirms.
 */
export function ImportDialog({
  channel,
  onClose,
  onImported,
}: {
  channel: Channel;
  onClose: () => void;
  onImported: () => void;
}) {
  const [step, setStep] = useState<Step>({ k: "pick" });
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [dupes, setDupes] = useState(0);

  const take = useCallback(async (file: File) => {
    setError(null);
    setStep({ k: "parsing" });
    try {
      const sheet = await parseSheet(file);
      setStep({
        k: "map",
        sheet,
        mapping: guessMapping(sheet.headers),
        file: file.name,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setStep({ k: "pick" });
    }
  }, []);

  async function commit(sheet: Sheet, mapping: Mapping) {
    setError(null);
    try {
      const { drafts } = buildDrafts(sheet.rows, mapping, channel);
      const already = await existingKeys(channel);
      const fresh: LeadDraft[] = [];
      let dup = 0;
      for (const d of drafts) {
        const k = dedupeKey(d);
        if (k && already.has(k)) dup++;
        else fresh.push(d);
      }

      setStep({ k: "writing", done: 0, total: fresh.length });
      await insertLeads(fresh, (done) =>
        setStep({ k: "writing", done, total: fresh.length }),
      );
      setStep({
        k: "done",
        added: fresh.length,
        skipped: sheet.rows.length - fresh.length,
      });
      setDupes(dup);
      onImported();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setStep({ k: "pick" });
    }
  }

  return (
    <div className={cn(card, "mt-4 p-5")}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-display text-lg tracking-display">
            Import into {CHANNELS[channel].label}
          </h3>
          <p className="mt-1 text-sm text-text-secondary">
            .xlsx or .csv — first row must be the header.
          </p>
        </div>
        <button
          onClick={onClose}
          className="text-sm text-text-secondary hover:text-text-primary"
        >
          Close
        </button>
      </div>

      {error && (
        <p className="mt-4 rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-300">
          {error}
        </p>
      )}

      {(step.k === "pick" || step.k === "parsing") && (
        <label
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            const f = e.dataTransfer.files[0];
            if (f) void take(f);
          }}
          className={cn(
            "mt-5 flex h-44 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed text-center transition-colors",
            dragging
              ? "border-accent bg-accent-glow"
              : "border-border-active hover:border-text-muted",
          )}
        >
          <input
            type="file"
            accept=".xlsx,.xlsm,.csv,.tsv,.txt"
            className="sr-only"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void take(f);
              e.target.value = "";
            }}
          />
          {step.k === "parsing" ? (
            <p className="text-sm text-text-secondary">Reading…</p>
          ) : (
            <>
              <p className="text-base text-text-primary">
                Drop a spreadsheet here
              </p>
              <p className="mt-1 text-sm text-text-muted">or click to choose</p>
            </>
          )}
        </label>
      )}

      {step.k === "map" && (
        <MapStep
          step={step}
          onBack={() => setStep({ k: "pick" })}
          onChange={(mapping) => setStep({ ...step, mapping })}
          onCommit={() => commit(step.sheet, step.mapping)}
        />
      )}

      {step.k === "writing" && (
        <div className="mt-6">
          <p className="text-sm text-text-secondary">
            Importing {step.done} / {step.total}…
          </p>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full bg-accent transition-all"
              style={{
                width: `${step.total ? (step.done / step.total) * 100 : 0}%`,
              }}
            />
          </div>
        </div>
      )}

      {step.k === "done" && (
        <div className="mt-6">
          <p className="font-mono text-3xl text-accent">{step.added}</p>
          <p className="mt-1 text-sm text-text-secondary">
            leads imported
            {step.skipped > 0 &&
              ` · ${step.skipped} skipped${dupes ? ` (${dupes} already in the CRM)` : ""}`}
          </p>
          <div className="mt-4 flex gap-2">
            <Button onClick={() => setStep({ k: "pick" })} variant="ghost" size="md">
              Import another
            </Button>
            <Button onClick={onClose} size="md">
              Done
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function MapStep({
  step,
  onBack,
  onChange,
  onCommit,
}: {
  step: Extract<Step, { k: "map" }>;
  onBack: () => void;
  onChange: (m: Mapping) => void;
  onCommit: () => void;
}) {
  const { sheet, mapping, file } = step;
  const { drafts, skipped } = buildDrafts(sheet.rows, mapping, "cold_call");
  const hasName = mapping.includes("name");

  return (
    <div className="mt-5">
      <p className="text-sm text-text-secondary">
        <span className="text-text-primary">{file}</span> — {sheet.rows.length}{" "}
        rows, {sheet.headers.length} columns
      </p>

      <p className={cn(label, "mt-5 block")}>Match columns</p>
      <div className="mt-2 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
        {sheet.headers.map((h, i) => (
          <div
            key={i}
            className="rounded-xl border border-border-subtle bg-surface-elevated p-3"
          >
            <p className="truncate text-xs text-text-muted" title={h}>
              {h}
            </p>
            <select
              value={mapping[i] ?? ""}
              onChange={(e) => {
                const next = [...mapping];
                const v = (e.target.value || null) as Field | null;
                // A field can only be claimed once.
                if (v) next.forEach((m, j) => { if (m === v && j !== i) next[j] = null; });
                next[i] = v;
                onChange(next);
              }}
              className={cn(input, "mt-1.5 h-9 text-sm")}
            >
              <option value="">— ignore —</option>
              {FIELDS.map((f) => (
                <option key={f.key} value={f.key}>
                  {f.label}
                </option>
              ))}
            </select>
            <p className="mt-1.5 truncate text-xs text-text-secondary">
              {sheet.rows[0]?.[i] || <span className="text-text-muted">—</span>}
            </p>
          </div>
        ))}
      </div>

      {!hasName && (
        <p className="mt-4 rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-300">
          Map one column to <strong>Name</strong> — it&apos;s the only required
          field.
        </p>
      )}

      {hasName && (
        <>
          <p className={cn(label, "mt-6 block")}>Preview</p>
          <div className="mt-2 overflow-x-auto rounded-xl border border-border-subtle">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="bg-surface-elevated text-xs uppercase tracking-wide text-text-muted">
                <tr>
                  {FIELDS.filter((f) => mapping.includes(f.key)).map((f) => (
                    <th key={f.key} className="px-3 py-2 font-normal">
                      {f.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {drafts.slice(0, 5).map((d, i) => (
                  <tr key={i} className="border-t border-border-subtle">
                    {FIELDS.filter((f) => mapping.includes(f.key)).map((f) => (
                      <td
                        key={f.key}
                        className="max-w-[220px] truncate px-3 py-2 text-text-secondary"
                      >
                        {String(d[f.key as keyof typeof d] ?? "") || "—"}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="mt-3 text-xs text-text-muted">
            {drafts.length} rows ready
            {skipped.length > 0 &&
              ` · ${skipped.length} will be skipped (${skipped[0].reason}${
                skipped.length > 1 ? ", …" : ""
              })`}
            . Leads already in this channel are skipped. Rows with a
            first-contact date get a matching history entry, so they start at
            &ldquo;initial attempt&rdquo; rather than &ldquo;not
            contacted&rdquo;.
          </p>
        </>
      )}

      <div className="mt-5 flex gap-2">
        <Button onClick={onBack} variant="ghost" size="md">
          Choose another file
        </Button>
        <Button onClick={onCommit} disabled={!hasName || !drafts.length} size="md">
          Import {drafts.length} leads
        </Button>
      </div>
    </div>
  );
}
