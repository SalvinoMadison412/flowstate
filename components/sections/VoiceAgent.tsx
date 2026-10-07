"use client";

import { Section, SectionHeading, SectionLabel } from "@/components/ui/Section";
import { Button } from "@/components/ui/Button";
import Image from "next/image";
import Link from "next/link";
import { FOUNDERS } from "@/components/sections/About";
import { Reveal } from "@/components/ui/Reveal";
import { CallStage } from "@/components/sections/CallStage";
import { cn } from "@/lib/utils";

// Legal first: after-hours personal-injury intake (inbound only, never outbound to law firms).
const CALL: { who: string; text: string }[] = [
  { who: "Agent", text: "Thank you for calling Hartley & Moore Injury Law. I'm the firm's virtual intake assistant. Are you safe right now?" },
  { who: "Caller", text: "Yes. I was rear-ended on the highway tonight. My neck is killing me." },
  { who: "Agent", text: "I'm sorry that happened. If you need medical help, please call 911 first. Otherwise I can take down the details so an attorney can review them. May I have your name and best number?" },
  { who: "Caller", text: "Dana Whitfield, 555 0172." },
  { who: "Agent", text: "Thanks, Dana. When and where did the accident happen, and did you see a doctor or go to the ER?" },
  { who: "Caller", text: "About two hours ago, Route 9. The ER checked me out. Their insurance company already called me." },
  { who: "Agent", text: "An attorney can talk you through that call. Is another law firm already representing you?" },
  { who: "Caller", text: "No, nobody." },
  { who: "Agent", text: "Understood. I can't give legal advice, but I've marked this urgent for our on-call attorney. Would you prefer a call back tonight, or a free consultation Monday at 9?" },
  { who: "Caller", text: "Monday at 9 works." },
  { who: "Agent", text: "Booked. You'll get a text confirmation with the address and what to bring." },
];

const POINTS = [
  { title: "Answers every call", body: "No hold music, no voicemail. Callers get a real conversation the moment they ring, day or night." },
  { title: "Knows your business", body: "Your intake questions, practice areas and policies live in its instructions. If it doesn't know something, it says so instead of guessing." },
  { title: "Hands off to your team", body: "A person is always one request away. Bookings and anything unusual go to the people who close them." },
];

const STEPS = [
  { title: "We learn your intake", body: "Tell us how your firm handles a new caller: the questions you ask, what counts as urgent, and who should hear about it." },
  { title: "We build and test it", body: "We write its script, connect it to your tools where possible, and you call it yourself before it goes live." },
  { title: "It answers your calls", body: "It picks up day and night. Anything urgent or outside its script goes to your team." },
];

// TODO(owner): add cost, time to go live, keeping your number, call recording/consent, languages and HIPAA/BAA only once confirmed. Do not add placeholders that render.
const FAQ = [
  { q: "What if it gets it wrong?", a: "It's instructed to say when it doesn't know something instead of guessing, and to take a message for your team. Its instructions are written with you and can be changed whenever your intake changes." },
  { q: "Does it give legal advice?", a: "No. It's instructed never to give legal advice or say whether someone has a case. Those questions go to an attorney." },
  { q: "Will callers know it's an AI?", a: "Yes. It introduces itself as a virtual assistant and says so if asked." },
  { q: "Can a caller reach a person?", a: "Yes. When a caller asks for someone, it takes their details and flags the call for your team to call back." },
];

export function VoiceAgent() {
  return (
    <Section id="voice-agent">
      <SectionLabel>Voice agents</SectionLabel>
      <SectionHeading className="mt-4 max-w-4xl">
        An AI receptionist that answers your firm&apos;s calls 24/7, takes intake, and passes consult requests to your team.
      </SectionHeading>
      <p className="mt-6 max-w-3xl text-sm leading-relaxed text-text-secondary sm:text-lg">
        It picks up every call, day or night, asks your intake questions, and hands anything urgent or unusual to a person. Try a live one below.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Button href="/contact" variant="filled" size="lg" data-track="hero">Get one for your firm</Button>
      </div>

      <div className="mt-12">
        <CallStage />
      </div>
    </Section>
  );
}

export function VoiceAgentDetails() {
  return (
    <Section>
      <Reveal className="grid gap-4 sm:grid-cols-3">
        {STEPS.map((st, i) => (
          <div key={st.title} className="rounded-2xl border border-border-subtle bg-surface p-5 sm:p-6">
            <span className="font-mono text-xs text-accent">{String(i + 1).padStart(2, "0")}</span>
            <h3 className="mt-2 font-display text-lg font-bold tracking-display">{st.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-text-secondary">{st.body}</p>
          </div>
        ))}
      </Reveal>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Reveal className="rounded-2xl border border-border-active bg-surface-elevated p-6 sm:p-8">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs uppercase tracking-[0.2em] text-text-secondary">
              Example call · Legal
            </span>
            <span className="font-mono text-[0.625rem] uppercase tracking-[0.16em] text-text-muted">
              Sample script
            </span>
          </div>
          <ul className="mt-6 space-y-3">
            {CALL.map((line, i) => (
              <li
                key={i}
                className={cn(
                  "tx-line max-w-[88%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                  line.who === "Agent"
                    ? "ml-auto rounded-br-sm border border-accent/30 bg-accent/10 text-text-primary"
                    : "rounded-bl-sm border border-border-active bg-surface text-text-secondary",
                )}
                style={{ ["--d" as string]: `${i * 2.2}s`, ["--dur" as string]: "34s" }}
              >
                <span className="mb-0.5 block font-mono text-[0.625rem] uppercase tracking-[0.16em] text-text-muted">
                  {line.who}
                </span>
                {line.text}
              </li>
            ))}
          </ul>
          <div className="mt-6 flex flex-wrap gap-2 border-t border-border-subtle pt-5">
            {["Intake captured", "Marked urgent", "Sent to your team", "Consult requested"].map((c) => (
              <span key={c} className="rounded-full border border-border-active px-3 py-1 font-mono text-[0.625rem] uppercase tracking-[0.12em] text-text-secondary">
                {c}
              </span>
            ))}
          </div>
        </Reveal>

        <div className="flex flex-col gap-4">
          <Reveal className="flex flex-col gap-4">
            {POINTS.map((p) => (
              <div key={p.title} className="rounded-2xl border border-border-subtle bg-surface p-5">
                <h3 className="font-display text-lg font-bold tracking-display">{p.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-text-secondary">{p.body}</p>
              </div>
            ))}
          </Reveal>

          <Reveal className="space-y-3">
            <h3 className="font-display text-xl font-bold tracking-display">Questions firms ask</h3>
            {FAQ.map(({ q, a }) => (
              <details key={q} className="group rounded-2xl border border-border-subtle bg-surface p-5">
                <summary className="cursor-pointer font-display text-lg font-bold tracking-display">{q}</summary>
                <p className="mt-3 text-sm leading-relaxed text-text-secondary">{a}</p>
              </details>
            ))}
          </Reveal>

          <div className="flex items-center gap-4 rounded-2xl border border-border-subtle bg-surface p-5">
            <Image src={FOUNDERS[0].photo} alt={FOUNDERS[0].name} width={64} height={64} className="h-16 w-16 rounded-full object-cover" />
            <div>
              <p className="font-display text-lg font-bold tracking-display">{FOUNDERS[0].name}</p>
              <p className="font-mono text-[0.625rem] uppercase tracking-[0.16em] text-text-muted">{FOUNDERS[0].role}</p>
              <p className="mt-1 text-sm text-text-secondary">Flow State is run by its founder. You&apos;ll talk to him directly, not an account manager.</p>
              <Link href="/about" className="mt-1 inline-block text-sm text-accent underline-offset-4 hover:underline">More about us</Link>
            </div>
          </div>

          <p className="px-1 text-xs leading-relaxed text-text-muted">Runs on OpenAI&apos;s Realtime speech model over an encrypted connection. Data sent through OpenAI&apos;s API isn&apos;t used to train their models by default.</p>
        </div>
      </div>
    </Section>
  );
}
