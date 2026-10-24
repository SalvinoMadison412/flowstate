import { Button } from "@/components/ui/Button";

/** Closing band on every page except /contact: one clear next step. */
export function PageCTA({ heading = "Ready to stop missing calls?" }: { heading?: string }) {
  return (
    <section className="px-4 pb-16 pt-8 sm:px-6">
      <div className="mx-auto max-w-site rounded-panel bg-tile-sky px-6 py-14 text-center text-tile-skyInk sm:py-20">
        <h2 className="font-display text-3xl font-medium leading-tight tracking-tight2 sm:text-[44px]">{heading}</h2>
        <p className="mt-3 text-base sm:text-lg">Book a free 30-minute strategy call with the founder.</p>
        <Button href="/contact" variant="filled" size="lg" className="mt-8" data-track="closing">
          Book a strategy call →
        </Button>
      </div>
    </section>
  );
}
