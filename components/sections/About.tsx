"use client";

import { Section, SectionHeading, SectionLabel } from "@/components/ui/Section";
import { Reveal } from "@/components/ui/Reveal";

const FOUNDERS = [
  {
    name: "Salvino Kevin Madison",
    role: "Co-Founder",
    initials: "SKM",
    bio: "Salvino spent two years as a Data Analyst at S&P Global, building the habit of making calls from data, not instinct, while running The Library Company's full marketing operation on the side — proving he could turn strategy into execution, not just slides. At Flow State, he brings both disciplines together: the rigor to read what Meta, Google, and AI-answer data are actually saying, and the creative judgment to act on it.",
  },
  {
    name: "Sherwin Judas Madison",
    role: "Co-Founder",
    initials: "SJM",
    bio: "Sherwin is a Chartered Accountancy candidate who has spent the past one and a half years at SRVN & Associates working closely with businesses on accounting, taxation, and advisory. That background shows up directly in how Flow State runs campaigns: every dollar of ad spend is tracked back to return, not vanity metrics, and every client gets the same financial discipline he'd bring to an audit.",
  },
];

export function About() {
  return (
    <Section id="about">
      <SectionLabel>About</SectionLabel>
      <SectionHeading className="mt-4 max-w-2xl">
        Run by two brothers who treat ad spend like it&apos;s their own money.
      </SectionHeading>
      <p className="mt-6 max-w-2xl text-sm leading-relaxed text-text-secondary sm:text-base">
        Flow State is founded and run by Salvino and Sherwin Madison. No
        account managers, no hand-offs &mdash; the two people who built the
        strategy are the two people who answer when you call.
      </p>

      <Reveal className="mt-12 grid gap-6 md:grid-cols-2">
        {FOUNDERS.map((founder) => (
          <div
            key={founder.name}
            className="rounded-2xl border border-border-active bg-surface-elevated p-7 sm:p-8"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-full border border-border-active bg-bg">
              <span className="font-display text-sm font-bold tracking-display text-accent">
                {founder.initials}
              </span>
            </div>
            <h3 className="mt-6 font-display text-xl font-bold tracking-display">
              {founder.name}
            </h3>
            <div className="mt-1 font-mono text-xs uppercase tracking-[0.2em] text-text-secondary">
              {founder.role}
            </div>
            <p className="mt-4 text-sm leading-relaxed text-text-secondary">
              {founder.bio}
            </p>
          </div>
        ))}
      </Reveal>
    </Section>
  );
}
