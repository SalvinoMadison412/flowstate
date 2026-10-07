import type { Metadata } from "next";
import { VoiceAgent, VoiceAgentDetails } from "@/components/sections/VoiceAgent";
import { Integrations } from "@/components/sections/Integrations";
import { PageCTA } from "@/components/sections/PageCTA";

export const metadata: Metadata = {
  title: "AI Voice Agents",
  description:
    "An AI receptionist that answers your firm's calls 24/7, takes intake and hands urgent calls to your team. Try a live demo intake call in your browser.",
  alternates: { canonical: "/voice-agent" },
};

export default function VoiceAgentPage() {
  return (
    <div className="pt-16">
      <VoiceAgent />
      <Integrations />
      <VoiceAgentDetails />
      <PageCTA heading="Want an intake line like this for your firm?" />
    </div>
  );
}
