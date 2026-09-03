"use client";

import { Section, SectionHeading, SectionLabel } from "@/components/ui/Section";
import { cn } from "@/lib/utils";
import { useReveal } from "@/lib/useReveal";

const ANNOTATIONS = [
  "FAQ Schema",
  "Entity Markup",
  "Citation Anchor",
  "Author Authority Signal",
];

function WireframeBlob() {
  return (
    <div className="space-y-3">
      <div className="h-6 w-2/3 rounded bg-white/10" />
      <div className="h-3 w-full rounded bg-white/5" />
      <div className="h-3 w-full rounded bg-white/5" />
      <div className="h-3 w-11/12 rounded bg-white/5" />
      <div className="h-3 w-full rounded bg-white/5" />
      <div className="h-3 w-4/5 rounded bg-white/5" />
      <div className="h-24 w-full rounded bg-white/5" />
      <div className="h-3 w-full rounded bg-white/5" />
      <div className="h-3 w-3/4 rounded bg-white/5" />
    </div>
  );
}

function StructuredSite() {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="h-2 w-2 rounded-full bg-white" />
        <div className="h-5 w-1/2 rounded bg-white/80" />
      </div>
      <div className="rounded-lg border border-border-active p-3">
        <div className="mb-2 h-2 w-20 rounded bg-white/40" />
        <div className="h-2.5 w-full rounded bg-white/15" />
        <div className="mt-1.5 h-2.5 w-5/6 rounded bg-white/15" />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-lg border border-border-active p-3">
          <div className="h-2 w-12 rounded bg-white/40" />
          <div className="mt-2 h-2 w-full rounded bg-white/15" />
        </div>
        <div className="rounded-lg border border-border-active p-3">
          <div className="h-2 w-12 rounded bg-white/40" />
          <div className="mt-2 h-2 w-full rounded bg-white/15" />
        </div>
      </div>
      <div className="rounded-lg border border-border-active p-3">
        <div className="h-2 w-24 rounded bg-white/40" />
        <div className="mt-2 h-2 w-full rounded bg-white/15" />
        <div className="mt-1.5 h-2 w-2/3 rounded bg-white/15" />
      </div>
    </div>
  );
}

export function GEOMockup() {
  const { ref, shown } = useReveal<HTMLDivElement>();

  return (
    <Section id="geo-example">
      <SectionLabel>GEO in practice</SectionLabel>
      <SectionHeading className="mt-4 max-w-2xl">
        Same content. Restructured so AI can read it.
      </SectionHeading>

      <div ref={ref} className="relative mt-14 grid gap-4 md:grid-cols-2">
        {/* Before */}
        <div
          className={cn(
            "rounded-2xl border border-border-subtle bg-surface p-6 opacity-[0.55] grayscale",
            shown && "anim-fade",
          )}
        >
          <span className="font-mono text-xs uppercase tracking-[0.18em] text-text-muted">
            Before
          </span>
          <div className="mt-5">
            <WireframeBlob />
          </div>
        </div>

        {/* After */}
        <div
          className={cn(
            "relative rounded-2xl border border-border-active bg-surface-elevated p-6",
            shown && "anim-fade",
          )}
          style={{ animationDelay: "0.1s" }}
        >
          <span className="font-mono text-xs uppercase tracking-[0.18em] text-text-primary">
            After
          </span>
          <div className="mt-5">
            <StructuredSite />
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {ANNOTATIONS.map((label, i) => (
              <span
                key={label}
                className={cn(
                  "rounded-md border border-border-active bg-black/40 px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-text-secondary",
                  shown && "anim-fade",
                )}
                style={{ animationDelay: `${0.3 + i * 0.1}s` }}
              >
                {label}
              </span>
            ))}
          </div>
        </div>

        {/* Center divider label */}
        <div className="pointer-events-none absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 md:block">
          <span className="rounded-full border border-border-active bg-bg px-3 py-1 font-mono text-[10px] uppercase tracking-[0.2em] text-text-secondary">
            Flow State GEO
          </span>
        </div>
      </div>
    </Section>
  );
}
