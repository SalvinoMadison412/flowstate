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
 * The heavier SVG / canvas-timeline sections are code-split into their own
 * chunks. They keep SSR (no `ssr: false`) so the copy stays crawlable — this is
 * an AI-visibility site; being readable without JS is the whole point.
 */
const Dashboard = dynamic(() =>
  import("@/components/sections/Dashboard").then((m) => m.Dashboard),
);
const GEOMockup = dynamic(() =>
  import("@/components/sections/GEOMockup").then((m) => m.GEOMockup),
);
const AuthorityDiagram = dynamic(() =>
  import("@/components/sections/AuthorityDiagram").then((m) => m.AuthorityDiagram),
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
        <Dashboard />
        <GEOMockup />
        <AuthorityDiagram />
        <AgenticWorkflow />
        <Industries />
        <CaseStudy />
        <FinalCTA />
      </main>
      <Footer />
    </>
  );
}
