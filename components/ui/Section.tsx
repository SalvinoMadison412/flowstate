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
        "reveal relative px-4 py-12 sm:px-6 sm:py-16",
        shown && "is-visible",
        className,
      )}
    >
      {bleed ? (
        children
      ) : (
        <div className={cn("mx-auto w-full max-w-site", innerClassName)}>
          {children}
        </div>
      )}
    </section>
  );
}

export function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-xs font-medium uppercase tracking-[0.18em] text-text-muted">
      {children}
    </span>
  );
}

export function SectionHeading({
  children,
  className,
  as: Tag = "h2",
}: {
  children: React.ReactNode;
  className?: string;
  /** "h1" for the first heading on a page that has no hero. */
  as?: "h1" | "h2";
}) {
  return (
    <Tag
      className={cn(
        "font-display text-4xl font-medium leading-none tracking-tight2 sm:text-[56px]",
        className,
      )}
    >
      {children}
    </Tag>
  );
}
