"use client";

import { Section, SectionHeading, SectionLabel } from "@/components/ui/Section";
import { Reveal } from "@/components/ui/Reveal";
import { Button } from "@/components/ui/Button";
import { VoiceWaveform } from "@/components/ui/VoiceWaveform";
import { EndCallButton } from "@/components/ui/EndCallButton";
import { useVoiceCall } from "@/lib/useVoiceCall";
import { cn } from "@/lib/utils";

const CALL = [
  { who: "Caller", text: "Hi, do you have anything Saturday afternoon for a gel pedicure?" },
  { who: "Maoshi", text: "I can take that request. What's your name and best number?" },
  { who: "Caller", text: "It's Priya, 555 0134." },
  { who: "Maoshi", text: "Thanks Priya. I've noted Saturday afternoon, gel pedicure. The salon will text you to confirm the slot." },
  { who: "Caller", text: "Can I talk to someone?" },
  { who: "Maoshi", text: "Of course. Putting you through to the team now." },
];

const POINTS = [
  { title: "Answers every call", body: "No hold music, no voicemail. Callers get a real conversation the moment they ring, day or night." },
  { title: "Knows your business", body: "Hours, services, prices and policies live in its instructions. If it doesn't know something, it says so instead of guessing." },
  { title: "Hands off to your team", body: "A person is always one request away. Bookings and anything unusual go to the people who close them." },
];

export function VoiceAgent() {
  const { status, error, toggle } = useVoiceCall();

  return (
    <Section id="voice-agent">
      <SectionLabel>Voice agents</SectionLabel>
      <SectionHeading className="mt-4 max-w-3xl">
        Every missed call is a missed booking. Maoshi never misses one.
      </SectionHeading>
      <p className="mt-6 max-w-2xl text-sm leading-relaxed text-text-secondary sm:text-base">
        A Flow State voice agent works your phone line around the clock. It is
        built for businesses with several locations or heavy call volume, and
        you can talk to a live one right now.
      </p>

      <div className="mt-12 grid gap-6 lg:grid-cols-2">
        <Reveal className="rounded-2xl border border-border-active bg-surface-elevated p-6 sm:p-8">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs uppercase tracking-[0.2em] text-text-secondary">
              Example call
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-text-muted">
              Illustrative
            </span>
          </div>
          <ul className="mt-6 space-y-3">
            {CALL.map((line, i) => (
              <li
                key={i}
                className={cn(
                  "tx-line max-w-[88%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                  line.who === "Maoshi"
                    ? "ml-auto rounded-br-sm border border-accent/30 bg-accent/10 text-text-primary"
                    : "rounded-bl-sm border border-border-active bg-surface text-text-secondary",
                )}
                style={{ ["--d" as string]: `${i * 1.7}s` }}
              >
                <span className="mb-0.5 block font-mono text-[10px] uppercase tracking-[0.16em] text-text-muted">
                  {line.who}
                </span>
                {line.text}
              </li>
            ))}
          </ul>
        </Reveal>

        <div className="flex flex-col gap-4">
          <Reveal className="flex flex-col gap-4">
            {POINTS.map((p) => (
              <div key={p.title} className="rounded-2xl border border-border-subtle bg-surface p-5 sm:p-6">
                <h3 className="font-display text-lg font-bold tracking-display">{p.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-text-secondary">{p.body}</p>
              </div>
            ))}
          </Reveal>

          <Reveal className="flex flex-wrap items-center gap-4 rounded-2xl border border-border-active bg-surface-elevated p-5 sm:p-6">
            {status === "live" || status === "connecting" ? (
              <EndCallButton />
            ) : (
              <Button variant="filled" size="lg" onClick={toggle}>
                Talk to Maoshi
              </Button>
            )}
            <VoiceWaveform className="w-[96px]" />
            <span role="status" aria-live="polite" className="font-mono text-xs text-text-secondary">
              {status === "live" && "Live. Say hello."}
              {status === "error" && <span className="text-red-400">{error}</span>}
            </span>
          </Reveal>
        </div>
      </div>

      <p className="mt-10 max-w-2xl text-sm text-text-secondary sm:text-base">
        And to make the phone ring in the first place, we run the marketing:
        Meta Ads, Google Ads and GEO.
      </p>
    </Section>
  );
}
