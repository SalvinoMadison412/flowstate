"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Session } from "@supabase/supabase-js";
import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/ui/Logo";
import { cn } from "@/lib/utils";
import { supabase, isSupabaseConfigured, CHANNELS } from "@/lib/supabase";
import { input } from "./ui";

const TABS = [
  { label: "Dashboard", href: "/crm" },
  { label: "Cold calls", href: CHANNELS.cold_call.href },
  { label: "Instagram & email", href: CHANNELS.outreach.href },
];

/**
 * Wraps every CRM page: session gate, then the header and tab bar. Signed out,
 * nothing below it renders at all.
 */
export function CrmShell({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setReady(true);
      return;
    }
    void supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setReady(true);
    });
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);

  if (!ready) return null;
  if (!isSupabaseConfigured)
    return (
      <div className="mx-auto flex min-h-[100dvh] max-w-md flex-col justify-center px-5 text-center">
        <h1 className="font-display text-xl tracking-display">
          CRM not configured
        </h1>
        <p className="mt-3 text-sm text-text-secondary">
          Set <code className="text-text-primary">NEXT_PUBLIC_SUPABASE_URL</code>{" "}
          and{" "}
          <code className="text-text-primary">
            NEXT_PUBLIC_SUPABASE_ANON_KEY
          </code>{" "}
          on this deployment, then redeploy.
        </p>
      </div>
    );
  if (!session) return <AuthForm />;

  return (
    <div className="mx-auto w-full max-w-[1600px] px-4 pb-24 pt-6 sm:px-6 lg:px-10">
      <header className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <Link
            href="/"
            aria-label="Back to the Flow State site"
            title="Back to flowstate.agency"
            className="text-text-muted transition-colors hover:text-text-primary"
          >
            <Logo variant="icon" className="h-6 w-6" />
          </Link>
          <span aria-hidden className="text-border-active">
            /
          </span>
          <h1 className="font-display text-xl tracking-display">CRM</h1>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden text-xs text-text-muted sm:inline">
            {session.user.email}
          </span>
          <button
            onClick={() => supabase.auth.signOut()}
            className="text-sm text-text-secondary hover:text-text-primary"
          >
            Sign out
          </button>
        </div>
      </header>

      <nav className="-mx-4 mt-4 flex gap-2 overflow-x-auto px-4 sm:-mx-6 sm:px-6 lg:-mx-10 lg:px-10">
        {TABS.map((t) => (
          <Link
            key={t.href}
            href={t.href}
            className={cn(
              "flex h-10 shrink-0 items-center rounded-full border px-4 text-sm transition-colors",
              pathname === t.href
                ? "border-white bg-white text-bg"
                : "border-border-subtle text-text-secondary hover:border-border-active",
            )}
          >
            {t.label}
          </Link>
        ))}
      </nav>

      {children}
    </div>
  );
}

/**
 * Sign in / sign up for the single CRM owner. Signing up is left open because
 * the lock is RLS (policies check the owner's email) — a stranger who signs up
 * gets an empty CRM, not access.
 */
function AuthForm() {
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setNotice(null);

    const { data, error } =
      mode === "in"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password });

    if (error) setError(error.message);
    else if (mode === "up" && !data.session)
      setNotice("Account created — check your email for the confirmation link.");
    // On success the shell's onAuthStateChange listener swaps in the CRM.
    setBusy(false);
  }

  return (
    <div className="mx-auto flex min-h-[100dvh] w-full max-w-sm flex-col justify-center px-5 py-16">
      <h1 className="font-display text-2xl tracking-display">
        {mode === "in" ? "Sign in" : "Create your account"}
      </h1>
      <p className="mt-2 text-sm text-text-secondary">Flow State CRM</p>

      <form onSubmit={onSubmit} className="mt-8 flex flex-col gap-3">
        <input
          type="email"
          required
          autoComplete="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={input}
        />
        <input
          type="password"
          required
          minLength={6}
          autoComplete={mode === "in" ? "current-password" : "new-password"}
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={input}
        />

        {error && <p className="text-sm text-red-400">{error}</p>}
        {notice && <p className="text-sm text-accent">{notice}</p>}

        <Button type="submit" size="lg" disabled={busy} className="mt-2 w-full">
          {busy ? "…" : mode === "in" ? "Sign in" : "Sign up"}
        </Button>
      </form>

      <button
        type="button"
        onClick={() => {
          setMode(mode === "in" ? "up" : "in");
          setError(null);
          setNotice(null);
        }}
        className="mt-6 text-sm text-text-secondary underline underline-offset-4 hover:text-text-primary"
      >
        {mode === "in" ? "Create an account" : "I already have an account"}
      </button>
    </div>
  );
}
