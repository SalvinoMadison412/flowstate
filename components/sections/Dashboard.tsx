"use client";

import { Section, SectionHeading, SectionLabel } from "@/components/ui/Section";
import { FlowStateIcon } from "@/components/ui/Logo";
import { CountUp } from "@/components/ui/CountUp";
import { cn } from "@/lib/utils";
import { useReveal } from "@/lib/useReveal";

const NAV_ITEMS = ["Overview", "Citations", "AI Mentions", "Competitors", "Reports"];

const CITATION_SOURCES = [
  { label: "Wikipedia", value: 92 },
  { label: "G2 / Capterra", value: 74 },
  { label: "Reddit", value: 61 },
  { label: "Industry blogs", value: 48 },
  { label: "News / PR", value: 33 },
  { label: "YouTube", value: 21 },
];

const PLATFORMS = [
  { name: "ChatGPT", status: "active" },
  { name: "Gemini", status: "active" },
  { name: "Perplexity", status: "partial" },
  { name: "Claude", status: "partial" },
  { name: "Copilot", status: "absent" },
] as const;

const QUERIES = [
  { q: "best project management tool for remote teams", state: "ranked" },
  { q: "asana vs monday vs [brand]", state: "ranked" },
  { q: "how to run async standups", state: "ranked" },
  { q: "tools that integrate with slack and github", state: "partial" },
  { q: "cheapest gantt chart software", state: "partial" },
  { q: "project management software with AI", state: "missing" },
];

const STATUS_DOT: Record<string, string> = {
  active: "bg-white",
  partial: "bg-text-muted",
  absent: "bg-border-active",
};

/** Arc gauge — animates stroke-dashoffset via CSS transition on scroll-enter. */
function Gauge({ shown }: { shown: boolean }) {
  const radius = 76;
  const circumference = 2 * Math.PI * radius;
  const sweep = 0.75; // 270deg arc
  const target = 68 / 100;
  const trackLen = circumference * sweep;
  const fillLen = trackLen * target;

  return (
    <div className="relative flex h-[180px] w-[180px] items-center justify-center">
      <svg viewBox="0 0 180 180" className="h-full w-full -rotate-[135deg]">
        <circle
          cx="90"
          cy="90"
          r={radius}
          fill="none"
          stroke="#1E1E1E"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={`${trackLen} ${circumference}`}
        />
        <circle
          cx="90"
          cy="90"
          r={radius}
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={`${fillLen} ${circumference}`}
          strokeDashoffset={0}
          className={shown ? "anim-gauge" : undefined}
          style={{ ["--from" as string]: `${fillLen}` }}
        />
        {/* cyan accent only at the arc's leading tip */}
        <circle
          cx="90"
          cy="90"
          r={radius}
          fill="none"
          stroke="#00C8F0"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={`3 ${circumference}`}
          strokeDashoffset={-fillLen + 3}
          className={shown ? "anim-gauge" : undefined}
          style={{ ["--from" as string]: "0" }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="font-display text-4xl font-bold text-text-primary">
          <CountUp to={68} duration={1.6} />
        </span>
        <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-text-secondary">
          / 100
        </span>
      </div>
    </div>
  );
}

export function Dashboard() {
  const { ref, shown } = useReveal<HTMLDivElement>();

  return (
    <Section id="dashboard">
      <SectionLabel>The platform</SectionLabel>
      <SectionHeading className="mt-4 max-w-2xl">
        See exactly where AI puts you — and where it doesn&rsquo;t.
      </SectionHeading>

      <div
        ref={ref}
        className={cn(
          "reveal mt-12 overflow-hidden rounded-2xl border border-[#1E1E1E] bg-[#0E0E0E]",
          shown && "is-visible",
        )}
      >
        <div className="flex flex-col md:flex-row">
          {/* Sidebar */}
          <aside className="flex shrink-0 gap-3 border-b border-[#1E1E1E] p-4 md:w-52 md:flex-col md:border-b-0 md:border-r md:p-5">
            <div className="mb-0 flex items-center gap-2 md:mb-6">
              <FlowStateIcon className="h-6 w-6 text-white" />
              <span className="hidden font-mono text-xs uppercase tracking-[0.14em] text-text-secondary md:inline">
                Console
              </span>
            </div>
            <nav className="flex gap-1 overflow-x-auto md:flex-col">
              {NAV_ITEMS.map((item, i) => (
                <span
                  key={item}
                  className={cn(
                    "whitespace-nowrap rounded px-3 py-2 text-sm",
                    i === 0
                      ? "border-l-2 border-white bg-white/5 text-text-primary"
                      : "text-text-secondary",
                  )}
                >
                  {item}
                </span>
              ))}
            </nav>
          </aside>

          {/* Main panel */}
          <div className="min-w-0 flex-1 p-5 sm:p-7">
            {/* Top: gauge */}
            <div className="flex flex-col items-center gap-6 border-b border-[#1E1E1E] pb-7 sm:flex-row sm:items-center sm:gap-8">
              <Gauge shown={shown} />
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.16em] text-text-secondary">
                  AI Visibility Score
                </p>
                <p className="mt-2 max-w-sm text-sm leading-relaxed text-text-secondary">
                  A weighted composite of citation frequency, source trust, and
                  answer presence across tracked models.{" "}
                  <span className="text-accent">+22 in 90 days.</span>
                </p>
              </div>
            </div>

            {/* Middle row */}
            <div className="grid gap-7 border-b border-[#1E1E1E] py-7 lg:grid-cols-2">
              {/* Bar chart */}
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.16em] text-text-secondary">
                  Citation Sources
                </p>
                <div className="mt-5 space-y-3">
                  {CITATION_SOURCES.map((s, i) => (
                    <div key={s.label} className="flex items-center gap-3">
                      <span className="w-28 shrink-0 font-mono text-[11px] text-text-secondary">
                        {s.label}
                      </span>
                      <div className="h-2.5 flex-1 overflow-hidden rounded-sm bg-[#1A1A1A]">
                        <div
                          className={cn(
                            "h-full origin-left rounded-sm bg-white",
                            shown && "anim-grow-x",
                          )}
                          style={{
                            width: `${s.value}%`,
                            animationDelay: `${0.15 + i * 0.08}s`,
                          }}
                        />
                      </div>
                      <span className="w-8 shrink-0 text-right font-mono text-[11px] text-text-muted">
                        {s.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Platform coverage */}
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.16em] text-text-secondary">
                  Platform Coverage
                </p>
                <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {PLATFORMS.map((p) => (
                    <div
                      key={p.name}
                      className="flex items-center justify-between rounded-lg border border-[#1E1E1E] bg-[#121212] px-3 py-2.5"
                    >
                      <span className="text-sm text-text-primary">{p.name}</span>
                      <span className="flex items-center gap-2">
                        <span
                          className={cn(
                            "h-2 w-2 rounded-full",
                            STATUS_DOT[p.status],
                          )}
                        />
                        <span className="font-mono text-[10px] uppercase tracking-wider text-text-muted">
                          {p.status}
                        </span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom: trending queries */}
            <div className="pt-7">
              <p className="font-mono text-xs uppercase tracking-[0.16em] text-text-secondary">
                Trending Queries Where You Appear
              </p>
              <ul className="mt-4 space-y-1.5 font-mono text-[13px]">
                {QUERIES.map((row) => (
                  <li
                    key={row.q}
                    className="flex items-center gap-3 border-b border-[#161616] py-2 last:border-0"
                  >
                    <span
                      className={cn(
                        "h-1.5 w-1.5 shrink-0 rounded-full",
                        row.state === "ranked"
                          ? "bg-white"
                          : row.state === "partial"
                            ? "bg-text-muted"
                            : "bg-border-active",
                      )}
                    />
                    <span
                      className={
                        row.state === "missing"
                          ? "text-text-muted line-through"
                          : row.state === "partial"
                            ? "text-text-secondary"
                            : "text-text-primary"
                      }
                    >
                      &ldquo;{row.q}&rdquo;
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
}
