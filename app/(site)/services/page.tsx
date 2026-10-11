import type { Metadata } from "next";
import { Services } from "@/components/sections/Services";
import { CaseStudy } from "@/components/sections/CaseStudy";
import { PageCTA } from "@/components/sections/PageCTA";

export const metadata: Metadata = {
  title: "Services: AI automations and voice agents",
  description:
    "AI automations and AI voice agents for local businesses. Each service stands on its own; hire us for one or both.",
  alternates: { canonical: "/services" },
};

export default function ServicesPage() {
  return (
    <div className="pt-16">
      <Services />
      <CaseStudy />
      <PageCTA heading="Want to automate the busywork?" />
    </div>
  );
}
