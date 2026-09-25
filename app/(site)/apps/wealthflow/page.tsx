import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Section, SectionHeading, SectionLabel } from "@/components/ui/Section";
import { Reveal } from "@/components/ui/Reveal";

export const metadata: Metadata = {
  title: "WealthFlow",
  description:
    "WealthFlow is a privacy-first personal finance app. Import a bank statement PDF and see your spending, income and budgets. Everything happens on your phone.",
  alternates: { canonical: "/apps/wealthflow" },
};

const PROMISES = [
  { title: "Your statements never leave the phone", body: "PDFs are read on your device and transactions live only in a local database. There is no upload path." },
  { title: "No AI reads your data", body: "Extraction is text positions plus pattern matching. Categories come from rules you write, first match wins." },
  { title: "The account keeps almost nothing", body: "We store only your sign-in details, your profile, and your categories and rules." },
  { title: "Re-importing restores everything", body: "New phone, same PDFs, same insights. Import is safe to repeat." },
];

const FEATURES = [
  "Sign in with Google, then a short onboarding profile",
  "Import one or several PDFs at once (password-protected ones too) with a reconciliation check",
  "Browse transactions by month, category and account; categorise one or create a rule from it",
  "Manage priority-ordered rules that sync to your account",
  "Budget donut and per-category monthly budgets, plus a Home dashboard with six-month trends",
  "Light, dark or system theme",
  "Delete your account and all your data from Profile",
];

export default function WealthFlowPage() {
  return (
    <div className="pt-16">
      <Section>
        <SectionLabel>Apps</SectionLabel>
        <div className="mt-6 flex items-center gap-5">
          <Image
            src="/apps/wealthflow.png"
            alt="WealthFlow logo"
            width={96}
            height={96}
            priority
            className="h-20 w-20 rounded-2xl border border-border-active sm:h-24 sm:w-24"
          />
          <SectionHeading>WealthFlow</SectionHeading>
        </div>
        <p className="mt-6 max-w-2xl text-base leading-relaxed text-text-secondary">
          A privacy-first personal finance app. Import a bank statement PDF and WealthFlow reads
          every transaction off the page, sorts it into categories using rules you write, and shows
          your spending, income, budgets and trends.{" "}
          <strong className="text-text-primary">All of it happens on your phone.</strong>
        </p>
        <p className="mt-3 text-sm text-text-muted">Android for now, iOS planned.</p>
        <div className="mt-8 flex flex-wrap gap-4 text-sm">
          <Link href="/apps/wealthflow/privacy" className="rounded-full border border-accent px-5 py-3 font-bold text-accent transition-colors hover:bg-accent hover:text-bg">
            Privacy policy
          </Link>
          <Link href="/apps/wealthflow/delete-account" className="rounded-full border border-border-active px-5 py-3 text-text-primary transition-colors hover:border-text-secondary">
            Delete your account
          </Link>
        </div>
      </Section>

      <Section>
        <SectionLabel>Why it is different</SectionLabel>
        <Reveal className="mt-10 grid gap-4 sm:grid-cols-2">
          {PROMISES.map((p) => (
            <div key={p.title} className="rounded-2xl border border-border-subtle bg-surface p-6 sm:p-8">
              <h3 className="font-display text-lg font-bold tracking-display">{p.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-text-secondary">{p.body}</p>
            </div>
          ))}
        </Reveal>
      </Section>

      <Section>
        <SectionLabel>What you can do</SectionLabel>
        <ul className="mt-8 max-w-3xl list-disc space-y-3 pl-5 text-sm leading-relaxed text-text-secondary sm:text-base">
          {FEATURES.map((f) => (
            <li key={f}>{f}</li>
          ))}
        </ul>
        <p className="mt-10 max-w-3xl text-sm leading-relaxed text-text-secondary">
          <strong className="text-text-primary">Status:</strong> under active development. Only
          Kotak Mahindra has a bank-specific reader so far; other banks use a generic reader and are
          verified by a reconciliation check (opening + credits − debits = closing).
        </p>
      </Section>
    </div>
  );
}
