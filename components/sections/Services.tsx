"use client";

import { Section, SectionHeading, SectionLabel } from "@/components/ui/Section";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import {
  IconBroadcast,
  IconLoop,
  IconCheck,
  IconArrowRight,
} from "@/components/ui/icons";

type Service = {
  id: string;
  kicker: string;
  title: string;
  positioning: string;
  covers: string[];
  differentiator: string;
  cta: { label: string; href: string };
  Icon: (p: { className?: string }) => JSX.Element;
};

const SERVICES: Service[] = [
  {
    id: "ai-automation",
    kicker: "Automation",
    title: "AI Automations & Workflows",
    positioning:
      "Stop doing the same task twice. We build the automations and AI workflows that connect your tools and handle the repetitive work, so your time goes to customers.",
    covers: [
      "Lead capture and follow-up: from a form or DM to a reply and a CRM entry, automatically",
      "Booking workflows, reminders and confirmations",
      "AI assistants that draft replies, summarise calls and sort inbound requests",
      "Connecting the tools you already use, with no copy-pasting between them",
      "Reporting that assembles itself from your CRM and booking data",
      "Custom workflows built around how your business actually runs",
    ],
    differentiator:
      "Built by the founder, so the automations are wired to the numbers you actually track instead of bolted on as a separate project.",
    cta: { label: "Automate a workflow", href: "/contact" },
    Icon: IconLoop,
  },
  {
    id: "voice-agents",
    kicker: "Voice",
    title: "AI Voice Agents",
    positioning:
      "An AI receptionist that picks up every call, day or night, answers questions and takes booking requests, and hands anything urgent to your team.",
    covers: [
      "Answers business phones around the clock, in the caller's language",
      "Takes booking requests and captures the caller's details",
      "Hands off to a person for anything urgent or unusual",
      "Built for businesses with many branches or a high call volume",
      "Connects to the booking and CRM tools you already use",
      "Try a live one on the voice agent page",
    ],
    differentiator:
      "Built and tuned by the founder for your business, not a generic template. You talk to the person who builds it.",
    cta: { label: "Talk to Maoshi, live", href: "/voice-agent" },
    Icon: IconBroadcast,
  },
];

export function Services() {
  return (
    <Section id="services">
      <SectionLabel>What we do</SectionLabel>
      <SectionHeading className="mt-4 max-w-3xl">
        Two services. Each one stands on its own.
      </SectionHeading>
      <p className="mt-5 max-w-2xl text-lg text-text-secondary">
        AI automations and AI voice agents. Hire us for the one you need &mdash; or both.
      </p>

      <div className="mt-14 flex flex-col gap-4">
        {SERVICES.map((s, i) => (
          <article
            key={s.id}
            id={s.id}
            className="scroll-mt-24 rounded-2xl border border-border-subtle bg-surface p-6 transition-colors duration-300 hover:border-border-active sm:p-9"
          >
            <div
              className={cn(
                "grid gap-8 lg:gap-12",
                i % 2 === 0
                  ? "lg:grid-cols-[1.05fr_1fr]"
                  : "lg:grid-cols-[1fr_1.05fr]",
              )}
            >
              {/* Identity + CTA */}
              <div className={cn("flex flex-col", i % 2 === 1 && "lg:order-2")}>
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-lg border border-border-subtle text-text-primary">
                    <s.Icon className="h-5 w-5" />
                  </span>
                  <span className="font-mono text-xs uppercase tracking-[0.18em] text-text-secondary">
                    {s.kicker}
                  </span>
                </div>

                <h3 className="mt-5 font-display text-2xl font-bold leading-tight tracking-display sm:text-3xl">
                  {s.title}
                </h3>
                <p className="mt-4 max-w-md text-base leading-relaxed text-text-secondary">
                  {s.positioning}
                </p>

                <div className="mt-6 lg:mt-auto lg:pt-8">
                  <Button href={s.cta.href} variant="ghost" size="md">
                    {s.cta.label}
                    <IconArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* What it covers + differentiator */}
              <div className={cn(i % 2 === 1 && "lg:order-1")}>
                <ul className="space-y-3">
                  {s.covers.map((c) => (
                    <li
                      key={c}
                      className="flex gap-3 text-sm leading-relaxed text-text-primary"
                    >
                      <IconCheck className="mt-0.5 h-4 w-4 shrink-0 text-text-secondary" />
                      {c}
                    </li>
                  ))}
                </ul>
                <div className="mt-6 rounded-xl border border-border-subtle bg-bg p-4">
                  <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-text-muted">
                    Why Flow State
                  </span>
                  <p className="mt-2 text-sm leading-relaxed text-text-secondary">
                    {s.differentiator}
                  </p>
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>
    </Section>
  );
}
