import type { Metadata } from "next";
import { About } from "@/components/sections/About";
import { Industries } from "@/components/sections/Industries";
import { PageCTA } from "@/components/sections/PageCTA";

export const metadata: Metadata = {
  title: "About",
  description:
    "Flow State is founded and run by Salvino Madison, with Sherwin Madison on compliance and finance. No account managers, no hand-offs.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <div className="pt-16">
      <About />
      <Industries />
      <PageCTA heading="Talk to the founder directly." />
    </div>
  );
}
