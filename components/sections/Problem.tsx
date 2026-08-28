"use client";

import { Section, SectionHeading, SectionLabel } from "@/components/ui/Section";
import { Reveal } from "@/components/ui/Reveal";
import { CountUp } from "@/components/ui/CountUp";

const OLD_WORLD = [
  "Keyword rankings",
  "Backlink counts",
  "Domain authority",
  "SERP position tracking",
  "Meta tag optimization",
];

const NEW_WORLD = [
  "AI citations",
  "LLM source trust",
  "Generative answer presence",
  "Entity recognition",
  "Retrieval-layer visibility",
];

const STATS = [
  {
    value: 72,
    suffix: "%",
    label: "of AI responses cite fewer than 5 sources",
    accent: true,
  },
  {
    value: 46,
    suffix: "%",
    label: "of searches now show AI Overviews",
    accent: false,
  },
  {
    value: 3.2,
    suffix: "×",
    decimals: 1,
    label: "more conversions from AI-referred traffic",
    accent: false,
  },
];

export function Problem() {
  return (
    <Section id="problem">
      <SectionLabel>The problem</SectionLabel>
      <SectionHeading className="mt-4 max-w-2xl">
        Traditional SEO can&rsquo;t see what AI sees.
      </SectionHeading>

      <div className="mt-14 grid gap-4 md:grid-cols-2">
        {/* Old World */}
        <div className="rounded-2xl border border-border-subtle bg-surface p-7 opacity-60 grayscale">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs uppercase tracking-[0.18em] text-text-muted">
              Old World
            </span>
            <span className="font-mono text-xs text-text-muted">2004&ndash;2023</span>
          </div>
          <ul className="mt-6 space-y-3">
            {OLD_WORLD.map((item) => (
              <li
                key={item}
                className="flex items-center gap-3 text-text-secondary line-through decoration-text-muted/60"
              >
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-text-muted" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* New World */}
        <div className="rounded-2xl border border-border-active bg-surface-elevated p-7">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs uppercase tracking-[0.18em] text-text-primary">
              New World
            </span>
            <span className="font-mono text-xs text-text-secondary">Now</span>
          </div>
          <ul className="mt-6 space-y-3">
            {NEW_WORLD.map((item) => (
              <li
                key={item}
                className="flex items-center gap-3 text-text-primary"
              >
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-white" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <Reveal className="mt-4 grid gap-4 sm:grid-cols-3">
        {STATS.map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl border border-border-subtle bg-surface p-6"
          >
            <div
              className={`font-display text-4xl font-bold tracking-display sm:text-5xl ${
                stat.accent ? "text-accent" : "text-text-primary"
              }`}
            >
              <CountUp
                to={stat.value}
                decimals={stat.decimals ?? 0}
                suffix={stat.suffix}
              />
            </div>
            <p className="mt-3 text-sm leading-relaxed text-text-secondary">
              {stat.label}
            </p>
          </div>
        ))}
      </Reveal>
    </Section>
  );
}
