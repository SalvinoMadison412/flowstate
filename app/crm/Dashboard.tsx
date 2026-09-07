"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  supabase,
  CHANNELS,
  CHANNEL_KEYS,
  STAGES,
  LEADS_VIEW,
  TIME_TABLE,
  today,
  type Channel,
  type Lead,
} from "@/lib/supabase";
import { formatDuration } from "@/lib/duration";
import { card, label } from "./ui";

type ChannelTotals = {
  due: number;
  upcoming: number;
  cold: number;
  stages: Record<string, number>;
};

const blank = (): ChannelTotals => ({
  due: 0,
  upcoming: 0,
  cold: 0,
  stages: {},
});

export function Dashboard() {
  const [totals, setTotals] = useState<Record<Channel, ChannelTotals>>({
    cold_call: blank(),
    outreach: blank(),
  });
  const [dueList, setDueList] = useState<Lead[]>([]);
  const [time, setTime] = useState<{
    all: number;
    week: number;
    top: { name: string; seconds: number }[];
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function run() {
      const base = (ch: Channel) =>
        supabase
          .from(LEADS_VIEW)
          .select("id", { count: "exact", head: true })
          .eq("channel", ch);

      const [counts, due] = await Promise.all([
        Promise.all(
          CHANNEL_KEYS.map(async (ch) => {
            const [d, u, c, ...byStage] = await Promise.all([
              base(ch).lte("next_followup_at", today()),
              base(ch).gt("next_followup_at", today()),
              base(ch).is("first_contacted_at", null),
              ...STAGES.map((s) => base(ch).eq("stage", s.key)),
            ]);
            return [
              ch,
              {
                due: d.count ?? 0,
                upcoming: u.count ?? 0,
                cold: c.count ?? 0,
                stages: Object.fromEntries(
                  STAGES.map((s, i) => [s.key, byStage[i].count ?? 0]),
                ),
              },
            ] as const;
          }),
        ),
        supabase
          .from(LEADS_VIEW)
          .select("*")
          .not("next_followup_at", "is", null)
          .lte("next_followup_at", today())
          .order("next_followup_at", { ascending: true })
          .limit(25),
      ]);

      setTotals(
        Object.fromEntries(counts) as Record<Channel, ChannelTotals>,
      );
      setDueList((due.data ?? []) as Lead[]);
      setLoading(false);

      // Time on leads — few rows for a long while, so total it client-side.
      const { data: entries } = await supabase
        .from(TIME_TABLE)
        .select("seconds, occurred_on, lead:crm_leads(name)")
        .limit(5000);
      const weekAgo = today(-7);
      let all = 0;
      let week = 0;
      const byLead = new Map<string, number>();
      for (const r of (entries ?? []) as unknown as {
        seconds: number;
        occurred_on: string;
        // PostgREST returns the FK embed as a single object (or null).
        lead: { name: string } | null;
      }[]) {
        all += r.seconds;
        if (r.occurred_on >= weekAgo) week += r.seconds;
        const nm = r.lead?.name ?? "—";
        byLead.set(nm, (byLead.get(nm) ?? 0) + r.seconds);
      }
      setTime({
        all,
        week,
        top: [...byLead.entries()]
          .map(([name, seconds]) => ({ name, seconds }))
          .sort((a, b) => b.seconds - a.seconds)
          .slice(0, 5),
      });
    }
    void run();
  }, []);

  return (
    <>
      <div className="mt-6 grid gap-4 xl:grid-cols-2">
        {CHANNEL_KEYS.map((ch) => {
          const cfg = CHANNELS[ch];
          const t = totals[ch];
          return (
            <div key={ch} className={cn(card, "p-5")}>
              <div className="flex items-baseline justify-between gap-3">
                <Link
                  href={cfg.href}
                  className="font-display text-xl tracking-display hover:text-accent"
                >
                  {cfg.label}
                </Link>
                <span className="text-xs text-text-muted">{cfg.market}</span>
              </div>

              <div className="mt-4 flex gap-8">
                <Metric value={t.due} text="Due" accent={t.due > 0} />
                <Metric value={t.upcoming} text="Upcoming" />
                <Metric value={t.cold} text="Not contacted" />
              </div>

              {/* Sequence breakdown — how many sit at each follow-up step. */}
              <div className="mt-5 grid grid-cols-7 gap-1.5">
                {STAGES.map((s) => (
                  <Link
                    key={s.key}
                    href={`${cfg.href}?stage=${s.key}`}
                    className="rounded-lg border border-border-subtle px-1.5 py-2 text-center transition-colors hover:border-text-muted"
                  >
                    <span
                      className={cn(
                        "block font-mono text-base",
                        t.stages[s.key]
                          ? "text-text-primary"
                          : "text-text-muted",
                      )}
                    >
                      {t.stages[s.key] ?? 0}
                    </span>
                    <span className="mt-0.5 block font-mono text-[10px] text-text-muted">
                      {s.short}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {time && time.all > 0 && (
        <>
          <p className={cn(label, "mt-10 block")}>Time on leads</p>
          <div className="mt-3 grid gap-4 lg:grid-cols-[minmax(0,20rem)_1fr]">
            <div className={cn(card, "flex gap-8 p-5")}>
              <Metric value={formatDuration(time.week)} text="Last 7 days" />
              <Metric value={formatDuration(time.all)} text="All time" />
            </div>
            <div className={cn(card, "p-5")}>
              <p className="text-[11px] uppercase tracking-wide text-text-muted">
                Most time spent
              </p>
              <ul className="mt-3 flex flex-col gap-1.5">
                {time.top.map((r) => (
                  <li
                    key={r.name}
                    className="flex justify-between gap-4 text-sm"
                  >
                    <span className="truncate text-text-secondary">
                      {r.name}
                    </span>
                    <span className="shrink-0 font-mono text-text-primary">
                      {formatDuration(r.seconds)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </>
      )}

      <p className={cn(label, "mt-10 block")}>Due today &amp; overdue</p>

      {loading ? (
        <p className="mt-3 text-sm text-text-muted">Loading…</p>
      ) : dueList.length === 0 ? (
        <p className="mt-3 text-sm text-text-muted">
          Nothing due across either channel.
        </p>
      ) : (
        <ul className="mt-3 grid gap-2 xl:grid-cols-2">
          {dueList.map((l) => {
            const overdue = (l.next_followup_at ?? "") < today();
            const stage = STAGES.find((s) => s.key === l.stage);
            return (
              <li key={l.id}>
                <Link
                  href={CHANNELS[l.channel].href}
                  className={cn(
                    card,
                    "flex items-center justify-between gap-4 p-3.5 transition-colors hover:border-text-muted",
                  )}
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-text-primary">
                      {l.name}
                    </p>
                    <p className="truncate text-xs text-text-secondary">
                      {[l.company, l.phone || l.contact || l.email]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full bg-white/5 px-2 py-1 font-mono text-[11px] text-text-secondary">
                    {stage?.short}
                  </span>
                  <div className="w-28 shrink-0 text-right">
                    <p
                      className={cn(
                        "font-mono text-xs",
                        overdue ? "text-red-400" : "text-accent",
                      )}
                    >
                      {l.next_followup_at}
                    </p>
                    <p className="mt-0.5 text-[11px] text-text-muted">
                      {l.channel === "cold_call" ? "Call" : "IG / email"}
                    </p>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}

function Metric({
  value,
  text,
  accent = false,
}: {
  value: number | string;
  text: string;
  accent?: boolean;
}) {
  return (
    <div>
      <p
        className={cn(
          "font-mono text-3xl",
          accent ? "text-accent" : "text-text-primary",
        )}
      >
        {value}
      </p>
      <p className="mt-0.5 text-[11px] uppercase tracking-wide text-text-muted">
        {text}
      </p>
    </div>
  );
}
