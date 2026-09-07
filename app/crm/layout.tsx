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
    <main className="min-h-[100dvh]">
      <CrmShell>{children}</CrmShell>
    </main>
  );
}
