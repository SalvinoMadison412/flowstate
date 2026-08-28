"use client";

import { useEffect, useState } from "react";
import { useReveal, usePrefersReducedMotion } from "@/lib/useReveal";

type CountUpProps = {
  to: number;
  from?: number;
  decimals?: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
};

function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
}

/** Scroll-triggered count-up. Snaps to `to` for reduced-motion. */
export function CountUp({
  to,
  from = 0,
  decimals = 0,
  duration = 1.6,
  prefix = "",
  suffix = "",
  className,
}: CountUpProps) {
  const { ref, shown } = useReveal<HTMLSpanElement>();
  const reduceMotion = usePrefersReducedMotion();
  const [value, setValue] = useState(from);

  useEffect(() => {
    if (!shown) return;
    if (reduceMotion) {
      setValue(to);
      return;
    }

    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min((now - start) / (duration * 1000), 1);
      setValue(from + (to - from) * easeOutExpo(progress));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    // If rAF is throttled (backgrounded tab) and never completes, don't leave
    // the number stuck at its start value.
    const safety = window.setTimeout(() => setValue(to), duration * 1000 + 1500);
    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(safety);
    };
  }, [shown, reduceMotion, from, to, duration]);

  return (
    <span ref={ref} className={className}>
      {prefix}
      {value.toLocaleString("en-US", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })}
      {suffix}
    </span>
  );
}
