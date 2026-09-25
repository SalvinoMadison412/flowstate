"use client";

import Image from "next/image";
import Link from "next/link";
import { Section, SectionHeading, SectionLabel } from "@/components/ui/Section";
import { Reveal } from "@/components/ui/Reveal";
import { IconArrowRight, IconInstagram, IconLinkedIn } from "@/components/ui/icons";

const FOUNDERS = [
  {
    name: "Salvino Kevin Madison",
    role: "Founder",
    photo: "/founders/salvino.jpg",
    linkedin: "https://www.linkedin.com/in/salvino-madison",
    bio: [
      "Salvino spent two years as a Data Analyst at S&P Global, building the habit of making calls from data, not instinct, while running The Library Company's full marketing operation on the side, proving he could turn strategy into execution, not just slides.",
      "At Flow State, he brings both disciplines together: the rigor to read what Meta, Google, and AI-answer data are actually saying, and the creative judgment to act on it. He also builds the automations and AI workflows behind a business: lead follow-up, booking, reporting and the repetitive work that eats a team's day.",
      "He is the person you talk to from the first call to the day a workflow goes live. He scopes the work, builds it himself, and stays on it after launch, so nothing gets lost between a sales conversation and delivery.",
      "Salvino is multilingual, so he can work with businesses and their customers in the language they are most comfortable in.",
    ],
  },
  {
    name: "Sherwin Judas Madison",
    role: "Compliance & Finance",
    photo: "/founders/sherwin.webp",
    linkedin: "https://www.linkedin.com/in/sherwin-judas-madison-b7b649338/",
    bio: [
      "Sherwin is a Chartered Accountancy candidate who has spent the past one and a half years at SRVN & Associates working closely with businesses on accounting, taxation, and advisory.",
      "He supports Flow State on compliance and finance: every dollar of client spend is tracked back to return, and everything is held to the discipline he'd bring to an audit.",
      "In practice that means clear records, sensible handling of client data and money, and a second pair of eyes on the numbers, so clients can trust what they are being shown and what they are being billed.",
      "Working alongside Salvino, he helps make sure the automations and campaigns Flow State builds are not only effective, but also sound from a financial and regulatory point of view.",
    ],
  },
];

const PRINCIPLES = [
  { n: "01", title: "Data over instinct", body: "Every recommendation starts from what Meta, Google and AI-answer data are actually saying, not from what sounds good in a pitch." },
  { n: "02", title: "One point of contact", body: "No account managers and no hand-offs. The person who builds your strategy is the person who answers when you call." },
  { n: "03", title: "Test, don't set and forget", body: "We iterate on creative, copy, bidding and workflows constantly, so nothing we build goes stale." },
  { n: "04", title: "Reported in plain numbers", body: "Monthly reporting on the numbers that matter for the channel: ROAS, CPA, conversions and audience growth." },
];

const OFFERS = [
  { href: "/voice-agent", title: "AI Voice Agents", body: "An AI receptionist that answers every call and takes booking requests." },
  { href: "/services#ai-automation", title: "AI Automations", body: "Workflows that connect your tools and handle the repetitive work." },
  { href: "/services#meta-ads", title: "Meta Ads", body: "Instagram and Facebook campaigns built on creative testing." },
  { href: "/services#google-ads", title: "Google Ads", body: "Search and Performance Max, tracked to conversions." },
  { href: "/services#geo", title: "GEO", body: "Getting recommended by ChatGPT, Perplexity, Gemini and Claude." },
];

export function About() {
  return (
    <>
      <Section id="about">
        <SectionLabel>About</SectionLabel>
        <SectionHeading className="mt-4 max-w-2xl">
          Run by a founder who builds the systems, backed by finance and compliance.
        </SectionHeading>
        <p className="mt-6 max-w-2xl text-base leading-relaxed text-text-secondary">
          Flow State is founded and run by Salvino Madison, with Sherwin Madison
          on compliance and finance. No account managers, no hand-offs
          &mdash; the person who builds the strategy is the person who answers
          when you call.
        </p>

        <Reveal className="mt-12 grid gap-6 md:grid-cols-2">
          {FOUNDERS.map((f) => (
            <div key={f.name} className="flex flex-col rounded-2xl border border-border-active bg-surface-elevated p-6 sm:p-8">
              <Image
                src={f.photo}
                alt={f.name}
                width={640}
                height={640}
                className="aspect-square w-full rounded-2xl border border-border-active object-cover object-top"
              />
              <h3 className="mt-6 font-display text-xl font-bold tracking-display">{f.name}</h3>
              <div className="mt-1 font-mono text-xs uppercase tracking-[0.2em] text-text-secondary">
                {f.role}
              </div>
              {f.bio.map((p) => (
                <p key={p.slice(0, 20)} className="mt-4 text-sm leading-relaxed text-text-secondary">
                  {p}
                </p>
              ))}
              <a
                href={f.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-auto inline-flex items-center gap-2 pt-6 text-sm text-text-primary underline-offset-4 hover:text-accent hover:underline"
              >
                <IconLinkedIn className="h-4 w-4" />
                LinkedIn
              </a>
            </div>
          ))}
        </Reveal>
      </Section>

      <Section id="instagram">
        <div className="flex flex-col items-start justify-between gap-6 rounded-2xl border border-border-active bg-surface-elevated p-6 sm:flex-row sm:items-center sm:p-8">
          <div>
            <SectionLabel>Follow Flow State</SectionLabel>
            <h2 className="mt-3 font-display text-2xl font-bold tracking-display">
              See what we&apos;re building on Instagram.
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-text-secondary">
              Automations, AI voice agents and marketing tips for local businesses, posted on our
              own Flow State account.
            </p>
          </div>
          <a
            href="https://www.instagram.com/flowstate.agents"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex shrink-0 items-center gap-2 rounded-full border border-accent px-5 py-3 text-sm font-bold text-accent transition-colors hover:bg-accent hover:text-bg"
          >
            <IconInstagram className="h-4 w-4" />
            @flowstate.agents
          </a>
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
          Automation for the busywork. Marketing to bring customers in.
        </SectionHeading>
        <Reveal className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
