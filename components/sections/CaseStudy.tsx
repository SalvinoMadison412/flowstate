"use client";

import { Section, SectionLabel } from "@/components/ui/Section";
import { Reveal } from "@/components/ui/Reveal";
import { CountUp } from "@/components/ui/CountUp";

export function CaseStudy() {
  return (
    <Section id="case-study">
      <Reveal className="rounded-panel bg-surface px-6 py-12 sm:px-12 sm:py-16">
        <SectionLabel>Built for volume</SectionLabel>
        <div className="mt-6 grid items-end gap-10 lg:grid-cols-2">
          <div>
            <h2 className="font-display text-3xl font-medium leading-none tracking-tight2 sm:text-[44px] sm:leading-[1.1]">
              Sized for a busy intake line
            </h2>
            <p className="mt-8 flex items-baseline gap-3 font-display font-medium tracking-display">
              <span className="text-7xl leading-none text-accent-ink sm:text-[128px]">
                <CountUp to={150} suffix="" />
              </span>
              <span className="text-2xl sm:text-3xl">calls a week</span>
            </p>
          </div>
          <div className="rounded-card bg-surface-elevated p-6 shadow-float">
            <p className="text-base leading-relaxed text-text-secondary">
              An example of the volume a busy injury firm can see. Our AI intake agent is built to answer every call, take the caller&rsquo;s details and pass consult requests to the firm&rsquo;s team.
            </p>
            <p className="mt-4 text-xs font-medium uppercase tracking-[0.14em] text-text-muted">Illustrative, not a client result</p>
          </div>
        </div>
      </Reveal>
    </Section>
  );
}
