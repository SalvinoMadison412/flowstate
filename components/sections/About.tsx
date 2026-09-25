"use client";

import Image from "next/image";
import { Section, SectionHeading, SectionLabel } from "@/components/ui/Section";
import { Reveal } from "@/components/ui/Reveal";
import { IconLinkedIn } from "@/components/ui/icons";

const FOUNDERS = [
  {
    name: "Salvino Kevin Madison",
    role: "Founder",
    photo: "/founders/salvino.jpg",
    linkedin: "https://www.linkedin.com/in/salvino-madison",
    bio: "Salvino spent two years as a Data Analyst at S&P Global, building the habit of making calls from data, not instinct, while running The Library Company's full marketing operation on the side — proving he could turn strategy into execution, not just slides. At Flow State, he brings both disciplines together: the rigor to read what Meta, Google, and AI-answer data are actually saying, and the creative judgment to act on it.",
  },
];

export function About() {
  return (
    <Section id="about">
      <SectionLabel>About</SectionLabel>
      <SectionHeading className="mt-4 max-w-2xl">
        Run by a founder who treats ad spend like it&apos;s their own money.
      </SectionHeading>
      <p className="mt-6 max-w-2xl text-sm leading-relaxed text-text-secondary sm:text-base">
        Flow State is founded and run by Salvino Madison. No account managers,
        no hand-offs &mdash; the person who builds the strategy is the person
        who answers when you call.
      </p>

      <Reveal className="mt-12 grid max-w-2xl gap-6">
        {FOUNDERS.map((founder) => (
          <div
            key={founder.name}
            className="rounded-2xl border border-border-active bg-surface-elevated p-7 sm:p-8"
          >
            <Image
              src={founder.photo}
              alt={founder.name}
              width={112}
              height={112}
              className="h-28 w-28 rounded-full border border-border-active object-cover"
            />
            <h3 className="mt-6 font-display text-xl font-bold tracking-display">
              <a
                href={founder.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="underline-offset-4 transition-colors hover:text-accent hover:underline"
              >
                {founder.name}
              </a>
            </h3>
            <div className="mt-1 font-mono text-xs uppercase tracking-[0.2em] text-text-secondary">
              {founder.role}
            </div>
            <p className="mt-4 text-sm leading-relaxed text-text-secondary">
              {founder.bio}
            </p>
            <a
              href={founder.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 inline-flex items-center gap-2 text-sm text-text-primary underline-offset-4 hover:text-accent hover:underline"
            >
              <IconLinkedIn className="h-4 w-4" />
              {founder.name} on LinkedIn
            </a>
          </div>
        ))}
      </Reveal>
    </Section>
  );
}
