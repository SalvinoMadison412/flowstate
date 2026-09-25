"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/Button";
import { EndCallButton } from "@/components/ui/EndCallButton";
import { VoiceWaveform } from "@/components/ui/VoiceWaveform";
import { useVoiceCall } from "@/lib/useVoiceCall";
import { usePrefersReducedMotion } from "@/lib/useReveal";
import { cn } from "@/lib/utils";

const VoiceOrb = dynamic(() => import("@/components/ui/VoiceOrb").then((m) => m.VoiceOrb), {
  ssr: false,
  loading: () => null,
});

type Who = "idle" | "maoshi" | "you";

const mmss = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

/**
 * The call "stage": the orb, rings that swell with whoever is talking, a live
 * speaking/listening label, a call timer and a large waveform.
 */
export function CallStage() {
  const { status, error, toggle, levels } = useVoiceCall();
  const reduceMotion = usePrefersReducedMotion();
  const rings = useRef<(HTMLSpanElement | null)[]>([]);
  const [who, setWho] = useState<Who>("idle");
  const [secs, setSecs] = useState(0);
  const live = status === "live";

  // Rings + speaker label follow the audio levels at frame rate; state only
  // updates when the speaker actually changes, so React barely re-renders.
  useEffect(() => {
    if (!live || reduceMotion) {
      setWho("idle");
      rings.current.forEach((r) => r && (r.style.opacity = "0"));
      return;
    }
    let raf = 0;
    let current: Who = "idle";
    let quietSince = performance.now();
    const tick = (now: number) => {
      const { agent, mic } = levels.current;
      const level = Math.max(agent, mic * 0.7);
      const next: Who = agent > 0.06 && agent >= mic ? "maoshi" : mic > 0.08 ? "you" : "idle";
      if (next !== "idle") quietSince = now;
      // hold the last speaker for a moment so the label doesn't flicker between words
      const shown = next === "idle" && now - quietSince < 500 ? current : next;
      if (shown !== current) {
        current = shown;
        setWho(shown);
      }
      rings.current.forEach((r, i) => {
        if (!r) return;
        r.style.transform = `scale(${1 + level * (0.22 + i * 0.2)})`;
        r.style.opacity = String(Math.min(0.75, level * (1.4 - i * 0.35)));
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [live, levels, reduceMotion]);

  useEffect(() => {
    if (!live) return setSecs(0);
    const t = setInterval(() => setSecs((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [live]);

  const label =
    status === "connecting"
      ? "Connecting…"
      : live
        ? who === "maoshi"
          ? "Maoshi is speaking"
          : who === "you"
            ? "Listening to you"
            : "Say hello"
        : "Ready when you are";

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-3xl border bg-surface-elevated p-6 transition-colors duration-500 sm:p-10",
        live ? "border-accent/50 shadow-accent-glow" : "border-border-active",
      )}
    >
      {/* slow ambient glow behind the orb, brighter while live */}
      <span
        aria-hidden
        className={cn(
          "pointer-events-none absolute left-1/2 top-1/2 h-[70%] w-[70%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent blur-[110px] transition-opacity duration-700",
          live ? "opacity-20" : "opacity-[0.07]",
          !reduceMotion && "animate-radial-pulse",
        )}
      />

      <div className="relative grid items-center gap-8 md:grid-cols-[1fr_1fr]">
        <div className="relative mx-auto aspect-square w-full max-w-[300px] sm:max-w-[400px]">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              ref={(el) => {
                rings.current[i] = el;
              }}
              aria-hidden
              className="pointer-events-none absolute inset-[10%] rounded-full border border-accent/60 opacity-0 will-change-transform"
            />
          ))}
          <VoiceOrb className="absolute inset-0" />
        </div>

        <div className="text-center md:text-left">
          <div className="inline-flex items-center gap-2 rounded-full border border-border-active bg-bg/60 px-3 py-1.5">
            <span
              className={cn(
                "h-2 w-2 rounded-full",
                live ? "bg-accent" : status === "connecting" ? "bg-yellow-400" : "bg-text-muted",
                (live || status === "connecting") && !reduceMotion && "animate-pulse",
              )}
            />
            <span role="status" aria-live="polite" className="font-mono text-xs uppercase tracking-[0.16em] text-text-primary">
              {label}
            </span>
            {live && <span className="font-mono text-xs tabular-nums text-text-secondary">{mmss(secs)}</span>}
          </div>

          <h3 className="mt-5 font-display text-2xl font-bold tracking-display sm:text-3xl">
            {live ? "You're talking to Maoshi." : "Talk to Maoshi, live."}
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-text-secondary">
            {live
              ? "Ask about Flow State, or say you'd like to book a strategy call. Calls end automatically after 5 minutes."
              : "Allow your microphone and say hello. Drag or click the orb, or use the button."}
          </p>

          <VoiceWaveform className="mx-auto mt-6 h-14 w-[220px] md:mx-0" />

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3 md:justify-start">
            {live || status === "connecting" ? (
              <EndCallButton />
            ) : (
              <Button variant="filled" size="lg" onClick={toggle}>
                Talk to Maoshi
              </Button>
            )}
          </div>
          {status === "error" && <p className="mt-4 font-mono text-xs text-red-400">{error}</p>}
        </div>
      </div>
    </div>
  );
}
