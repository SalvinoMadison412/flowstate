import Link from "next/link";
import { Section, SectionLabel } from "@/components/ui/Section";

const PAGES = [
  { href: "/voice-agent", kicker: "Voice agents", tile: "bg-tile-sky text-tile-skyInk", pill: "bg-text-primary", accent: true, title: "Meet Maoshi", body: "See how an AI receptionist answers every call, and talk to one live." },
  { href: "/services", kicker: "Automation", tile: "bg-tile-peach text-tile-peachInk", pill: "bg-tile-peachInk", title: "AI automations & workflows", body: "Workflows that connect your tools and take the repetitive work off your team." },
  { href: "/about", kicker: "Who we are", tile: "bg-tile-lime text-tile-limeInk", pill: "bg-tile-limeInk", title: "One founder, no hand-offs", body: "The people who build your system are the people who answer when you call." },
];

export function Explore() {
  return (
    <Section id="explore">
      <div className="text-center">
        <SectionLabel>Explore</SectionLabel>
        <h2 className="mt-4 font-display text-4xl font-medium leading-none tracking-tight2 sm:text-[72px]">Where to next?</h2>
      </div>
      <div className="mt-12 grid gap-4 md:grid-cols-3">
        {PAGES.map((p) => (
          <Link
            key={p.href}
            href={p.href}
            className={`flex flex-col card-hover rounded-[32px] p-7 sm:p-8 ${p.tile}`}
          >
            <span className={`w-fit rounded-full px-3 py-1 text-[11px] font-medium uppercase tracking-[0.14em] text-bg ${p.pill}`}>{p.kicker}</span>
            <h3 className="mt-6 font-display text-3xl font-medium leading-none tracking-display sm:text-4xl">
              {p.accent ? <>Meet <span className="text-accent-ink">Maoshi</span></> : p.title}
            </h3>
            <p className="mb-10 mt-4 text-base leading-snug">{p.body}</p>
            <span className="mt-auto w-fit rounded-btn bg-bg px-4 py-2 text-sm font-medium">Open →</span>
          </Link>
        ))}
      </div>
    </Section>
  );
}
