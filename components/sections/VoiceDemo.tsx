"use client";

import { useEffect, useRef, useState } from "react";
import { Section, SectionHeading, SectionLabel } from "@/components/ui/Section";
import { Reveal } from "@/components/ui/Reveal";
import { Button } from "@/components/ui/Button";

type Status = "idle" | "connecting" | "live" | "error";

const MAX_CALL_MS = 5 * 60_000; // client-side cap; the ephemeral key can't enforce it

export function VoiceDemo() {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");
  const pc = useRef<RTCPeerConnection | null>(null);
  const mic = useRef<MediaStream | null>(null);
  const cap = useRef<ReturnType<typeof setTimeout>>();

  function stop() {
    clearTimeout(cap.current);
    pc.current?.close();
    mic.current?.getTracks().forEach((t) => t.stop());
    pc.current = null;
    mic.current = null;
  }

  useEffect(() => stop, []);

  const fail = (msg: string) => {
    stop();
    setError(msg);
    setStatus("error");
  };

  async function start() {
    setError("");
    setStatus("connecting");
    try {
      const res = await fetch("/api/voice/session", { method: "POST", cache: "no-store" });
      const data = await res.json();
      if (!res.ok) return fail(data.error || "Could not start the demo.");

      mic.current = await navigator.mediaDevices.getUserMedia({ audio: true });
      const conn = new RTCPeerConnection();
      pc.current = conn;

      const audio = new Audio();
      audio.autoplay = true;
      conn.ontrack = (e) => (audio.srcObject = e.streams[0]);
      conn.addTrack(mic.current.getAudioTracks()[0]);
      conn.onconnectionstatechange = () => {
        if (["failed", "disconnected", "closed"].includes(conn.connectionState)) {
          stop();
          setStatus((s) => (s === "error" ? s : "idle"));
        }
      };

      // Make the agent speak first, once the event channel is open.
      const events = conn.createDataChannel("oai-events");
      events.onopen = () => {
        events.send(
          JSON.stringify({ type: "response.create", response: { instructions: data.greeting } }),
        );
        setStatus("live");
        cap.current = setTimeout(() => {
          stop();
          setStatus("idle");
        }, MAX_CALL_MS);
      };

      await conn.setLocalDescription(await conn.createOffer());
      const answer = await fetch("https://api.openai.com/v1/realtime/calls", {
        method: "POST",
        headers: { Authorization: `Bearer ${data.secret}`, "content-type": "application/sdp" },
        body: conn.localDescription!.sdp,
      });
      if (!answer.ok) return fail("Could not connect. Please try again.");
      await conn.setRemoteDescription({ type: "answer", sdp: await answer.text() });
    } catch (e) {
      const denied = (e as Error).name === "NotAllowedError";
      fail(
        denied
          ? "Microphone access was blocked. Allow it and try again."
          : "Could not start the call. Please try again.",
      );
    }
  }

  return (
    <Section id="voice-demo">
      <SectionLabel>Live demo</SectionLabel>
      <SectionHeading className="mt-4 max-w-2xl">
        Talk to our AI receptionist. Right now.
      </SectionHeading>
      <p className="mt-6 max-w-2xl text-sm leading-relaxed text-text-secondary sm:text-base">
        This is the kind of voice agent we build for multi-location businesses:
        it answers questions and points callers to the right next step. No
        phone needed, just allow your microphone and say hello.
      </p>

      <Reveal className="mt-10">
        <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-border-active bg-surface-elevated p-7 sm:p-8">
          {status === "live" ? (
            <Button
              variant="outline"
              size="lg"
              onClick={() => {
                stop();
                setStatus("idle");
              }}
            >
              End call
            </Button>
          ) : (
            <Button
              variant="filled"
              size="lg"
              onClick={start}
              disabled={status === "connecting"}
            >
              {status === "connecting" ? "Connecting…" : "Talk to our AI"}
            </Button>
          )}
          <span
            role="status"
            aria-live="polite"
            className="font-mono text-xs text-text-secondary"
          >
            {status === "live" && "Live. Say hello."}
            {status === "error" && <span className="text-red-400">{error}</span>}
          </span>
        </div>
      </Reveal>
    </Section>
  );
}
