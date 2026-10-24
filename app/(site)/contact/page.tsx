import type { Metadata } from "next";
import { FinalCTA } from "@/components/sections/FinalCTA";

export const metadata: Metadata = {
  title: "Contact",
  description: "Book a free 30-minute strategy call with Flow State, call +1 (629) 281-8264, or email salvino@flowstateaiagents.com.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <div>
      <FinalCTA />
    </div>
  );
}
