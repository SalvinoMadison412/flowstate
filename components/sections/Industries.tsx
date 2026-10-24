"use client";

import { Section, SectionHeading, SectionLabel } from "@/components/ui/Section";
import { Reveal } from "@/components/ui/Reveal";

const INDUSTRIES = [
  { name: "Salons & Nail Bars", stat: "Missed calls while the team is with a client become lost bookings" },
  { name: "Spas & Med Spas", stat: "Booking requests, rescheduling and reminders eat the front desk's day" },
  { name: "Clinics & Dental", stat: "Patients call after hours and the line goes to voicemail" },
  { name: "Cafés & Restaurants", stat: "Reservation calls land in the middle of a dinner rush" },
  { name: "Boutique Hotels & Resorts", stat: "Guests ask the same questions at all hours, in many languages" },
  { name: "Fitness & Yoga Studios", stat: "Trial-class enquiries come in while the instructor is teaching" },
];

export function Industries() {
  return (
    <Section id="industries">
      <SectionLabel>Who we work with</SectionLabel>
      <SectionHeading className="mt-4 max-w-3xl">
        Built for local businesses that live on bookings.
      </SectionHeading>

      <Reveal className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {INDUSTRIES.map((item) => (
          <div
            key={item.name}
            className="card-hover rounded-card bg-surface-elevated p-5 shadow-ring"
          >
            <span className="block font-medium text-text-primary">
              {item.name}
            </span>
            <span className="mt-2 block text-sm leading-relaxed text-text-secondary">
              {item.stat}
            </span>
          </div>
        ))}
      </Reveal>
    </Section>
  );
}
