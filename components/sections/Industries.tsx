"use client";

import { Section, SectionHeading, SectionLabel } from "@/components/ui/Section";
import { Reveal } from "@/components/ui/Reveal";

const INDUSTRIES = [
  { name: "Salons & Nail Bars", stat: "New clients pick from the top 3 on Google Maps and Instagram" },
  { name: "Spas & Med Spas", stat: "People ask ChatGPT for the best spa near them before they book" },
  { name: "Clinics & Dental", stat: "Patients compare reviews and AI answers before they call" },
  { name: "Cafés & Restaurants", stat: "Reels and Maps decide where people eat tonight" },
  { name: "Boutique Hotels & Resorts", stat: "Travellers shortlist stays from AI answers and Instagram" },
  { name: "Fitness & Yoga Studios", stat: "Local search and Reels fill trial classes" },
];

export function Industries() {
  return (
    <Section id="industries">
      <SectionLabel>Who we work with</SectionLabel>
      <SectionHeading className="mt-4 max-w-2xl">
        Built for local businesses that live on bookings.
      </SectionHeading>

      <Reveal className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {INDUSTRIES.map((item) => (
          <div
            key={item.name}
            className="rounded-2xl border border-border-subtle bg-surface p-5"
          >
            <span className="block text-sm font-medium text-text-primary">
              {item.name}
            </span>
            <span className="mt-2 block font-mono text-[11px] leading-relaxed text-text-secondary">
              {item.stat}
            </span>
          </div>
        ))}
      </Reveal>
    </Section>
  );
}
