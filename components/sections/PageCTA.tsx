import { Button } from "@/components/ui/Button";

/** Closing band on every page except /contact: one clear next step. */
export function PageCTA({ heading = "Ready to stop missing calls?" }: { heading?: string }) {
  return (
    <section className="px-5 pb-24 sm:px-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-start justify-between gap-6 rounded-2xl border border-border-active bg-surface-elevated p-8 sm:flex-row sm:items-center sm:p-10">
        <div>
          <h2 className="font-display text-2xl font-bold tracking-display sm:text-3xl">{heading}</h2>
          <p className="mt-2 text-sm text-text-secondary sm:text-base">
            Book a free 30-minute strategy call with the founder.
          </p>
        </div>
        <Button href="/contact" variant="filled" size="lg">
          Book a strategy call
        </Button>
      </div>
    </section>
  );
}
