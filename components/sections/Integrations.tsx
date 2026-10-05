"use client";

import { useState } from "react";
import { Section, SectionHeading, SectionLabel } from "@/components/ui/Section";

type Tool = { name: string; file: string; about: string; agent: string; value: string };

// Ordered by market rank within each niche.
// Logos: /public/integrations/<file>. Favicon-grade; swap in official SVGs when available.
const SHOW_HEALTHCARE = false; // TODO(owner): enable only once a BAA/HIPAA answer exists.
const NICHES: { label: string; tools: Tool[] }[] = [
  {
    label: "Legal",
    tools: [
      { name: "Clio", file: "clio.png", about: "The most widely used practice management and intake CRM (Clio Manage / Clio Grow) for small and mid-size firms.", agent: "Answers every inquiry, collects case details and conflict-check info, and logs a new contact and matter in Clio Grow.", value: "No after-hours lead goes cold, and your intake team starts the day with qualified matters instead of voicemails." },
      { name: "Lawmatics", file: "lawmatics.png", about: "Legal CRM focused on marketing and intake automation, with pipelines and follow-up sequences.", agent: "Captures the caller's details and case type, then drops them into the right Lawmatics pipeline stage.", value: "Leads enter your automated follow-up the minute they call, so fewer slip away to the next firm." },
      { name: "Litify", file: "litify.png", about: "Enterprise legal CRM and case management built on Salesforce, common in high-volume injury firms.", agent: "Runs structured intake for each matter type and creates the intake record for your team to review.", value: "High call volume gets consistent, complete intake without adding headcount." },
      { name: "PracticePanther", file: "practicepanther.png", about: "Practice management software for billing, matters, and client communication.", agent: "Takes new-client calls, books consultations, and creates the contact and matter.", value: "Fewer missed first calls and no re-keying of intake notes." },
      { name: "Filevine", file: "filevine.png", about: "Case management platform used by plaintiff and litigation firms to run matters end to end.", agent: "Handles first-contact intake and passes the structured details into a new project.", value: "Cases start with clean data, and attorneys see urgent ones first." },
    ],
  },
  {
    label: "Real Estate & Property",
    tools: [
      { name: "AppFolio", file: "appfolio.png", about: "Leading property management platform for residential and mixed portfolios.", agent: "Answers tenant and prospect calls, logs maintenance requests, and books showings.", value: "Tenants get answers at any hour, and your staff stops fielding routine calls." },
      { name: "Yardi", file: "yardi.png", about: "Enterprise property management suite (Voyager / Breeze) for large and multi-site portfolios.", agent: "Triages after-hours maintenance calls, flags emergencies, and records requests for your team.", value: "Emergencies reach the on-call tech fast and nothing is lost overnight." },
      { name: "RealPage", file: "realpage.png", about: "Multifamily property management and leasing platform.", agent: "Answers leasing inquiries, qualifies prospects, and schedules tours.", value: "Every prospect call becomes a lead or a tour, even when the office is closed." },
      { name: "Buildium", file: "buildium.png", about: "Property management software popular with small and mid-size managers.", agent: "Takes owner and tenant calls, creates maintenance tasks, and routes anything urgent.", value: "A small team handles a larger portfolio without missing calls." },
      { name: "HubSpot", file: "hubspot.png", about: "General-purpose CRM widely used by brokerages and sales teams.", agent: "Answers portal and ad leads instantly, qualifies them, and creates the contact with notes.", value: "Speed-to-lead goes from hours to seconds, which is what wins listings and buyers." },
    ],
  },
  {
    label: "Home Services & Restoration",
    tools: [
      { name: "ServiceTitan", file: "servicetitan.png", about: "Field service software for HVAC, plumbing, electrical, and roofing contractors.", agent: "Answers booking and emergency calls, captures the job details, and creates the job request.", value: "Every call turns into a booked job, even during peak season or after hours." },
      { name: "Jobber", file: "jobber.png", about: "Field service management for quoting, scheduling, and invoicing.", agent: "Takes new-job requests, collects address and issue, and books the visit.", value: "Owners stop answering from the truck and stop losing jobs to voicemail." },
      { name: "Housecall Pro", file: "housecall-pro.png", about: "Home service dispatch, scheduling, and customer CRM.", agent: "Books appointments, captures job details, and escalates emergencies.", value: "Your calendar fills while your crew is on site." },
      { name: "Workiz", file: "workiz.png", about: "Field service management with a built-in call center and phone system.", agent: "Handles inbound calls, qualifies the job, and creates the lead or job.", value: "Replaces missed calls and answering-service costs with one always-on line." },
    ],
  },
  {
    label: "Healthcare & Treatment",
    tools: [
      { name: "Kipu", file: "kipu.png", about: "EMR and billing platform for addiction treatment and behavioral health providers.", agent: "Handles first-contact inquiries with empathy, gathers admissions screening details, and books the next step.", value: "Callers in crisis reach a person-quality response at any hour, and admissions get a ready summary." },
      { name: "Netsmart", file: "netsmart.png", about: "Behavioral health and senior care EHR used across large provider networks.", agent: "Answers intake and scheduling calls and routes urgent ones to staff.", value: "Shorter wait to a first conversation and less front-desk load." },
      { name: "Qualifacts", file: "qualifacts.png", about: "Behavioral health EHR (SmartCare) for outpatient and community providers.", agent: "Takes new-patient inquiries, collects basic details, and schedules intake.", value: "Fewer no-contact leads and a fuller intake calendar." },
      { name: "Salesforce Health Cloud", file: "salesforce-health-cloud.svg", about: "Healthcare CRM for patient intake, engagement, and care coordination.", agent: "Captures patient inquiries and creates the lead or case with the details gathered.", value: "A consistent, auditable first touch across every location." },
    ],
  },
];

const niches = NICHES.filter((n) => SHOW_HEALTHCARE || n.label !== "Healthcare & Treatment");

export function Integrations() {
  const [active, setActive] = useState(0);
  const [picked, setPicked] = useState<Tool>(niches[0].tools[0]);
  const tools = niches[active].tools;

  return (
    <Section id="integrations">
      <div className="text-center">
        <SectionLabel>Integrations</SectionLabel>
        <SectionHeading className="mx-auto mt-4 max-w-2xl">
          Built to connect to the tools you already use.
        </SectionHeading>
        <p className="mx-auto mt-4 max-w-xl text-sm text-text-secondary">Each connection is set up for your firm, through the tool&apos;s API or a webhook where one is available. We&apos;ll confirm what&apos;s possible for your setup on the call.</p>
      </div>

      <div role="tablist" className="mt-10 flex flex-wrap justify-center gap-2">
        {niches.map((n, i) => (
          <button
            key={n.label}
            role="tab"
            aria-selected={active === i}
            onClick={() => {
              setActive(i);
              setPicked(n.tools[0]);
            }}
            className={
              "rounded-full border px-4 py-2 text-sm transition-colors duration-200 " +
              (active === i
                ? "border-white bg-white text-bg"
                : "border-border-active text-text-secondary hover:text-text-primary")
            }
          >
            {n.label}
          </button>
        ))}
      </div>

      <div className="mt-12 grid items-start gap-8 lg:grid-cols-2 lg:gap-12">
        <div>
          {/* key remounts the list so the staggered entrance replays on each tab switch */}
          <ul key={active} className="reveal-stagger is-visible flex flex-wrap items-center justify-center gap-6 sm:gap-10 lg:gap-8">
            {tools.map((t) => (
              <li key={t.name}>
                <button
                  type="button"
                  aria-label={t.name}
                  aria-pressed={picked.name === t.name}
                  aria-controls="integration-note"
                  onMouseEnter={() => setPicked(t)}
                  onFocus={() => setPicked(t)}
                  onClick={() => setPicked(t)}
                  className={
                    "grid h-24 w-24 place-items-center rounded-2xl bg-white p-3 outline-none transition duration-300 ease-out hover:scale-105 hover:opacity-100 focus-visible:scale-105 focus-visible:opacity-100 sm:h-28 sm:w-28 lg:h-32 lg:w-32 " +
                    (picked.name === t.name ? "scale-105 ring-2 ring-accent shadow-accent-glow" : "opacity-70 ring-1 ring-white/10")
                  }
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={`/integrations/${t.file}`} alt="" className="h-full w-full object-contain" />
                </button>
              </li>
            ))}
          </ul>
          <p className="mt-6 text-center font-mono text-xs uppercase tracking-[0.16em] text-text-muted">
            Hover, tap or tab through the logos
          </p>
        </div>

        {/* Always shows a note; min-height on mobile keeps the page from shifting between tools. */}
        <div id="integration-note" aria-live="polite" className="min-h-[24rem] lg:min-h-0">
          <div key={picked.name} className="anim-fade rounded-2xl border border-border-active bg-surface-elevated p-5 sm:p-6">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-white p-1.5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`/integrations/${picked.file}`} alt="" className="h-full w-full object-contain" />
              </span>
              <h3 className="font-display text-xl font-bold tracking-display">{picked.name}</h3>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-text-secondary">{picked.about}</p>
            <dl className="mt-4 grid gap-4 text-sm leading-relaxed">
              <div>
                <dt className="font-mono text-[10px] uppercase tracking-[0.16em] text-accent">What the voice agent can do</dt>
                <dd className="mt-1 text-text-secondary">{picked.agent}</dd>
              </div>
              <div>
                <dt className="font-mono text-[10px] uppercase tracking-[0.16em] text-accent">How it helps your business</dt>
                <dd className="mt-1 text-text-secondary">{picked.value}</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </Section>
  );
}
