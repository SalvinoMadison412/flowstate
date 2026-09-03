"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { useReveal } from "@/lib/useReveal";
import { submitLead, type LeadType, type ServiceInterest } from "@/lib/leads";

const SERVICE_OPTIONS: { value: ServiceInterest; label: string }[] = [
  { value: "meta_ads", label: "Meta Ads" },
  { value: "google_ads", label: "Google Ads" },
  { value: "geo", label: "GEO" },
  { value: "not_sure", label: "Not sure yet" },
];

const LEAD_TYPES: { value: LeadType; label: string }[] = [
  { value: "book_call", label: "Book a call" },
  { value: "strategy_demo", label: "Strategy demo" },
];

const inputClass =
  "h-12 w-full rounded-xl border border-border-active bg-bg px-4 text-sm text-text-primary placeholder:text-text-muted focus-visible:border-white focus-visible:outline-none";

const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function FinalCTA() {
  const { ref, shown } = useReveal<HTMLDivElement>();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [service, setService] = useState<ServiceInterest | "">("");
  const [leadType, setLeadType] = useState<LeadType>("book_call");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "done" | "error">(
    "idle",
  );

  const valid = name.trim().length > 0 && emailRe.test(email);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid || status === "submitting") return;
    setStatus("submitting");
    try {
      await submitLead({
        name: name.trim(),
        email: email.trim(),
        company: company.trim() || undefined,
        service_interest: service || undefined,
        lead_type: leadType,
        message: message.trim() || undefined,
      });
      setStatus("done");
    } catch {
      setStatus("error");
    }
  }

  return (
    <section
      id="audit"
      className="relative overflow-hidden border-y border-border-subtle px-5 py-28 sm:py-36"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 animate-radial-pulse rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.9)_0%,transparent_65%)]"
      />

      <div
        ref={ref}
        className={cn(
          "reveal relative mx-auto max-w-xl text-center",
          shown && "is-visible",
        )}
      >
        <h2 className="font-display text-3xl font-bold leading-[1.1] tracking-display sm:text-5xl">
          Book a free strategy call.
        </h2>
        <p className="mx-auto mt-5 max-w-lg text-lg text-text-secondary">
          Tell us where you want to grow. We&rsquo;ll show you which channels
          &mdash; Meta, Google, GEO &mdash; get you there fastest. 30 minutes, no
          pitch.
        </p>

        {status === "done" ? (
          <p className="mx-auto mt-9 max-w-md rounded-xl border border-border-active bg-surface px-5 py-4 text-sm text-text-primary">
            Got it. We&rsquo;ll reply within one business day with times.
          </p>
        ) : (
          <form onSubmit={onSubmit} className="mt-9 space-y-3 text-left">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="lead-name" className="sr-only">
                  Name
                </label>
                <input
                  id="lead-name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Name"
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="lead-email" className="sr-only">
                  Work email
                </label>
                <input
                  id="lead-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  className={inputClass}
                />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="lead-company" className="sr-only">
                  Company
                </label>
                <input
                  id="lead-company"
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="Company (optional)"
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="lead-service" className="sr-only">
                  Service you&rsquo;re interested in
                </label>
                <select
                  id="lead-service"
                  value={service}
                  onChange={(e) =>
                    setService(e.target.value as ServiceInterest | "")
                  }
                  className={cn(inputClass, "appearance-none")}
                >
                  <option value="">Interested in… (optional)</option>
                  {SERVICE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <fieldset className="flex gap-2">
              <legend className="sr-only">What do you want to book?</legend>
              {LEAD_TYPES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  aria-pressed={leadType === t.value}
                  onClick={() => setLeadType(t.value)}
                  className={cn(
                    "h-11 flex-1 rounded-xl border text-sm transition-colors",
                    leadType === t.value
                      ? "border-white bg-white/5 text-text-primary"
                      : "border-border-active text-text-secondary hover:text-text-primary",
                  )}
                >
                  {t.label}
                </button>
              ))}
            </fieldset>

            <div>
              <label htmlFor="lead-message" className="sr-only">
                Anything we should know?
              </label>
              <textarea
                id="lead-message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Anything we should know? (optional)"
                rows={3}
                className={cn(inputClass, "h-auto resize-none py-3")}
              />
            </div>

            <button
              type="submit"
              disabled={!valid || status === "submitting"}
              className="h-12 w-full rounded-xl bg-white px-6 text-sm font-medium text-bg transition-colors hover:bg-accent hover:text-bg disabled:cursor-not-allowed disabled:opacity-40"
            >
              {status === "submitting" ? "Sending…" : "Request my call"}
            </button>

            {status === "error" && (
              <p className="text-sm text-text-secondary">
                Something went wrong. Email us at hello@flowstate.agency and
                we&rsquo;ll sort it out.
              </p>
            )}
          </form>
        )}
      </div>
    </section>
  );
}
