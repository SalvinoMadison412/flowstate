"use client";

import { Section, SectionLabel } from "@/components/ui/Section";
import { Reveal } from "@/components/ui/Reveal";
import { CountUp } from "@/components/ui/CountUp";

export function CaseStudy() {
  return (
    <Section id="case-study">
      <SectionLabel>Results</SectionLabel>
      <Reveal className="mt-6 rounded-2xl border border-border-active bg-surface-elevated p-7 sm:p-10">
        <h2 className="font-display text-2xl font-bold tracking-display sm:text-3xl">
          Calls answered for our law firm partners
        </h2>
        <div className="mt-8 font-display text-5xl font-bold tracking-display text-accent sm:text-6xl">
          <CountUp to={150} suffix="" />
          <span className="ml-3 text-2xl font-bold text-text-primary sm:text-3xl">calls a week</span>
        </div>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-text-secondary">
          Our AI intake agent answers around 150 calls a week for our law firm partners, takes the caller&rsquo;s
          details and passes consult requests to the firm&rsquo;s team.
        </p>
      </Reveal>
    </Section>
  );
}
