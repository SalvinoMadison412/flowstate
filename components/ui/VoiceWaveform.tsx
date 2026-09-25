"use client";

import { useEffect, useRef } from "react";
import { useVoiceCall } from "@/lib/useVoiceCall";
import { usePrefersReducedMotion } from "@/lib/useReveal";
import { cn } from "@/lib/utils";

const BARS = 28;

/** Bars that idle with a slow ripple and jump with the agent's / caller's voice. */
export function VoiceWaveform({ className }: { className?: string }) {
  const bars = useRef<(HTMLSpanElement | null)[]>([]);
  const { status, levels } = useVoiceCall();
  const reduceMotion = usePrefersReducedMotion();
  const st = useRef(status);
  st.current = status;

  useEffect(() => {
    if (reduceMotion) return;
    let raf = 0;
    const tick = (now: number) => {
      const level = Math.max(levels.current.agent, levels.current.mic * 0.6);
      bars.current.forEach((b, i) => {
        if (!b) return;
        const wave = 0.5 + 0.5 * Math.sin(now / 420 + i * 0.55);
        const idle = 0.12 + wave * 0.14;
        const live = 0.1 + level * (0.5 + wave * 0.9);
        b.style.transform = `scaleY(${Math.min(1, st.current === "live" ? live : idle)})`;
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [levels, reduceMotion]);

  return (
    <div aria-hidden className={cn("flex h-10 items-center gap-[3px]", className)}>
      {Array.from({ length: BARS }, (_, i) => (
        <span
          key={i}
          ref={(el) => {
            bars.current[i] = el;
          }}
          className={cn(
            "h-full w-[3px] origin-center rounded-full transition-colors",
            status === "live" ? "bg-accent" : "bg-white/35",
          )}
          style={{ transform: "scaleY(0.2)" }}
        />
      ))}
    </div>
  );
}
