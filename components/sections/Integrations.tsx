"use client";

import { useEffect, useRef, useState } from "react";
import { Section, SectionHeading, SectionLabel } from "@/components/ui/Section";

type Tool = { name: string; file: string };
type Step = { when: string; channel: string; title: string; journey: string; benefit: string };
type Journey = { scenario: string; steps: Step[]; summary: string };
type Niche = { label: string; calls: string[]; handoff: string; journey: Journey; tools: Tool[] };

// Channel icons (24px stroke paths) keyed by Step.channel.
const ICONS: Record<string, string> = {
  Call: "M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2",
  Intake: "M9 4h6v3H9zM7 5H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-1M8 12h8M8 16h5",
  Qualify: "M9 4h6v3H9zM7 5H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-1M8 12h8M8 16h5",
  Routing: "M5 12h14M13 6l6 6-6 6",
  "Booking + text": "M4 6h16v14H4zM4 10h16M8 3v4M16 3v4M9 15l2 2 4-4",
  CRM: "M4 6c0-1.7 3.6-3 8-3s8 1.3 8 3-3.6 3-8 3-8-1.3-8-3zM4 6v6c0 1.7 3.6 3 8 3s8-1.3 8-3V6M4 12v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6",
};

function ChannelIcon({ channel, className }: { channel: string; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d={ICONS[channel] ?? ICONS.Call} />
    </svg>
  );
}

// Industries match callsetter.ai: Dental, HVAC, Solar, Roofing, Injury Law, Debt Relief.
// Tools are ordered by market rank within each niche. Logos: /public/integrations/<file>.
// Logos are favicon-grade; swap in official SVGs when available. No results figures on purpose.
const NICHES: Niche[] = [
  {
    label: "Dental",
    calls: ["New patient intake", "Appointment booking", "Existing patient scheduling", "After-hours answering"],
    handoff: "Urgent calls go to your on-call contact; routine ones are booked.",
    journey: {
      scenario: "Marcus has a toothache on Saturday night. Your office has been closed for hours.",
      steps: [
        { when: "9:40 PM Saturday", channel: "Call", title: "The call is answered on the first ring", journey: "Marcus gets a friendly assistant, not a voicemail box. It says it's the practice's virtual assistant and asks how it can help.", benefit: "A patient in pain reaches your practice instead of the next one on Google." },
        { when: "9:41 PM", channel: "Intake", title: "It takes the details your front desk would ask", journey: "Name, number, new or existing patient, what hurts, how long, and insurance if you want it collected.", benefit: "Your team starts Monday with a filled-in intake, not a half-heard message." },
        { when: "9:43 PM", channel: "Routing", title: "It spots the urgent case", journey: "Swelling, severe pain or an injury is flagged and passed to your on-call contact according to your rules. It never gives medical advice.", benefit: "Real emergencies reach the right person fast, and routine calls don't wake anyone." },
        { when: "9:45 PM", channel: "Booking + text", title: "It books the next step", journey: "Marcus picks the first open slot, and a text confirmation follows with the details.", benefit: "The slot is filled before he has time to call someone else." },
        { when: "9:46 PM", channel: "CRM", title: "The visit is waiting in your system", journey: "The caller, the reason for the call and the booking are logged in your practice software, with a summary for the team.", benefit: "Monday starts with booked patients, not a voicemail list." },
      ],
      summary: "Every after-hours call becomes a booked patient or a flagged emergency, and your front desk spends its time on the patients in the room.",
    },
    tools: [
      { name: "Curve Dental", file: "curve-dental.png" },
      { name: "Tab32", file: "tab32.png" },
      { name: "Open Dental", file: "open-dental.png" },
    ],
  },
  {
    label: "HVAC",
    calls: ["No heat / no cooling emergencies", "Service and tune-up booking", "Quote requests", "Existing job questions"],
    handoff: "Emergency calls are flagged and sent to the on-call tech; routine jobs are booked.",
    journey: {
      scenario: "Linda's heat goes out at 11:15 PM on a freezing night. She calls three HVAC companies.",
      steps: [
        { when: "11:15 PM Friday", channel: "Call", title: "The call is answered on the first ring", journey: "Linda gets a real conversation while the other two companies ring out to voicemail.", benefit: "The first company to pick up usually gets the job." },
        { when: "11:16 PM", channel: "Intake", title: "It captures the job", journey: "Address, system type, what's happening, and whether anyone vulnerable is in the home.", benefit: "Your tech arrives knowing what they're walking into." },
        { when: "11:18 PM", channel: "Routing", title: "It flags the emergency", journey: "No heat in freezing weather goes to your on-call tech under your rules. A routine tune-up request doesn't.", benefit: "Emergency jobs get dispatched, and you stop being woken for the rest." },
        { when: "11:20 PM", channel: "Booking + text", title: "It books the visit", journey: "Linda gets the earliest slot or an on-call callback, with a confirmation text.", benefit: "A booked job instead of a lost lead." },
        { when: "11:21 PM", channel: "CRM", title: "The job is in your system", journey: "The request lands in your field service software with the details and a summary.", benefit: "Dispatch starts the day with the job already written up." },
      ],
      summary: "Peak season and after-hours calls stop rolling to voicemail. Every call becomes a booked job or a dispatched emergency.",
    },
    tools: [
      { name: "ServiceTitan", file: "servicetitan.png" },
      { name: "Jobber", file: "jobber.png" },
      { name: "Housecall Pro", file: "housecall-pro.png" },
      { name: "Workiz", file: "workiz.png" },
    ],
  },
  {
    label: "Solar",
    calls: ["New lead calls from ads and forms", "Qualifying homeowners", "Site-survey booking", "Existing install questions"],
    handoff: "Qualified homeowners are booked onto your sales calendar.",
    journey: {
      scenario: "Rachel sees your solar ad on Sunday evening and calls the number on it.",
      steps: [
        { when: "8:05 PM Sunday", channel: "Call", title: "The call is answered on the first ring", journey: "Rachel talks to an assistant while her interest is at its highest, not to a voicemail greeting.", benefit: "Ad spend turns into conversations instead of missed calls." },
        { when: "8:06 PM", channel: "Qualify", title: "It asks your qualifying questions", journey: "Homeowner or renter, roof type, monthly electric bill, and any timeline she has.", benefit: "Your sales team talks to qualified homeowners, not tire-kickers." },
        { when: "8:09 PM", channel: "Routing", title: "It hands off what needs a person", journey: "Questions about pricing specifics or financing go to your team. It doesn't quote numbers it wasn't given.", benefit: "Nothing is promised that your team can't keep." },
        { when: "8:11 PM", channel: "Booking + text", title: "It books the consultation", journey: "Rachel picks a slot on your sales calendar and gets a confirmation text.", benefit: "The appointment is on the books before she calls a competitor." },
        { when: "8:12 PM", channel: "CRM", title: "The lead is in your system", journey: "Contact, answers and the booking are logged in your CRM with a summary.", benefit: "Your closers start with context." },
      ],
      summary: "Every ad-driven call gets answered and qualified, and your sales team spends its time on booked consultations.",
    },
    tools: [
      { name: "OpenSolar", file: "opensolar.png" },
      { name: "Aurora Solar", file: "aurora-solar.png" },
      { name: "Enerflo", file: "enerflo.png" },
      { name: "HubSpot", file: "hubspot.png" },
    ],
  },
  {
    label: "Roofing",
    calls: ["Leak and storm-damage calls", "Inspection booking", "Insurance claim questions", "Quote requests"],
    handoff: "Storm surges get answered at once instead of rolling to voicemail.",
    journey: {
      scenario: "A storm passes through and Dave finds a leak in his ceiling at 6:30 PM.",
      steps: [
        { when: "6:30 PM Thursday", channel: "Call", title: "The call is answered on the first ring", journey: "Dave reaches an assistant while every roofer in town is getting the same call.", benefit: "During a storm surge, answered calls are the whole game." },
        { when: "6:31 PM", channel: "Intake", title: "It captures the damage", journey: "Address, what he sees, whether water is coming in, and whether he has filed an insurance claim.", benefit: "Your estimator knows the situation before the first call back." },
        { when: "6:34 PM", channel: "Routing", title: "It flags the urgent ones", journey: "Active leaks go to your on-call contact under your rules. It doesn't give repair or insurance advice.", benefit: "The worst cases are handled first." },
        { when: "6:36 PM", channel: "Booking + text", title: "It books the inspection", journey: "Dave gets an inspection slot and a confirmation text.", benefit: "The inspection is booked while competitors are still on hold." },
        { when: "6:37 PM", channel: "CRM", title: "The job is in your system", journey: "The lead, damage details and booking land in your roofing software with a summary.", benefit: "No sticky notes, no lost leads." },
      ],
      summary: "Storm surges and after-hours calls get answered instead of rolling to voicemail. Every call becomes a booked inspection.",
    },
    tools: [
      { name: "JobNimbus", file: "jobnimbus.png" },
      { name: "AccuLynx", file: "acculynx.png" },
      { name: "ServiceTitan", file: "servicetitan.png" },
      { name: "Roofr", file: "roofr.png" },
    ],
  },
  {
    label: "Injury Law",
    calls: ["New accident intake", "Case status questions", "After-hours emergencies", "Consultation booking"],
    handoff: "Urgent or time-sensitive calls go straight to your intake team with a summary.",
    journey: {
      scenario: "Dana is rear-ended on the highway at 10 PM on a Friday. Her neck hurts.",
      steps: [
        { when: "10:20 PM Friday", channel: "Call", title: "The call is answered on the first ring", journey: "Dana gets a calm assistant that says it's the firm's virtual intake assistant and asks if she's safe.", benefit: "The caller who needs help tonight reaches your firm, not the next one." },
        { when: "10:22 PM", channel: "Intake", title: "It takes the intake an attorney needs", journey: "Name, number, when and where it happened, medical care so far, and whether another firm already represents her. It gives no legal advice.", benefit: "Attorneys read a complete intake, not a vague voicemail." },
        { when: "10:26 PM", channel: "Routing", title: "It marks the case urgent", journey: "Time-sensitive details are flagged to your on-call attorney under your rules.", benefit: "Urgent cases reach a person fast." },
        { when: "10:28 PM", channel: "Booking + text", title: "It books the consultation", journey: "Dana picks a callback tonight or a free consultation Monday and gets a confirmation text.", benefit: "The consultation is booked before another firm picks up." },
        { when: "10:29 PM", channel: "CRM", title: "The matter is waiting in your system", journey: "A new contact and matter are created in your case management tool with a summary.", benefit: "Intake starts Monday morning with qualified matters." },
      ],
      summary: "No after-hours inquiry goes cold. Your team starts each day with booked consultations and complete intakes.",
    },
    tools: [
      { name: "Clio", file: "clio.png" },
      { name: "Lawmatics", file: "lawmatics.png" },
      { name: "Litify", file: "litify.png" },
      { name: "PracticePanther", file: "practicepanther.png" },
      { name: "Filevine", file: "filevine.png" },
    ],
  },
  {
    label: "Debt Relief",
    calls: ["New inquiry calls", "Qualifying callers", "Consultation booking", "Existing client questions"],
    handoff: "Qualified callers are booked with your enrollment team.",
    journey: {
      scenario: "James is behind on several accounts and calls on Saturday evening after another collections letter.",
      steps: [
        { when: "7:10 PM Saturday", channel: "Call", title: "The call is answered on the first ring", journey: "James reaches an assistant at the moment he has decided to ask for help.", benefit: "The moment someone decides to call is short. Answer it." },
        { when: "7:12 PM", channel: "Intake", title: "It collects what your team needs", journey: "Name, number, a rough picture of his situation and the questions your enrollment team asks. It doesn't give financial advice or promise outcomes.", benefit: "Your team gets a complete first conversation to build on." },
        { when: "7:16 PM", channel: "Routing", title: "It hands off anything sensitive", journey: "Questions about specific results or fees go to your licensed staff. Nothing is promised that the assistant can't deliver.", benefit: "Compliance stays with your people." },
        { when: "7:18 PM", channel: "Booking + text", title: "It books the consultation", journey: "James picks a time with your enrollment team and gets a confirmation text.", benefit: "He talks to a person at a time he chose." },
        { when: "7:19 PM", channel: "CRM", title: "The lead is in your system", journey: "The contact, the intake details and the booking are logged in your CRM.", benefit: "Your team starts with context, not a cold call." },
      ],
      summary: "More of the people who call actually reach an enrollment conversation, and your licensed staff keep every compliance-sensitive discussion.",
    },
    tools: [
      { name: "FORTH", file: "forth.png" },
      { name: "Salesforce", file: "salesforce.png" },
      { name: "HubSpot", file: "hubspot.png" },
    ],
  },
];

export function Integrations() {
  const [active, setActive] = useState(0);
  const [step, setStep] = useState(0);
  const niche = NICHES[active];
  const stepRefs = useRef<(HTMLLIElement | null)[]>([]);

  // The step crossing the middle of the viewport becomes the active one.
  useEffect(() => {
    setStep(0);
    if (typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setStep(Number((e.target as HTMLElement).dataset.i));
        });
      },
      { rootMargin: "-45% 0px -45% 0px" },
    );
    stepRefs.current.forEach((el) => el && io.observe(el));
    return () => io.disconnect();
  }, [active]);

  const cur = niche.journey.steps[step];

  return (
    <Section id="integrations">
      <div className="text-center">
        <SectionLabel>Industries &amp; integrations</SectionLabel>
        <SectionHeading className="mx-auto mt-4 max-w-3xl">
          Pick your industry. Follow one call from ring to booked.
        </SectionHeading>
      </div>

      <div role="tablist" aria-label="Industry" className="mt-10 flex flex-wrap justify-center gap-2">
        {NICHES.map((n, i) => (
          <button
            key={n.label}
            role="tab"
            aria-selected={active === i}
            onClick={() => setActive(i)}
            className={
              "rounded-btn px-4 py-2 text-sm font-medium transition-colors duration-200 " +
              (active === i
                ? "bg-text-primary text-bg"
                : "bg-surface text-text-primary hover:bg-border-subtle")
            }
          >
            {n.label}
          </button>
        ))}
      </div>

      <div key={niche.label} className="anim-fade mt-14 grid gap-10 lg:grid-cols-[360px_1fr] lg:gap-14">
        {/* Sticky panel: follows the scroll and shows what the active step means for the business. */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <SectionLabel>The journey of one {niche.label} call</SectionLabel>
          <p className="mt-3 font-display text-2xl font-medium leading-tight tracking-tight2 sm:text-3xl">{niche.journey.scenario}</p>
          <div className="mt-7 hidden rounded-card bg-surface-elevated p-6 shadow-float lg:block" aria-live="polite">
            <div key={step} className="anim-fade">
              <span className="grid h-16 w-16 place-items-center rounded-card bg-accent-tint text-accent-ink">
                <ChannelIcon channel={cur.channel} className="h-8 w-8" />
              </span>
              <p className="mt-4 text-xs font-medium uppercase tracking-[0.14em] text-text-muted">{cur.when}</p>
              <p className="mt-1 font-display text-xl font-medium tracking-tight2">{cur.title}</p>
              <p className="mt-4 text-xs font-medium uppercase tracking-[0.14em] text-accent-ink">For you</p>
              <p className="mt-1 text-sm leading-relaxed text-text-primary">{cur.benefit}</p>
            </div>
            <p className="mt-6 text-xs font-medium uppercase tracking-[0.14em] text-text-muted">
              Step {step + 1} of {niche.journey.steps.length}
            </p>
          </div>
        </aside>

        <ol>
          {niche.journey.steps.map((st, i) => (
            <li
              key={st.title}
              ref={(el) => {
                stepRefs.current[i] = el;
              }}
              data-i={i}
              className="relative pb-16 pl-10 last:pb-0 sm:pl-14 lg:pb-24"
            >
              {i < niche.journey.steps.length - 1 && (
                <span aria-hidden="true" className="absolute left-[15px] top-8 h-full w-px bg-border-active sm:left-[19px]">
                  <span className={"block w-full bg-accent transition-all duration-700 " + (i < step ? "h-full" : "h-0")} />
                </span>
              )}
              <span
                aria-hidden="true"
                className={
                  "absolute left-0 top-0 grid h-8 w-8 place-items-center rounded-full border transition-colors duration-500 sm:h-10 sm:w-10 " +
                  (i <= step ? "border-accent bg-accent text-text-primary" : "border-border-active bg-bg text-text-muted")
                }
              >
                <ChannelIcon channel={st.channel} className="h-4 w-4 sm:h-5 sm:w-5" />
              </span>
              <div className={"rounded-card bg-surface p-5 transition-all duration-500 sm:p-6 " + (i === step ? "opacity-100 shadow-float" : "opacity-60")}>
                <div className="flex flex-wrap items-center gap-2 text-xs font-medium uppercase tracking-[0.14em] text-text-muted">
                  <span>{st.when}</span>
                  <span className="rounded-full bg-bg px-2 py-0.5 text-text-secondary shadow-ring">{st.channel}</span>
                </div>
                <h4 className="mt-3 font-display text-xl font-medium tracking-tight2">{st.title}</h4>
                <p className="mt-2 text-sm leading-relaxed text-text-secondary">{st.journey}</p>
                <p className="mt-3 text-sm leading-relaxed text-text-primary lg:hidden">
                  <span className="text-xs font-medium uppercase tracking-[0.14em] text-accent-ink">For you </span>
                  {st.benefit}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </div>

      {/* Everything else, at the end. */}
      <div className="mx-auto mt-20 max-w-3xl rounded-panel bg-surface p-6 sm:p-10">
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-accent-ink">What this means for your business</p>
        <p className="mt-2 text-lg leading-relaxed text-text-primary">{niche.journey.summary}</p>
        <h3 className="mt-8 font-display text-xl font-medium tracking-tight2">Popular use cases in {niche.label}</h3>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
          {niche.calls.map((x) => (
            <li key={x} className="rounded-card bg-surface-elevated px-4 py-3 text-sm shadow-ring text-text-secondary">{x}</li>
          ))}
        </ul>
        <p className="mt-4 text-sm leading-relaxed text-text-secondary">{niche.handoff}</p>
      </div>

      <h3 className="mt-16 text-center font-display text-2xl font-medium tracking-tight2">Integrates with your CRM</h3>
      <ul key={active} className="reveal-stagger is-visible mt-8 flex flex-wrap items-center justify-center gap-3 rounded-panel bg-surface p-6 sm:p-10">
        {niche.tools.map((t) => (
          <li key={t.name} className="grid h-24 w-24 place-items-center rounded-card bg-bg p-3 shadow-ring sm:h-28 sm:w-28">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`/integrations/${t.file}`} alt={t.name} className="h-10 w-10 object-contain sm:h-12 sm:w-12" />
          </li>
        ))}
      </ul>
    </Section>
  );
}
