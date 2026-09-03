"use client";

import { Section, SectionHeading, SectionLabel } from "@/components/ui/Section";
import { Reveal } from "@/components/ui/Reveal";
import { CountUp } from "@/components/ui/CountUp";

const PLACES = [
  {
    name: "AI answers",
    body: "Buyers ask ChatGPT and Perplexity before they open Google. If AI doesn't name you, you're not on the shortlist.",
  },
  {
    name: "Search results",
    body: "High intent still runs through Google. The top of the page is won with strategy and budget, not overnight.",
  },
  {
    name: "Social feeds",
    body: "Instagram and Facebook are where demand gets created — before anyone thinks to search for what you sell.",
  },
];

const STATS = [
  {
    channel: "Meta Ads",
    value: 40,
    suffix: "%",
    label: "lower CPM than industry average on managed accounts",
    accent: false,
  },
  {
    channel: "Google Ads",
    value: 4.2,
    suffix: "×",
    decimals: 1,
    label: "average return on ad spend across active search campaigns",
    accent: true,
  },
  {
    channel: "GEO",
    value: 3,
    suffix: "×",
    label: "more AI citations within the first 90 days",
    accent: false,
  },
];

export function Problem() {
  return (
    <Section id="problem">
      <SectionLabel>Why Flow State</SectionLabel>
      <SectionHeading className="mt-4 max-w-2xl">
        Attention is fragmented. Most agencies aren&rsquo;t.
      </SectionHeading>
      <p className="mt-5 max-w-2xl text-lg text-text-secondary">
        People find brands in three places now. Most agencies cover one and hope
        you don&rsquo;t notice the gap. We run all three.
      </p>

      <div className="mt-14 grid gap-4 md:grid-cols-3">
        {PLACES.map((p) => (
          <div
            key={p.name}
            className="rounded-2xl border border-border-subtle bg-surface p-7"
          >
            <span className="font-mono text-xs uppercase tracking-[0.18em] text-text-primary">
              {p.name}
            </span>
            <p className="mt-4 text-sm leading-relaxed text-text-secondary">
              {p.body}
            </p>
          </div>
        ))}
      </div>

      <Reveal className="mt-4 grid gap-4 sm:grid-cols-3">
        {STATS.map((stat) => (
          <div
            key={stat.channel}
            className="rounded-2xl border border-border-subtle bg-surface p-6"
          >
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-text-muted">
              {stat.channel}
            </span>
            <div
              className={`mt-3 font-display text-4xl font-bold tracking-display sm:text-5xl ${
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
