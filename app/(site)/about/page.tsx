import type { Metadata } from "next";
import { About } from "@/components/sections/About";
import { WhyAI } from "@/components/sections/WhyAI";
import { PageCTA } from "@/components/sections/PageCTA";

export const metadata: Metadata = {
  title: "About",
  description:
    "Flow State is founded and run by Salvino Madison, with Sherwin Madison on compliance and finance. No account managers, no hand-offs.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <div>
      <About />
      <WhyAI />
      <PageCTA heading="Talk to the founder directly." />
    </div>
  );
}
