"use client";

import { Section, SectionHeading, SectionLabel } from "@/components/ui/Section";
import { Reveal } from "@/components/ui/Reveal";

const INDUSTRIES = [
  { name: "SaaS", stat: "68% of buyers ask an LLM before booking a demo" },
  { name: "eCommerce", stat: "AI shopping assistants now drive 14% of discovery" },
  { name: "Finance", stat: "LLMs cite <6 sources for 'best' finance queries" },
  { name: "Healthcare", stat: "62% of patients check AI before a provider" },
  { name: "Legal", stat: "AI answers 40% of 'do I need a lawyer' queries" },
  { name: "Real Estate", stat: "Perplexity surfaces 3 brokers per market query" },
  { name: "B2B Services", stat: "RFP shortlists increasingly seeded by ChatGPT" },
  { name: "Consumer Apps", stat: "App recommendations from AI up 3x year over year" },
];

export function Industries() {
  return (
    <Section id="industries">
      <SectionLabel>Industries</SectionLabel>
      <SectionHeading className="mt-4 max-w-2xl">
        Built for every vertical navigating the AI shift.
      </SectionHeading>

      <Reveal className="mt-12 flex flex-wrap gap-3">
        {INDUSTRIES.map((item) => (
          <div key={item.name} className="group relative">
            <span className="block cursor-default rounded-full border border-white/70 bg-surface px-5 py-2.5 text-sm text-text-primary transition-colors duration-200 group-hover:bg-white group-hover:text-bg">
              {item.name}
            </span>
            <span
              role="tooltip"
              className="pointer-events-none absolute left-1/2 top-full z-20 mt-2 w-56 -translate-x-1/2 rounded-lg border border-border-active bg-surface-elevated px-3 py-2 text-center font-mono text-[11px] leading-relaxed text-text-secondary opacity-0 transition-opacity duration-200 group-hover:opacity-100"
            >
              {item.stat}
            </span>
          </div>
        ))}
      </Reveal>
    </Section>
  );
}
