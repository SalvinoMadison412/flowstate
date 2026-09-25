import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { IconInstagram, IconLinkedIn, IconX } from "@/components/ui/icons";

const CONTACT_EMAIL = "flowstate.agents@gmail.com";

const COLUMNS = [
  {
    heading: "Services",
    links: [
      { label: "AI Voice Agents", href: "/voice-agent" },
      { label: "AI Automations", href: "/services#ai-automation" },
      { label: "Meta Ads", href: "/services#meta-ads" },
      { label: "Google Ads", href: "/services#google-ads" },
      { label: "GEO — Generative Engine Optimization", href: "/services#geo" },
    ],
  },
  {
    heading: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "How it works", href: "/services#how-it-works" },
      { label: "Contact", href: "/contact" },
    ],
  },
  {
    heading: "Apps",
    links: [
      { label: "WealthFlow", href: "/apps/wealthflow" },
      { label: "WealthFlow privacy policy", href: "/apps/wealthflow/privacy" },
      { label: "Delete your account", href: "/apps/wealthflow/delete-account" },
    ],
  },
];

// Add { label, href, Icon } entries only for profiles that exist.
const SOCIALS: { label: string; href: string; Icon: typeof IconLinkedIn }[] = [
  { label: "Flow State on Instagram", href: "https://www.instagram.com/flowstate.agents", Icon: IconInstagram },
  // { label: "Flow State on LinkedIn", href: "LINKEDIN_URL", Icon: IconLinkedIn },
  // { label: "Flow State on X", href: "X_URL", Icon: IconX },
];

export function Footer() {
  return (
    <footer className="border-t border-[#1E1E1E] px-5 py-16 sm:px-8">
      <div className="mx-auto w-full max-w-6xl">
        <div className="grid gap-10 md:grid-cols-[1.3fr_repeat(3,1fr)]">
          <div>
            <Logo />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-text-secondary">
              Get found by AI. Get clicked on Google. Get discovered on Meta.
            </p>
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="mt-4 inline-block text-sm text-text-primary underline-offset-4 hover:underline"
            >
              {CONTACT_EMAIL}
            </a>
          </div>

          {COLUMNS.map((col) => (
            <div key={col.heading}>
              <h3 className="font-mono text-xs uppercase tracking-[0.16em] text-text-primary">
                {col.heading}
              </h3>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-text-secondary transition-colors hover:text-text-primary"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 flex flex-col items-start justify-between gap-4 border-t border-[#1E1E1E] pt-6 sm:flex-row sm:items-center">
          <p className="font-mono text-xs text-text-muted">
            © {new Date().getFullYear()} Flow State. All rights reserved.
            <span aria-hidden className="mx-2 text-border-active">&middot;</span>
            <Link href="/crm" className="transition-colors hover:text-text-primary">
              Admin login
            </Link>
          </p>
          <div className="flex gap-3">
            {SOCIALS.map(({ label, href, Icon }) => (
              <a
                key={href}
                href={href}
                aria-label={label}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-border-subtle text-text-secondary transition-all hover:-translate-y-0.5 hover:border-border-active hover:text-text-primary"
              >
                <Icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
