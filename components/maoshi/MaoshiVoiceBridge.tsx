"use client";
/* Connects the existing voice call (useVoiceCall) to Maoshi. Render once inside <VoiceCallProvider>. */
import { useEffect, useRef } from "react";
import { useVoiceCall } from "@/lib/useVoiceCall";
import { maoshi, type VoiceState } from "./maoshi";

export function MaoshiVoiceBridge() {
  const { status, start, stop, levels } = useVoiceCall();
  const statusRef = useRef(status);
  statusRef.current = status;

  // call state -> zoom in while a call is starting/live, zoom out when it ends
  useEffect(() => {
    if (status === "connecting" || status === "live") maoshi.openTalk();
    else maoshi.closeTalk();
  }, [status]);

  // Maoshi side (click on him, "End conversation", Esc, backdrop) -> call
  useEffect(
    () =>
      maoshi.onTalkChange((open) => {
        const s = statusRef.current;
        if (open && s === "idle") start();
        if (!open && (s === "connecting" || s === "live")) stop();
      }),
    [start, stop],
  );

  // body language: connecting -> listening / thinking / speaking from the two audio levels
  useEffect(() => {
    if (status !== "live") {
      maoshi.setVoice(status === "connecting" ? "connecting" : "off");
      maoshi.setAgentLevel(0);
      maoshi.setUserLevel(0);
      return;
    }
    let raf = 0;
    let current: VoiceState = "listening";
    let userSpoke = false; // the caller finished a turn and the agent hasn't answered yet -> thinking
    let quietSince = performance.now();
    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      const { agent, mic } = levels.current;
      maoshi.setAgentLevel(agent);
      maoshi.setUserLevel(mic);
      let next: VoiceState = current;
      if (agent > 0.06 && agent >= mic) { next = "speaking"; userSpoke = false; quietSince = now; }
      else if (mic > 0.08) { next = "listening"; userSpoke = true; quietSince = now; }
      else if (now - quietSince > 500) next = userSpoke ? "thinking" : "listening"; // hold between words
      if (next !== current) { current = next; maoshi.setVoice(next); }
    };
    maoshi.setVoice("listening");
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [status, levels]);

  return null;
}
