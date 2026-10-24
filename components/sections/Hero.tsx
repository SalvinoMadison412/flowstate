"use client";

import { Button } from "@/components/ui/Button";
import { EndCallButton } from "@/components/ui/EndCallButton";
import { useVoiceCall } from "@/lib/useVoiceCall";

const STATUS_COPY = {
  idle: "Tap the button and allow your mic, then say hello.",
  connecting: "Connecting to Maoshi…",
  live: "Live. Maoshi is listening. Say hello.",
  error: "",
} as const;

export function Hero() {
  const { status, error, toggle } = useVoiceCall();

  return (
    <section id="top" className="px-4 pb-16 pt-8 sm:px-6">
      <div className="mx-auto max-w-site">
        <div className="relative overflow-hidden rounded-panel bg-tile-sky px-6 pb-10 pt-12 sm:px-12 sm:pt-16 lg:grid lg:grid-cols-[1.2fr_1fr] lg:items-center lg:gap-12 lg:py-16">
          {/* Product vignette: FlowState's own sample call (see VoiceAgent.tsx CALL). */}
          <div aria-hidden className="mx-auto grid w-full max-w-3xl gap-3 lg:order-last">
            <div className="ml-auto w-full max-w-md rounded-card bg-surface-elevated p-4 text-text-primary shadow-float">
              <div className="flex items-center justify-between text-xs font-medium text-text-secondary">
                <span className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-accent" />
                  Live · Intake line
                </span>
                <span>Hartley &amp; Moore</span>
              </div>
              <p className="mt-3 text-sm leading-relaxed">
                Thank you for calling Hartley &amp; Moore Injury Law. I&apos;m the firm&apos;s virtual intake assistant. Are you safe right now?
              </p>
            </div>
            <div className="w-full max-w-sm rounded-card bg-bg p-4 text-text-primary shadow-ring">
              <p className="text-xs font-medium text-text-secondary">Caller</p>
              <p className="mt-1 text-sm leading-relaxed">
                Yes. I was rear-ended on the highway tonight. My neck is killing me.
              </p>
            </div>
            <div className="ml-auto flex flex-wrap justify-end gap-2">
              <span className="rounded-full bg-bg px-3 py-1 text-xs font-medium shadow-ring">Intake captured</span>
              <span className="rounded-full bg-bg px-3 py-1 text-xs font-medium shadow-ring">Marked urgent</span>
              <span className="rounded-full bg-text-primary px-3 py-1 text-xs font-medium text-bg">Consult requested</span>
            </div>
          </div>

          {/* Entrance is CSS-driven (see .reveal-up) so the LCP headline is never
              left mid-fade by a throttled tab. */}
          <div className="mt-14 grid items-end gap-8 lg:mt-0">
            <div>
              <p className="reveal-up text-xs font-medium uppercase tracking-[0.18em] text-tile-skyInk">
                AI voice agents &nbsp;&middot;&nbsp; AI automation
              </p>
              <h1
                className="reveal-up mt-4 font-display text-[2.6rem] font-[575] leading-none tracking-display text-tile-skyInk sm:text-6xl lg:text-[72px]"
                style={{ animationDelay: "0.06s" }}
              >
                Meet the AI that <span className="text-accent-ink">answers your phone.</span>
              </h1>
            </div>
            <div className="reveal-up" style={{ animationDelay: "0.13s" }}>
              <p className="max-w-xl text-lg leading-snug text-tile-skyInk">
                Flow State builds voice agents and AI workflows that handle your calls, follow-ups and busywork, so your team can focus on customers.
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                {status === "live" || status === "connecting" ? (
                  <EndCallButton />
                ) : (
                  <Button variant="filled" size="lg" onClick={toggle}>
                    Talk to Maoshi, live →
                  </Button>
                )}
                <Button href="/contact" variant="accent" size="lg">
                  Book a strategy call →
                </Button>
              </div>
              <p role="status" aria-live="polite" className="mt-4 text-xs text-tile-skyInk">
                {status === "error" ? <span className="text-red-700">{error}</span> : STATUS_COPY[status]}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
