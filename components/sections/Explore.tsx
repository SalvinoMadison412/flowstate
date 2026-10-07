import Link from "next/link";
import { Section, SectionHeading, SectionLabel } from "@/components/ui/Section";
import { IconArrowRight } from "@/components/ui/icons";

const PAGES = [
  { href: "/voice-agent", kicker: "Voice agents", title: "Meet Maoshi", body: "See how an AI receptionist answers every call, and talk to one live." },
  { href: "/services", kicker: "Automation & marketing", title: "AI workflows, Meta, Google, GEO", body: "Automations that remove the busywork, plus the campaigns and AI-search work that bring customers in." },
  { href: "/about", kicker: "Who we are", title: "One founder, no hand-offs", body: "The people who build your strategy are the people who answer when you call." },
];

export function Explore() {
  return (
    <Section id="explore">
      <SectionLabel>Explore</SectionLabel>
      <SectionHeading className="mt-4 max-w-2xl">Where to next?</SectionHeading>
      <div className="mt-12 grid gap-4 md:grid-cols-3">
        {PAGES.map((p) => (
          <Link
            key={p.href}
            href={p.href}
            className="group rounded-2xl border border-border-subtle bg-surface p-6 transition-all hover:-translate-y-1 hover:border-border-active sm:p-7"
          >
            <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-text-secondary">{p.kicker}</span>
            <h3 className="mt-3 font-display text-xl font-bold tracking-display">{p.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-text-secondary">{p.body}</p>
            <span className="mt-5 inline-flex items-center gap-2 text-sm text-text-primary">
              Open
              <IconArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </span>
          </Link>
        ))}
      </div>
    </Section>
  );
}
