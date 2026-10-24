"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/ui/Logo";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

const LINKS = [
  { label: "Voice Agent", href: "/voice-agent" },
  { label: "Services", href: "/services" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
];

export function Nav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  // The CRM link is private: it only appears once signed in, so visitors
  // browsing the marketing site never see it.
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    // Without config there is no CRM to link to, and touching the client
    // would throw — the marketing site must not depend on Supabase.
    if (!isSupabaseConfigured) return;
    void supabase.auth
      .getSession()
      .then(({ data }) => setSignedIn(!!data.session));
    const { data } = supabase.auth.onAuthStateChange((_e, s) =>
      setSignedIn(!!s),
    );
    return () => data.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const links = signedIn ? [...LINKS, { label: "CRM", href: "/crm" }] : LINKS;

  return (
    <header className="sticky top-0 z-50 px-4 pt-3 sm:px-6">
      <nav className="mx-auto flex max-w-site items-center justify-between rounded-card bg-bg/90 px-3 py-2 shadow-ring backdrop-blur sm:px-4">
        <Link href="/" aria-label="Flow State home" className="shrink-0">
          <Logo />
        </Link>

        <ul className="hidden items-center gap-7 text-sm font-medium lg:flex">
          {links.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                aria-current={pathname === link.href ? "page" : undefined}
                className={cn(
                  "transition-colors duration-300 ease-[cubic-bezier(0.075,0.82,0.165,1)] hover:text-text-primary/65",
                  pathname === link.href && "text-accent-ink",
                )}
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-2">
          <Button href="/contact" variant="outline" size="md" className="hidden sm:inline-flex">
            Book a call
          </Button>
          <Button href="/voice-agent#demo" variant="filled" size="md">
            Talk to Maoshi
          </Button>
          <button
            type="button"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="flex h-10 w-10 items-center justify-center rounded-btn bg-surface text-text-primary lg:hidden"
          >
            <span className="relative block h-4 w-5">
              <span
                className={cn(
                  "absolute left-0 top-0 h-0.5 w-full bg-current transition-transform duration-200",
                  open && "translate-y-[7px] rotate-45",
                )}
              />
              <span
                className={cn(
                  "absolute left-0 top-1/2 h-0.5 w-full -translate-y-1/2 bg-current transition-opacity duration-200",
                  open && "opacity-0",
                )}
              />
              <span
                className={cn(
                  "absolute bottom-0 left-0 h-0.5 w-full bg-current transition-transform duration-200",
                  open && "-translate-y-[7px] -rotate-45",
                )}
              />
            </span>
          </button>
        </div>
      </nav>

      <div
        className={cn(
          "mx-auto mt-2 grid max-w-site overflow-hidden rounded-card bg-bg shadow-ring transition-all duration-300 lg:hidden",
          open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
        )}
      >
        <div className="min-h-0 overflow-hidden">
          <ul className="flex flex-col gap-1 p-3">
            {links.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={() => setOpen(false)}
                  aria-current={pathname === link.href ? "page" : undefined}
                  className={cn(
                    "block rounded-btn px-3 py-3 text-base font-medium transition-colors hover:bg-surface hover:text-text-primary/70",
                    pathname === link.href && "text-accent-ink",
                  )}
                >
                  {link.label}
                </Link>
              </li>
            ))}
            <li className="mt-2">
              <Button
                href="/contact"
                variant="outline"
                size="lg"
                className="w-full"
                onClick={() => setOpen(false)}
              >
                Book a call
              </Button>
            </li>
          </ul>
        </div>
      </div>
    </header>
  );
}
