"use client";

import { cn } from "@/lib/utils";
import { useReveal } from "@/lib/useReveal";

type SectionProps = {
  id?: string;
  className?: string;
  /** Inner container className (max-width, padding). */
  innerClassName?: string;
  children: React.ReactNode;
  /** Skip the max-width container (full-bleed sections). */
  bleed?: boolean;
};

/** Standard section wrapper: consistent vertical rhythm + scroll reveal. */
export function Section({
  id,
  className,
  innerClassName,
  children,
  bleed = false,
}: SectionProps) {
  const { ref, shown } = useReveal<HTMLElement>();

  return (
    <section
      ref={ref}
      id={id}
      className={cn(
        "reveal relative px-5 py-20 sm:px-8 sm:py-28",
        shown && "is-visible",
        className,
      )}
    >
      {bleed ? (
        children
      ) : (
        <div className={cn("mx-auto w-full max-w-6xl", innerClassName)}>
          {children}
        </div>
      )}
    </section>
  );
}

export function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="font-mono text-xs uppercase tracking-[0.2em] text-text-secondary">
      {children}
    </span>
  );
}

export function SectionHeading({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <h2
      className={cn(
        "font-display text-3xl font-bold leading-[1.1] tracking-display sm:text-4xl md:text-5xl",
        className,
      )}
    >
      {children}
    </h2>
  );
}
