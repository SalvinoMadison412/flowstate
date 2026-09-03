"use client";

import { Section, SectionHeading, SectionLabel } from "@/components/ui/Section";
import { Reveal } from "@/components/ui/Reveal";

const INDUSTRIES = [
  { name: "SaaS", stat: "Buyers check ChatGPT before they book a demo" },
  { name: "eCommerce", stat: "Meta drives most first-touch product discovery" },
  { name: "Finance", stat: "Google intent is expensive — and worth capturing" },
  { name: "Healthcare", stat: "Patients ask AI before they call a provider" },
  { name: "Legal", stat: "High-intent search converts at a premium" },
  { name: "Real Estate", stat: "Social feeds build the shortlist before the call" },
  { name: "B2B Services", stat: "RFP shortlists get seeded by AI answers" },
  { name: "Consumer Apps", stat: "Reels and AI recommendations compound together" },
];

export function Industries() {
  return (
    <Section id="industries" className="overflow-x-clip">
      <SectionLabel>Industries</SectionLabel>
      <SectionHeading className="mt-4 max-w-2xl">
        Built for every vertical, across every channel.
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
