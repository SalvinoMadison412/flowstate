import type { Metadata } from "next";
import { FinalCTA } from "@/components/sections/FinalCTA";

export const metadata: Metadata = {
  title: "Contact",
  description: "Book a free 30-minute strategy call with Flow State, or email flowstate.agents@gmail.com.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <div className="pt-16">
      <FinalCTA />
    </div>
  );
}
