"use client";

import Image from "next/image";
import Link from "next/link";
import { Section, SectionHeading, SectionLabel } from "@/components/ui/Section";
import { Reveal } from "@/components/ui/Reveal";
import { IconArrowRight, IconInstagram, IconLinkedIn } from "@/components/ui/icons";

const FOUNDER = {
  name: "Salvino Kevin Madison",
  role: "Founder",
  photo: "/founders/salvino.jpg",
  linkedin: "https://www.linkedin.com/in/salvino-madison",
  bio: [
    "Salvino spent two years as a Data Analyst at S&P Global, building the habit of making calls from data, not instinct, while running The Library Company's full marketing operation on the side — proving he could turn strategy into execution, not just slides.",
    "At Flow State, he brings both disciplines together: the rigor to read what Meta, Google, and AI-answer data are actually saying, and the creative judgment to act on it.",
  ],
};

const PRINCIPLES = [
  { n: "01", title: "Data over instinct", body: "Every recommendation starts from what Meta, Google and AI-answer data are actually saying, not from what sounds good in a pitch." },
  { n: "02", title: "One point of contact", body: "No account managers and no hand-offs. The person who builds your strategy is the person who answers when you call." },
  { n: "03", title: "Test, don't set and forget", body: "We iterate on creative, copy and bidding constantly, so the algorithms always have fresh signal to learn from." },
  { n: "04", title: "Reported in plain numbers", body: "Monthly reporting on the numbers that matter for the channel: ROAS, CPA, conversions and audience growth." },
];

const OFFERS = [
  { href: "/voice-agent", title: "AI Voice Agents", body: "An AI receptionist that answers every call and takes booking requests." },
  { href: "/services#meta-ads", title: "Meta Ads", body: "Instagram and Facebook campaigns built on creative testing." },
  { href: "/services#google-ads", title: "Google Ads", body: "Search and Performance Max, tracked to conversions." },
  { href: "/services#geo", title: "GEO", body: "Getting recommended by ChatGPT, Perplexity, Gemini and Claude." },
];

export function About() {
  return (
    <>
      <Section id="about">
        <SectionLabel>About</SectionLabel>
        <div className="mt-8 grid items-center gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
          <div className="relative mx-auto w-full max-w-[380px]">
            <span
              aria-hidden
              className="animate-radial-pulse pointer-events-none absolute -inset-6 rounded-[2rem] bg-accent blur-3xl"
            />
            <Image
              src={FOUNDER.photo}
              alt={FOUNDER.name}
              width={640}
              height={640}
              priority
              className="float-y relative aspect-square w-full rounded-3xl border border-border-active object-cover shadow-card-lift"
            />
          </div>

          <div>
            <SectionHeading className="max-w-2xl">
              Run by a founder who treats ad spend like it&apos;s their own money.
            </SectionHeading>
            <p className="mt-6 max-w-2xl text-base leading-relaxed text-text-secondary">
              Flow State is founded and run by Salvino Madison. No account
              managers, no hand-offs &mdash; the person who builds the strategy
              is the person who answers when you call.
            </p>

            <h3 className="mt-10 font-display text-xl font-bold tracking-display">{FOUNDER.name}</h3>
            <div className="mt-1 font-mono text-xs uppercase tracking-[0.2em] text-text-secondary">
              {FOUNDER.role}
            </div>
            {FOUNDER.bio.map((p) => (
              <p key={p.slice(0, 20)} className="mt-4 max-w-2xl text-sm leading-relaxed text-text-secondary">
                {p}
              </p>
            ))}

            <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3">
              <a
                href={FOUNDER.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-text-primary underline-offset-4 hover:text-accent hover:underline"
              >
                <IconLinkedIn className="h-4 w-4" />
                LinkedIn
              </a>
              <a
                href="https://www.instagram.com/flowstate.agents"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-text-primary underline-offset-4 hover:text-accent hover:underline"
              >
                <IconInstagram className="h-4 w-4" />
                @flowstate.agents
              </a>
            </div>
          </div>
        </div>
      </Section>

      <Section id="principles">
        <SectionLabel>How we work</SectionLabel>
        <SectionHeading className="mt-4 max-w-2xl">Four rules we run every account by.</SectionHeading>
        <Reveal className="mt-12 grid gap-4 sm:grid-cols-2">
          {PRINCIPLES.map((p) => (
            <div
              key={p.n}
              className="rounded-2xl border border-border-subtle bg-surface p-6 transition-all duration-300 hover:-translate-y-1 hover:border-border-active sm:p-8"
            >
              <span className="font-mono text-xs text-accent">{p.n}</span>
              <h3 className="mt-4 font-display text-xl font-bold tracking-display">{p.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-text-secondary">{p.body}</p>
            </div>
          ))}
        </Reveal>
      </Section>

      <Section id="what-we-do">
        <SectionLabel>What we do</SectionLabel>
        <SectionHeading className="mt-4 max-w-2xl">
          A voice agent for your phone. Marketing to make it ring.
        </SectionHeading>
        <Reveal className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {OFFERS.map((o) => (
            <Link
              key={o.title}
              href={o.href}
              className="group rounded-2xl border border-border-subtle bg-surface p-6 transition-all duration-300 hover:-translate-y-1 hover:border-border-active"
            >
              <h3 className="font-display text-lg font-bold tracking-display">{o.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-text-secondary">{o.body}</p>
              <span className="mt-5 inline-flex items-center gap-2 text-sm text-text-primary">
                Learn more
                <IconArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </span>
            </Link>
          ))}
        </Reveal>
      </Section>
    </>
  );
}
