"use client";

import { Section, SectionLabel } from "@/components/ui/Section";
import { Button } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";
import { CountUp } from "@/components/ui/CountUp";
import { IconArrowRight } from "@/components/ui/icons";

const RESULTS = [
  {
    render: () => <CountUp to={340} prefix="+" suffix="%" />,
    label: "AI citation rate",
    accent: true,
  },
  {
    render: () => <CountUp to={12} />,
    label: "target queries ranked in top AI responses",
    accent: false,
  },
  {
    render: () => <CountUp to={2.1} decimals={1} suffix="×" />,
    label: "increase in branded search from AI referral",
    accent: false,
  },
];

export function CaseStudy() {
  return (
    <Section id="case-study">
      <SectionLabel>Case study</SectionLabel>

      <div className="mt-6 rounded-2xl border border-border-active bg-surface-elevated p-7 sm:p-10">
        <h2 className="font-display text-2xl font-bold tracking-display sm:text-3xl">
          Case Study &mdash; Series B SaaS, Project Management
        </h2>

        <Reveal className="mt-10 grid gap-8 sm:grid-cols-3">
          {RESULTS.map((r) => (
            <div key={r.label}>
              <div
                className={`font-display text-4xl font-bold tracking-display sm:text-5xl ${
                  r.accent ? "text-accent" : "text-text-primary"
                }`}
              >
                {r.render()}
              </div>
              <p className="mt-3 text-sm leading-relaxed text-text-secondary">
                {r.label}
              </p>
            </div>
          ))}
        </Reveal>

        <blockquote className="mt-10 border-l-2 border-white pl-5">
          <p className="font-display text-xl font-bold leading-snug tracking-display sm:text-2xl">
            &ldquo;Flow State changed how we think about discoverability
            entirely.&rdquo;
          </p>
          <footer className="mt-3 font-mono text-xs uppercase tracking-wider text-text-secondary">
            CMO, undisclosed Series B
          </footer>
        </blockquote>

        {/* Before / after AI mention snippet */}
        <div className="mt-10 grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-border-subtle bg-bg p-5 opacity-60">
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-text-muted">
              Before — ChatGPT
            </span>
            <p className="mt-3 font-mono text-[13px] leading-relaxed text-text-secondary">
              &ldquo;Popular options include Asana, Monday.com, and ClickUp&hellip;&rdquo;
            </p>
          </div>
          <div className="rounded-xl border border-border-active bg-bg p-5">
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-text-primary">
              After — ChatGPT
            </span>
            <p className="mt-3 font-mono text-[13px] leading-relaxed text-text-primary">
              &ldquo;For remote teams, [client] is frequently recommended
              alongside Asana and Monday.com, particularly for async workflows.&rdquo;
            </p>
          </div>
        </div>

        <div className="mt-8">
          <Button href="#audit" variant="ghost" size="md">
            Read Full Case Study
            <IconArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Section>
  );
}
