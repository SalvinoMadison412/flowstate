"use client";
/* Connects the existing voice call (useVoiceCall) to Maoshi. Render once inside <VoiceCallProvider>. */
import { useEffect, useRef } from "react";
import { useVoiceCall } from "@/lib/useVoiceCall";
import { maoshi } from "./maoshi";

export function MaoshiVoiceBridge() {
  const { status, start, stop } = useVoiceCall();
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
  return null;
}
