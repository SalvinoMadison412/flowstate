"use client";

/**
 * One shared voice call for the whole page: the hero button, the 3D orb, the
 * waveform and the demo section all read the same connection. The browser talks
 * to OpenAI Realtime over WebRTC using a short-lived secret from
 * /api/voice/session. `levels` is a ref (not state) so 60fps visuals can read
 * it without re-rendering React.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MutableRefObject,
  type ReactNode,
} from "react";

export type CallStatus = "idle" | "connecting" | "live" | "error";
export type Levels = { agent: number; mic: number };

type VoiceCall = {
  status: CallStatus;
  error: string;
  start: () => void;
  stop: () => void;
  toggle: () => void;
  levels: MutableRefObject<Levels>;
};

const Ctx = createContext<VoiceCall | null>(null);

const MAX_CALL_MS = 5 * 60_000; // client-side cap; the ephemeral key can't enforce it

/** Smoothed 0..1 loudness of a stream, written into `levels.current[key]`. */
function meter(ctx: AudioContext, stream: MediaStream, levels: MutableRefObject<Levels>, key: keyof Levels) {
  const analyser = ctx.createAnalyser();
  analyser.fftSize = 512;
  ctx.createMediaStreamSource(stream).connect(analyser);
  const buf = new Uint8Array(analyser.fftSize);
  let raf = 0;
  const tick = () => {
    analyser.getByteTimeDomainData(buf);
    let sum = 0;
    for (const v of buf) sum += ((v - 128) / 128) ** 2;
    const rms = Math.min(1, Math.sqrt(sum / buf.length) * 4);
    levels.current[key] += (rms - levels.current[key]) * 0.25;
    raf = requestAnimationFrame(tick);
  };
  tick();
  return () => cancelAnimationFrame(raf);
}

export function VoiceCallProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<CallStatus>("idle");
  const [error, setError] = useState("");
  const levels = useRef<Levels>({ agent: 0, mic: 0 });
  const teardown = useRef<(() => void) | null>(null);

  const stop = useCallback(() => {
    teardown.current?.();
    teardown.current = null;
    levels.current = { agent: 0, mic: 0 };
    setStatus((s) => (s === "error" ? s : "idle"));
  }, []);

  useEffect(() => stop, [stop]);

  const fail = useCallback(
    (msg: string) => {
      teardown.current?.();
      teardown.current = null;
      levels.current = { agent: 0, mic: 0 };
      setError(msg);
      setStatus("error");
    },
    [],
  );

  const start = useCallback(async () => {
    if (teardown.current) return;
    setError("");
    setStatus("connecting");
    const cleanups: (() => void)[] = [];
    const mine = () => cleanups.forEach((c) => c());
    teardown.current = mine;
    // True once End call was pressed mid-connect; anything created after that is released.
    const cancelled = () => {
      if (teardown.current === mine) return false;
      mine();
      return true;
    };
    try {
      const res = await fetch("/api/voice/session", { method: "POST", cache: "no-store" });
      const data = await res.json();
      if (cancelled()) return;
      if (!res.ok) return fail(data.error || "Could not start the demo.");

      const mic = await navigator.mediaDevices.getUserMedia({ audio: true });
      cleanups.push(() => mic.getTracks().forEach((t) => t.stop()));
      if (cancelled()) return;
      const conn = new RTCPeerConnection();
      cleanups.push(() => conn.close());
      const audioCtx = new AudioContext();
      cleanups.push(() => void audioCtx.close());
      cleanups.push(meter(audioCtx, mic, levels, "mic"));

      const audio = new Audio();
      audio.autoplay = true;
      conn.ontrack = (e) => {
        audio.srcObject = e.streams[0];
        cleanups.push(meter(audioCtx, e.streams[0], levels, "agent"));
      };
      conn.addTrack(mic.getAudioTracks()[0]);
      conn.onconnectionstatechange = () => {
        if (["failed", "disconnected", "closed"].includes(conn.connectionState)) stop();
      };

      // Make the agent speak first, once the event channel is open.
      const events = conn.createDataChannel("oai-events");
      events.onopen = () => {
        events.send(JSON.stringify({ type: "response.create", response: { instructions: data.greeting } }));
        setStatus("live");
        const t = setTimeout(stop, MAX_CALL_MS);
        cleanups.push(() => clearTimeout(t));
      };

      await conn.setLocalDescription(await conn.createOffer());
      const answer = await fetch("https://api.openai.com/v1/realtime/calls", {
        method: "POST",
        headers: { Authorization: `Bearer ${data.secret}`, "content-type": "application/sdp" },
        body: conn.localDescription!.sdp,
      });
      if (cancelled()) return;
      if (!answer.ok) return fail("Could not connect. Please try again.");
      await conn.setRemoteDescription({ type: "answer", sdp: await answer.text() });
    } catch (e) {
      if (cancelled()) return;
      fail(
        (e as Error).name === "NotAllowedError"
          ? "Microphone access was blocked. Allow it and try again."
          : "Could not start the call. Please try again.",
      );
    }
  }, [fail, stop]);

  const toggle = useCallback(() => {
    if (teardown.current) stop();
    else void start();
  }, [start, stop]);

  const value = useMemo(
    () => ({ status, error, start: () => void start(), stop, toggle, levels }),
    [status, error, start, stop, toggle],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useVoiceCall(): VoiceCall {
  const v = useContext(Ctx);
  if (!v) throw new Error("useVoiceCall must be used inside <VoiceCallProvider>");
  return v;
}
