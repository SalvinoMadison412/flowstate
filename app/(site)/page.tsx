import { Hero } from "@/components/sections/Hero";
import { Explore } from "@/components/sections/Explore";
import { CaseStudy } from "@/components/sections/CaseStudy";
import { PageCTA } from "@/components/sections/PageCTA";

export default function HomePage() {
  return (
    <>
      <Hero />
      <Explore />
      <CaseStudy />
      <PageCTA />
    </>
  );
}
