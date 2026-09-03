import { Logo } from "@/components/ui/Logo";
import { IconLinkedIn, IconX } from "@/components/ui/icons";

const COLUMNS = [
  {
    heading: "Services",
    links: [
      "Meta Ads",
      "Google Ads",
      "GEO — Generative Engine Optimization",
    ],
  },
  {
    heading: "Company",
    links: ["About", "Careers", "Approach", "Contact"],
  },
  {
    heading: "Resources",
    links: ["Meta Ads Playbook", "Google Ads Guide", "GEO Playbook", "Case Studies"],
  },
  {
    heading: "Legal",
    links: ["Privacy Policy", "Terms of Service", "Data Processing", "Cookies"],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-[#1E1E1E] px-5 py-16 sm:px-8">
      <div className="mx-auto w-full max-w-6xl">
        <div className="grid gap-10 md:grid-cols-[1.3fr_repeat(4,1fr)]">
          <div>
            <Logo />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-text-secondary">
              Get found by AI. Get clicked on Google. Get discovered on Meta.
            </p>
          </div>

          {COLUMNS.map((col) => (
            <div key={col.heading}>
              <h3 className="font-mono text-xs uppercase tracking-[0.16em] text-text-primary">
                {col.heading}
              </h3>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      className="text-sm text-text-secondary transition-colors hover:text-text-primary"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 flex flex-col items-start justify-between gap-4 border-t border-[#1E1E1E] pt-6 sm:flex-row sm:items-center">
          <p className="font-mono text-xs text-text-muted">
            © 2025 Flow State. All rights reserved.
          </p>
          <div className="flex gap-3">
            <a
              href="#"
              aria-label="Flow State on LinkedIn"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-border-subtle text-text-secondary transition-all hover:-translate-y-0.5 hover:border-border-active hover:text-text-primary"
            >
              <IconLinkedIn className="h-4 w-4" />
            </a>
            <a
              href="#"
              aria-label="Flow State on X"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-border-subtle text-text-secondary transition-all hover:-translate-y-0.5 hover:border-border-active hover:text-text-primary"
            >
              <IconX className="h-4 w-4" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
