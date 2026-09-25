import Link from "next/link";

/** Plain long-form page (privacy policy, deletion instructions). Styles h2/p/ul so pages stay markup-only. */
export function DocPage({
  label,
  title,
  updated,
  children,
}: {
  label: string;
  title: string;
  updated?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="px-5 pb-24 pt-32 sm:px-8">
      <article className="mx-auto max-w-3xl">
        <Link href="/apps/wealthflow" className="font-mono text-xs uppercase tracking-[0.2em] text-text-secondary hover:text-text-primary">
          &larr; {label}
        </Link>
        <h1 className="mt-4 font-display text-4xl font-bold tracking-display sm:text-5xl">{title}</h1>
        {updated && <p className="mt-3 font-mono text-xs text-text-muted">Last updated: {updated}</p>}
        <div
          className={
            "mt-10 space-y-4 text-sm leading-relaxed text-text-secondary sm:text-base " +
            "[&_h2]:mt-10 [&_h2]:font-display [&_h2]:text-xl [&_h2]:font-bold [&_h2]:tracking-display [&_h2]:text-text-primary " +
            "[&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:space-y-2 [&_ol]:pl-5 " +
            "[&_strong]:text-text-primary [&_a]:text-accent [&_a]:underline-offset-4 hover:[&_a]:underline"
          }
        >
          {children}
        </div>
      </article>
    </div>
  );
}
