"use client";

import { Section, SectionHeading, SectionLabel } from "@/components/ui/Section";
import { Reveal } from "@/components/ui/Reveal";

const REASONS = [
  {
    name: "The gap is opening now",
    text: "Customers expect instant answers and teams that automate move faster. The longer a business waits, the harder it is to catch up.",
  },
  {
    name: "Healthier financials",
    text: "Hours lost to manual work go back into revenue. AI takes the repetitive load, so you grow without adding headcount at the same pace.",
  },
  {
    name: "Workflows that run themselves",
    text: "Lead follow-up, booking, reporting and data entry run automatically, connected to the tools you already use.",
  },
  {
    name: "A better customer experience",
    text: "Every call answered and every enquiry replied to quickly, at any hour and in the customer's own language.",
  },
];

export function WhyAI() {
  return (
    <Section id="why-ai">
      <SectionLabel>Why AI, why now</SectionLabel>
      <SectionHeading className="mt-4 max-w-3xl">
        Businesses that adopt AI today pull ahead tomorrow.
      </SectionHeading>

      <Reveal className="mt-10 grid gap-3 sm:grid-cols-2">
        {REASONS.map((item) => (
          <div
            key={item.name}
            className="card-hover rounded-card bg-surface-elevated p-5 shadow-ring"
          >
            <span className="block font-medium text-text-primary">
              {item.name}
            </span>
            <span className="mt-2 block text-sm leading-relaxed text-text-secondary">
              {item.text}
            </span>
          </div>
        ))}
      </Reveal>
    </Section>
  );
}
