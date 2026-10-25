import { Hero } from "@/components/sections/Hero";
import { Explore } from "@/components/sections/Explore";
import { CaseStudy } from "@/components/sections/CaseStudy";
import { WhyAI } from "@/components/sections/WhyAI";
import { PageCTA } from "@/components/sections/PageCTA";

export default function HomePage() {
  return (
    <>
      <Hero />
      <Explore />
      <CaseStudy />
      <WhyAI />
      <PageCTA />
    </>
  );
}
