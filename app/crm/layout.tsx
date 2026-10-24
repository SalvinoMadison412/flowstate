import type { Metadata } from "next";
import { CrmShell } from "./CrmShell";

export const metadata: Metadata = {
  title: "CRM",
  robots: { index: false, follow: false },
};

export default function CrmLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="theme-dark min-h-[100dvh] bg-bg text-text-primary">
      <CrmShell>{children}</CrmShell>
    </main>
  );
}
