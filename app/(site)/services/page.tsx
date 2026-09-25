import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { Services } from "@/components/sections/Services";
import { CaseStudy } from "@/components/sections/CaseStudy";
import { PageCTA } from "@/components/sections/PageCTA";

// Heavier SVG / canvas sections get their own chunks; SSR stays on so the copy is crawlable.
const GEOMockup = dynamic(() => import("@/components/sections/GEOMockup").then((m) => m.GEOMockup));
const AgenticWorkflow = dynamic(() =>
  import("@/components/sections/AgenticWorkflow").then((m) => m.AgenticWorkflow),
);

export const metadata: Metadata = {
  title: "Services: Meta Ads, Google Ads, GEO",
  description:
    "Meta Ads, Google Ads, and GEO (Generative Engine Optimization) for local businesses. Each service stands on its own; hire us for one or all three.",
  alternates: { canonical: "/services" },
};

export default function ServicesPage() {
  return (
    <div className="pt-16">
      <Services />
      <GEOMockup />
      <AgenticWorkflow />
      <CaseStudy />
      <PageCTA heading="Want more bookings from ads and AI search?" />
    </div>
  );
}
