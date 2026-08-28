"use client";

import { Section, SectionHeading, SectionLabel } from "@/components/ui/Section";
import { Card } from "@/components/ui/Card";
import { Reveal } from "@/components/ui/Reveal";
import {
  IconQuote,
  IconShield,
  IconRadar,
  IconNetwork,
  IconLoop,
  IconLayers,
} from "@/components/ui/icons";

const SERVICES = [
  {
    title: "GEO — Generative Engine Optimization",
    body: "Structure content so AI systems quote you by default — schema, entities, and answer-ready formatting.",
    Icon: IconQuote,
  },
  {
    title: "Citation & Authority Building",
    body: "Embed your brand in the sources LLMs trust most, from reference sites to expert roundups.",
    Icon: IconShield,
  },
  {
    title: "AI Visibility Monitoring",
    body: "Track where you appear (and don't) across every major AI platform, updated continuously.",
    Icon: IconRadar,
  },
  {
    title: "Community Intelligence",
    body: "Reddit, forums, and UGC signals that shape AI training data — mapped, monitored, and shaped.",
    Icon: IconNetwork,
  },
  {
    title: "Agentic Content Strategy",
    body: "Automated, AI-native content workflows that compound monthly without adding headcount.",
    Icon: IconLoop,
  },
  {
    title: "Reputation Architecture",
    body: "Control what narrative AI systems associate with your brand across models and updates.",
    Icon: IconLayers,
  },
];

export function Services() {
  return (
    <Section id="services">
      <SectionLabel>Services</SectionLabel>
      <SectionHeading className="mt-4 max-w-3xl">
        Everything you need to exist in the AI era.
      </SectionHeading>

      <Reveal className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {SERVICES.map(({ title, body, Icon }) => (
          <Card key={title} interactive className="flex flex-col gap-4">
            <span className="flex h-11 w-11 items-center justify-center rounded-lg border border-border-subtle text-text-primary">
              <Icon className="h-5 w-5" />
            </span>
            <h3 className="font-display text-lg font-bold leading-snug tracking-display">
              {title}
            </h3>
            <p className="text-sm leading-relaxed text-text-secondary">{body}</p>
          </Card>
        ))}
      </Reveal>
    </Section>
  );
}
