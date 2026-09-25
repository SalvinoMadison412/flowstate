import type { Metadata } from "next";
import { VoiceAgent } from "@/components/sections/VoiceAgent";
import { PageCTA } from "@/components/sections/PageCTA";

export const metadata: Metadata = {
  title: "AI Voice Agents",
  description:
    "Flow State builds AI voice agents that answer every call, take booking requests and hand off to your team. Talk to Maoshi, a live one, in your browser.",
  alternates: { canonical: "/voice-agent" },
};

export default function VoiceAgentPage() {
  return (
    <div className="pt-16">
      <VoiceAgent />
      <PageCTA heading="Want a voice agent for your business?" />
    </div>
  );
}
