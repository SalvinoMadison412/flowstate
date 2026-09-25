"use client";

import { useEffect, useRef, useState } from "react";
import type { Call, Device } from "@twilio/voice-sdk";
import { Section, SectionHeading, SectionLabel } from "@/components/ui/Section";
import { Reveal } from "@/components/ui/Reveal";
import { Button } from "@/components/ui/Button";

const DEMO_NUMBER = "+16292818264";
const DEMO_NUMBER_DISPLAY = "+1 (629) 281-8264";

type Status = "idle" | "connecting" | "live" | "error";

export function VoiceDemo() {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");
  const device = useRef<Device | null>(null);
  const call = useRef<Call | null>(null);

  useEffect(() => () => device.current?.destroy(), []);

  const fail = (msg: string) => {
    setError(msg);
    setStatus("error");
    device.current?.destroy();
    device.current = null;
  };

  async function start() {
    setError("");
    setStatus("connecting");
    try {
      const res = await fetch("/api/twilio/demo-token", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) return fail(data.error || "Could not start the demo.");

      // Loaded on click so the SDK stays out of the initial page bundle.
      const { Device } = await import("@twilio/voice-sdk");
      const dev = new Device(data.token, { closeProtection: true });
      device.current = dev;
      dev.on("error", () => fail("Call failed. Try the phone number instead."));

      const c = await dev.connect();
      call.current = c;
      c.on("accept", () => setStatus("live"));
      c.on("disconnect", () => {
        setStatus("idle");
        dev.destroy();
        device.current = null;
      });
      c.on("cancel", () => setStatus("idle"));
    } catch (e) {
      const denied = (e as Error).name === "NotAllowedError";
      fail(
        denied
          ? "Microphone access was blocked. Allow it and try again, or use the phone number."
          : "Could not start the call. Try the phone number instead.",
      );
    }
  }

  const busy = status === "connecting" || status === "live";

  return (
    <Section id="voice-demo">
      <SectionLabel>Live demo</SectionLabel>
      <SectionHeading className="mt-4 max-w-2xl">
        Talk to our AI receptionist. Right now.
      </SectionHeading>
      <p className="mt-6 max-w-2xl text-sm leading-relaxed text-text-secondary sm:text-base">
        This is the same voice agent we build for multi-location businesses: it
        answers, books, and hands off to a human when asked. Call it from your
        phone or straight from this page.
      </p>

      <Reveal className="mt-12 grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-border-active bg-surface-elevated p-7 sm:p-8">
          <div className="font-mono text-xs uppercase tracking-[0.2em] text-text-secondary">
            Option 1 &middot; From your phone
          </div>
          <a
            href={`tel:${DEMO_NUMBER}`}
            className="mt-5 block font-display text-2xl font-bold tracking-display hover:text-accent sm:text-3xl"
          >
            {DEMO_NUMBER_DISPLAY}
          </a>
          <p className="mt-3 text-sm text-text-secondary">
            Call any time. Standard carrier rates apply.
          </p>
          <div className="mt-6">
            <Button href={`tel:${DEMO_NUMBER}`} variant="ghost" size="md">
              Call now
            </Button>
          </div>
        </div>

        <div className="rounded-2xl border border-border-active bg-surface-elevated p-7 sm:p-8">
          <div className="font-mono text-xs uppercase tracking-[0.2em] text-text-secondary">
            Option 2 &middot; From your browser
          </div>
          <p className="mt-5 text-sm leading-relaxed text-text-secondary">
            No phone needed. Allow your microphone and talk to the agent from
            this device.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-4">
            {status === "live" ? (
              <Button variant="outline" size="md" onClick={() => call.current?.disconnect()}>
                End call
              </Button>
            ) : (
              <Button variant="filled" size="md" onClick={start} disabled={busy}>
                {status === "connecting" ? "Connecting…" : "Talk to our AI"}
              </Button>
            )}
            <span
              role="status"
              aria-live="polite"
              className="font-mono text-xs text-text-secondary"
            >
              {status === "live" && "Live. Say hello."}
              {status === "error" && <span className="text-red-400">{error}</span>}
            </span>
          </div>
        </div>
      </Reveal>
    </Section>
  );
}
