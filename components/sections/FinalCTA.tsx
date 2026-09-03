"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { useReveal } from "@/lib/useReveal";

export function FinalCTA() {
  const { ref, shown } = useReveal<HTMLDivElement>();
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  return (
    <section
      id="audit"
      className="relative overflow-hidden border-y border-border-subtle px-5 py-28 sm:py-36"
    >
      {/* slow radial pulse, very low opacity white glow — no cyan here */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 animate-radial-pulse rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.9)_0%,transparent_65%)]"
      />

      <div
        ref={ref}
        className={cn("reveal relative mx-auto max-w-2xl text-center", shown && "is-visible")}
      >
        <h2 className="font-display text-3xl font-bold leading-[1.1] tracking-display sm:text-5xl">
          Book a free strategy call.
        </h2>
        <p className="mx-auto mt-5 max-w-lg text-lg text-text-secondary">
          Tell us where you want to grow. We&rsquo;ll show you which channels
          &mdash; Meta, Google, GEO &mdash; get you there fastest. 30 minutes, no
          pitch.
        </p>

        {submitted ? (
          <p className="mx-auto mt-9 max-w-md rounded-xl border border-border-active bg-surface px-5 py-4 text-sm text-text-primary">
            Got it. We&rsquo;ll email you a booking link within one business day.
          </p>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (valid) setSubmitted(true);
            }}
            className="mx-auto mt-9 flex max-w-md flex-col gap-3 sm:flex-row"
          >
            <label htmlFor="cta-email" className="sr-only">
              Work email
            </label>
            <input
              id="cta-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              className="h-12 flex-1 rounded-full border border-white/70 bg-bg px-5 text-sm text-text-primary placeholder:text-text-muted focus-visible:border-white focus-visible:outline-none"
            />
            <button
              type="submit"
              className="h-12 shrink-0 rounded-full bg-white px-6 text-sm font-medium text-bg transition-colors hover:bg-text-secondary"
            >
              Book the call
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
