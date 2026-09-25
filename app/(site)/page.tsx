import { Hero } from "@/components/sections/Hero";
import { Problem } from "@/components/sections/Problem";
import { Industries } from "@/components/sections/Industries";
import { Explore } from "@/components/sections/Explore";
import { PageCTA } from "@/components/sections/PageCTA";

export default function HomePage() {
  return (
    <>
      <Hero />
      <Explore />
      <Problem />
      <Industries />
      <PageCTA />
    </>
  );
}
