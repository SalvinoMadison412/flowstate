import { Section, SectionHeading, SectionLabel } from "@/components/ui/Section";
import { Reveal } from "@/components/ui/Reveal";

// Owner: these are public commitments. Edit the wording here and nowhere else.
const TERMS = [
  { big: "14 days", title: "Full refund, no questions asked", body: "Try it for 14 days. If you're not impressed for any reason, tell us and the money goes back to you. No paperwork." },
  { big: "30 days", title: "Book more, or don't pay", body: "If the appointments booked from your existing call and lead flow don't go up in your first 30 days live, you don't pay. We measure it against your prior month, from the call logs." },
  { big: "0 contracts", title: "Cancel anytime", body: "Month to month, no lock-in, no cancellation fee. Cancel with one email." },
];

export function Guarantee() {
  return (
    <Section id="guarantee">
      <div className="text-center">
        <SectionLabel>Zero-risk guarantee</SectionLabel>
        <SectionHeading className="mx-auto mt-4 max-w-2xl">14 days to try it. 30 days to prove it.</SectionHeading>
      </div>
      <Reveal className="mt-10 grid gap-4 md:grid-cols-3">
        {TERMS.map((t) => (
          <div key={t.big} className="card-hover rounded-card bg-surface-elevated p-6 shadow-ring">
            <p className="font-display text-3xl font-medium tracking-tight2 text-accent-ink">{t.big}</p>
            <h3 className="mt-3 font-display text-lg font-medium tracking-tight2">{t.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-text-secondary">{t.body}</p>
          </div>
        ))}
      </Reveal>
    </Section>
  );
}
