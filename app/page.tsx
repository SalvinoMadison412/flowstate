import dynamic from "next/dynamic";
import { Nav } from "@/components/ui/Nav";
import { Hero } from "@/components/sections/Hero";
import { Problem } from "@/components/sections/Problem";
import { Services } from "@/components/sections/Services";
import { Industries } from "@/components/sections/Industries";
import { CaseStudy } from "@/components/sections/CaseStudy";
import { FinalCTA } from "@/components/sections/FinalCTA";
import { Footer } from "@/components/sections/Footer";

/*
 * The heavier SVG / canvas sections are code-split into their own chunks. They
 * keep SSR (no `ssr: false`) so the copy stays crawlable.
 */
const GEOMockup = dynamic(() =>
  import("@/components/sections/GEOMockup").then((m) => m.GEOMockup),
);
const AgenticWorkflow = dynamic(() =>
  import("@/components/sections/AgenticWorkflow").then((m) => m.AgenticWorkflow),
);

export default function HomePage() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <Problem />
        <Services />
        <GEOMockup />
        <AgenticWorkflow />
        <Industries />
        <CaseStudy />
        <FinalCTA />
      </main>
      <Footer />
    </>
  );
}
