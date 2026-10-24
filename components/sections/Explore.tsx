import Link from "next/link";
import { IconArrowRight } from "@/components/ui/icons";
import { Section, SectionLabel } from "@/components/ui/Section";

const PAGES = [
  {
    href: "/voice-agent",
    kicker: "Voice agents",
    tile: "bg-tile-sky text-tile-skyInk",
    pill: "bg-text-primary",
    accent: true,
    title: "Meet Maoshi",
    body: "See how an AI receptionist answers every call, and talk to one live.",
  },
  {
    href: "/services",
    kicker: "Automation",
    tile: "bg-tile-peach text-tile-peachInk",
    pill: "bg-tile-peachInk",
    title: "AI automations & workflows",
    body: "Workflows that connect your tools and take the repetitive work off your team.",
  },
  {
    href: "/about",
    kicker: "Who we are",
    tile: "bg-tile-lime text-tile-limeInk",
    pill: "bg-tile-limeInk",
    title: "One founder, no hand-offs",
    body: "The people who build your system are the people who answer when you call.",
  },
];

export function Explore() {
  return (
    <Section id="explore">
      <div className="text-center">
        <SectionLabel>Explore</SectionLabel>
        <h2 className="mt-4 font-display text-4xl font-medium leading-none tracking-tight2 sm:text-[72px]">
          Where to next?
        </h2>
      </div>
      {/* Clay-style stack: each tile sticks under the nav and the next one slides over it,
          leaving a strip of the previous tile's rounded top visible. */}
      <div className="mt-12">
        {PAGES.map((p, i) => (
          <Link
            key={p.href}
            href={p.href}
            style={{ top: `${88 + i * 28}px` }}
            className={`group/open sticky flex min-h-[22rem] flex-col rounded-t-[48px] px-6 pb-10 pt-8 sm:px-12 sm:pb-12 sm:pt-10 lg:min-h-[26rem] ${i === PAGES.length - 1 ? "rounded-b-[48px]" : "-mb-px"} ${p.tile}`}
          >
            <div className="flex items-center justify-between">
              <span
                className={`w-fit rounded-full px-3 py-1 text-[11px] font-medium uppercase tracking-[0.14em] text-bg ${p.pill}`}
              >
                {p.kicker}
              </span>
              <span aria-hidden className="text-sm font-medium opacity-70">
                0{i + 1} / 0{PAGES.length}
              </span>
            </div>
            <h3 className="mt-10 max-w-3xl font-display text-4xl font-medium leading-none tracking-display sm:text-5xl lg:text-[64px]">
              {p.accent ? (
                <>
                  Meet <span className="text-accent-ink">Maoshi</span>
                </>
              ) : (
                p.title
              )}
            </h3>
            <p className="mb-10 mt-4 max-w-xl text-lg leading-snug">{p.body}</p>
            <span className="mt-auto inline-flex w-fit items-center gap-2 rounded-btn bg-bg px-4 py-2 text-sm font-medium">
              Open
              <IconArrowRight className="h-4 w-4 transition-transform duration-300 group-hover/open:translate-x-0.5" />
            </span>
          </Link>
        ))}
      </div>
    </Section>
  );
}
