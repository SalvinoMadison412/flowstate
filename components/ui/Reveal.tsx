"use client";

import { cn } from "@/lib/utils";
import { useReveal } from "@/lib/useReveal";

type RevealProps = {
  children: React.ReactNode;
  className?: string;
  /** Stagger direct children in on scroll (default). Otherwise reveal as one. */
  stagger?: boolean;
};

/**
 * Scroll-reveal container. CSS-transition based (see globals.css) so children
 * are never left stuck hidden. Direct children stagger automatically.
 */
export function Reveal({ children, className, stagger = true }: RevealProps) {
  const { ref, shown } = useReveal<HTMLDivElement>();

  return (
    <div
      ref={ref}
      className={cn(
        stagger ? "reveal-stagger" : "reveal",
        shown && "is-visible",
        className,
      )}
    >
      {children}
    </div>
  );
}
