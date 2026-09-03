"use client";

import { Section, SectionHeading, SectionLabel } from "@/components/ui/Section";
import { cn } from "@/lib/utils";
import { useReveal } from "@/lib/useReveal";
import {
  IconSearch,
  IconSliders,
  IconBroadcast,
  IconRadar,
  IconLoop,
} from "@/components/ui/icons";

const STEPS = [
  {
    n: "01",
    title: "Audit",
    body: "Map where you show up — and where you don't — across AI, Google, and social.",
    Icon: IconSearch,
  },
  {
    n: "02",
    title: "Strategy",
    body: "Pick the channels where your buyers actually are. Set targets and budget.",
    Icon: IconSliders,
  },
  {
    n: "03",
    title: "Launch",
    body: "Ads live, landing pages shipped, citations seeded. Work in market fast.",
    Icon: IconBroadcast,
  },
  {
    n: "04",
    title: "Measure",
    body: "Track what matters: citations, clicks, conversions, and cost per lead.",
    Icon: IconRadar,
  },
  {
    n: "05",
    title: "Compound",
    body: "Double down on what works. Cut what doesn't. Repeat every month.",
    Icon: IconLoop,
  },
];

export function AgenticWorkflow() {
  const { ref, shown } = useReveal<HTMLDivElement>();

  return (
    <Section id="how-it-works">
      <SectionLabel>How it works</SectionLabel>
      <SectionHeading className="mt-4 max-w-2xl">
        Same five steps, whatever channel you hire us for.
      </SectionHeading>

      <div ref={ref} className="relative mt-14">
        {/* connector line + travelling cyan dot (desktop) */}
        <svg
          aria-hidden
          className="absolute left-0 top-9 hidden h-3 w-full md:block"
          viewBox="0 0 1000 12"
          preserveAspectRatio="none"
        >
          <line x1="0" y1="6" x2="1000" y2="6" stroke="#222222" strokeWidth="2" />
          {/* the one cyan element in this section — a dot travelling the pipeline */}
          <circle
            cx="0"
            cy="6"
            r="4"
            fill="#00C8F0"
            className={shown ? "anim-travel" : undefined}
            style={{ ["--to" as string]: "1000px" }}
          />
        </svg>

        <div className="grid gap-8 md:grid-cols-5 md:gap-4">
          {STEPS.map(({ n, title, body, Icon }, i) => (
            <div
              key={title}
              className={cn(
                "relative flex gap-4 md:flex-col md:gap-0",
                shown && "anim-fade",
              )}
              style={{ animationDelay: `${0.15 + i * 0.12}s` }}
            >
              <div className="relative z-10 flex h-[72px] w-[72px] shrink-0 items-center justify-center rounded-xl border border-border-subtle bg-surface text-text-primary">
                <Icon className="h-6 w-6" />
              </div>
              <div className="md:mt-4">
                <span className="font-mono text-xs text-text-muted">{n}</span>
                <h3 className="mt-1 font-display text-lg font-bold tracking-display">
                  {title}
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-text-secondary">
                  {body}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}
