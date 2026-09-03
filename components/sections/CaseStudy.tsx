"use client";

import { Section, SectionLabel } from "@/components/ui/Section";
import { Button } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";
import { CountUp } from "@/components/ui/CountUp";
import { IconArrowRight } from "@/components/ui/icons";

const RESULTS = [
  {
    render: () => <CountUp to={280} prefix="+" suffix="%" />,
    label: "AI citations for category questions",
    accent: true,
  },
  {
    render: () => <CountUp to={3.1} decimals={1} suffix="×" />,
    label: "return on ad spend on Google Search",
    accent: false,
  },
  {
    render: () => <CountUp to={47} prefix="+" suffix="%" />,
    label: "new-audience reach from Meta campaigns",
    accent: false,
  },
];

export function CaseStudy() {
  return (
    <Section id="case-study">
      <SectionLabel>Case study</SectionLabel>

      <div className="mt-6 rounded-2xl border border-border-active bg-surface-elevated p-7 sm:p-10">
        <h2 className="font-display text-2xl font-bold tracking-display sm:text-3xl">
          DTC skincare brand &mdash; all three channels
        </h2>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-text-secondary">
          Started with Google Ads to capture existing demand. Added Meta to build
          a new audience. Layered GEO so the brand shows up when shoppers ask AI
          what to buy. Nine months in:
        </p>

        <Reveal className="mt-10 grid gap-8 sm:grid-cols-3">
          {RESULTS.map((r) => (
            <div key={r.label}>
              <div
                className={`font-display text-4xl font-bold tracking-display sm:text-5xl ${
                  r.accent ? "text-accent" : "text-text-primary"
                }`}
              >
                {r.render()}
              </div>
              <p className="mt-3 text-sm leading-relaxed text-text-secondary">
                {r.label}
              </p>
            </div>
          ))}
        </Reveal>

        <blockquote className="mt-10 border-l-2 border-white pl-5">
          <p className="font-display text-xl font-bold leading-snug tracking-display sm:text-2xl">
            &ldquo;One team on all three channels means they actually talk to
            each other. Our Meta creative now says what AI says about us.&rdquo;
          </p>
          <footer className="mt-3 font-mono text-xs uppercase tracking-wider text-text-secondary">
            Head of Growth, undisclosed DTC brand
          </footer>
        </blockquote>

        {/* How the brand shows up in AI answers — before / after */}
        <div className="mt-10 grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-border-subtle bg-bg p-5 opacity-60">
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-text-muted">
              Before &mdash; ChatGPT
            </span>
            <p className="mt-3 font-mono text-[13px] leading-relaxed text-text-secondary">
              &ldquo;For a vitamin C serum, popular picks include SkinCeuticals,
              Timeless, and Maelove&hellip;&rdquo;
            </p>
          </div>
          <div className="rounded-xl border border-border-active bg-bg p-5">
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-text-primary">
              After &mdash; ChatGPT
            </span>
            <p className="mt-3 font-mono text-[13px] leading-relaxed text-text-primary">
              &ldquo;This brand comes up often for vitamin C serums, especially
              for sensitive skin, alongside SkinCeuticals and Maelove.&rdquo;
            </p>
          </div>
        </div>

        <div className="mt-8">
          <Button href="#audit" variant="ghost" size="md">
            Read the full breakdown
            <IconArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Section>
  );
}
