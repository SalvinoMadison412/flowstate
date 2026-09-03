"use client";

import { Section, SectionHeading, SectionLabel } from "@/components/ui/Section";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import {
  IconBroadcast,
  IconSearch,
  IconQuote,
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
    id: "meta-ads",
    kicker: "Paid social",
    title: "Meta Ads",
    positioning:
      "Find your buyers before they go looking. Demand creation on Instagram and Facebook — not just demand capture.",
    covers: [
      "Instagram and Facebook feed, Stories, and Reels campaigns",
      "Audience research, interest targeting, and lookalike building",
      "Creative strategy across static, video, and carousel",
      "Retargeting and full-funnel sequencing",
      "A/B testing creative and copy at scale",
      "Monthly reporting on CPM, CTR, ROAS, and audience growth",
    ],
    differentiator:
      "Creative-led, not just targeting-led. Most agencies run the same ads for months. We test and iterate constantly so the algorithm always has fresh signal.",
    cta: { label: "Start a Meta campaign", href: "#audit" },
    Icon: IconBroadcast,
  },
  {
    id: "google-ads",
    kicker: "Paid search",
    title: "Google Ads",
    positioning:
      "Own the top of search every time someone is ready to buy. Intent is everything — we capture it.",
    covers: [
      "Search campaigns — keyword strategy, match types, negative lists",
      "Performance Max across Google's full inventory",
      "Landing page optimization and conversion tracking",
      "AI-driven bidding strategy and budget allocation",
      "Ad copy variation testing at scale",
      "Monthly reporting on ROAS, CPA, and conversion trends",
    ],
    differentiator:
      "AI-assisted copy testing and bidding. More variants, faster learning, and a lower cost per lead than agencies running campaigns by hand.",
    cta: { label: "Get a free ad audit", href: "#audit" },
    Icon: IconSearch,
  },
  {
    id: "geo",
    kicker: "AI visibility",
    title: "GEO — Generative Engine Optimization",
    positioning:
      "When someone asks AI about your category, you should be the answer. Get cited by ChatGPT, Gemini, Perplexity, and Claude.",
    covers: [
      "Schema, entity markup, and answer-ready content structure",
      "Citation seeding across sources LLMs trust — Reddit, forums, expert roundups, reference sites",
      "AI visibility monitoring across every major model",
      "Community intelligence — Reddit and UGC signals that shape AI training data",
      "Reputation architecture — control the narrative AI associates with your brand",
      "Agentic content strategy — AI-native workflows that compound monthly",
    ],
    differentiator:
      "Community-driven, not keyword-driven. Most agencies optimize for Google. We optimize for what is replacing it — the training and retrieval data AI actually reads.",
    cta: { label: "Get your GEO audit", href: "#audit" },
    Icon: IconQuote,
  },
];

export function Services() {
  return (
    <Section id="services">
      <SectionLabel>What we do</SectionLabel>
      <SectionHeading className="mt-4 max-w-3xl">
        Three services. Each one stands on its own.
      </SectionHeading>
      <p className="mt-5 max-w-2xl text-lg text-text-secondary">
        Meta Ads, Google Ads, and GEO. Different channels, different playbooks.
        Hire us for the one you need &mdash; or all three.
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
