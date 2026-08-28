"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Scroll-reveal trigger. Adds one boolean that flips to `true` once the element
 * has entered the viewport, then never flips back.
 *
 * Robust by design for a production page:
 *  - reveals immediately if IntersectionObserver is unavailable
 *  - a timeout fallback reveals anyway if the observer never fires (e.g. the
 *    tab was backgrounded at mount, pausing IO callbacks) — a stuck-invisible
 *    section is never acceptable.
 */
export function useReveal<T extends Element = HTMLElement>() {
  const ref = useRef<T>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || shown) return;

    if (typeof IntersectionObserver === "undefined") {
      setShown(true);
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setShown(true);
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -12% 0px" },
    );
    io.observe(el);

    const fallback = window.setTimeout(() => setShown(true), 2500);

    return () => {
      io.disconnect();
      window.clearTimeout(fallback);
    };
  }, [shown]);

  return { ref, shown };
}

/** `prefers-reduced-motion: reduce` — SSR-safe, updates on change. */
export function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  return reduced;
}
