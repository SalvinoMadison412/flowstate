"use client";

/**
 * One shared voice call for the whole page: the hero button, the 3D orb, the
 * waveform and the demo section all read the same connection. The browser talks
 * to Gemini Live over a WebSocket using a single-use token from
 * /api/voice/session: mic audio goes up as 16-bit PCM, the agent's 24kHz PCM
 * comes back and is played gaplessly. `levels` is a ref (not state) so 60fps
 * visuals can read it without re-rendering React.
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
import { usePathname } from "next/navigation";
import { track } from "@/lib/track";

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

const MAX_CALL_MS = 5 * 60_000; // client-side cap; the token's expireTime ends it server-side too

const LIVE_URL =
  "wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContentConstrained";

// AudioWorklet that hands raw mic samples to the main thread.
const CAPTURE_WORKLET = `registerProcessor("capture", class extends AudioWorkletProcessor {
  process([input]) { if (input[0]) this.port.postMessage(input[0].slice()); return true; }
});`;

const toBase64 = (bytes: Uint8Array) => {
  let s = "";
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s);
};

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
  const startedAt = useRef(0);
  const persona = usePathname() === "/voice-agent" ? "legal" : "maoshi";

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const el = (e.target as HTMLElement).closest<HTMLElement>("[data-track]");
      if (el) track("cta_click", el.dataset.track);
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  const stop = useCallback(() => {
    if (startedAt.current) {
      track("demo_end", String(Math.round((Date.now() - startedAt.current) / 1000)));
      startedAt.current = 0;
    }
    teardown.current?.();
    teardown.current = null;
    levels.current = { agent: 0, mic: 0 };
    setStatus((s) => (s === "error" ? s : "idle"));
  }, []);

  useEffect(() => stop, [stop]);

  const fail = useCallback(
    (msg: string) => {
      track("demo_error", msg);
      startedAt.current = 0;
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
    if (!navigator.mediaDevices?.getUserMedia || typeof AudioWorkletNode === "undefined")
      return fail("Live calls don't work in this browser. Open this page in Safari or Chrome to try it.");
    const cleanups: (() => void)[] = [];
    const mine = () => cleanups.forEach((c) => c());
    teardown.current = mine;
    const alive = () => teardown.current === mine;
    // True once End call was pressed mid-connect; anything created after that is released.
    const cancelled = () => {
      if (alive()) return false;
      mine();
      return true;
    };
    // Created inside the click so Safari lets it play sound.
    const audioCtx = new AudioContext();
    cleanups.push(() => void audioCtx.close());
    try {
      const mic = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true },
      });
      cleanups.push(() => mic.getTracks().forEach((t) => t.stop()));
      if (cancelled()) return;

      const res = await fetch("/api/voice/session", {
        method: "POST",
        cache: "no-store",
        body: JSON.stringify({ persona }),
        headers: { "content-type": "application/json" },
      });
      const data = await res.json().catch(() => ({}));
      if (cancelled()) return;
      if (!res.ok) return fail(data.error || "Could not start the demo.");

      cleanups.push(meter(audioCtx, mic, levels, "mic"));
      const worklet = URL.createObjectURL(new Blob([CAPTURE_WORKLET], { type: "text/javascript" }));
      await audioCtx.audioWorklet.addModule(worklet);
      URL.revokeObjectURL(worklet);
      if (cancelled()) return;
      const capture = new AudioWorkletNode(audioCtx, "capture");
      audioCtx.createMediaStreamSource(mic).connect(capture);
      capture.connect(audioCtx.destination); // outputs silence; keeps the worklet running
      cleanups.push(() => capture.disconnect());

      // Agent audio: 24kHz PCM chunks scheduled back to back. `out` also feeds the agent meter.
      const out = audioCtx.createGain();
      out.connect(audioCtx.destination);
      const outStream = audioCtx.createMediaStreamDestination();
      out.connect(outStream);
      cleanups.push(meter(audioCtx, outStream.stream, levels, "agent"));
      const playing = new Set<AudioBufferSourceNode>();
      let playAt = 0;
      const play = (b64: string) => {
        const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
        const pcm = new Int16Array(bytes.buffer, 0, bytes.length >> 1);
        const buf = audioCtx.createBuffer(1, pcm.length, 24000);
        const ch = buf.getChannelData(0);
        for (let i = 0; i < pcm.length; i++) ch[i] = pcm[i] / 32768;
        const src = audioCtx.createBufferSource();
        src.buffer = buf;
        src.connect(out);
        playAt = Math.max(playAt, audioCtx.currentTime);
        src.start(playAt);
        playAt += buf.duration;
        playing.add(src);
        src.onended = () => playing.delete(src);
      };
      // The visitor talked over the agent: drop whatever is still queued.
      const flush = () => {
        playing.forEach((s) => s.stop());
        playing.clear();
        playAt = 0;
      };

      const ws = new WebSocket(`${LIVE_URL}?access_token=${encodeURIComponent(data.token)}`);
      cleanups.push(() => {
        ws.onclose = ws.onmessage = null;
        ws.close();
      });
      // The token carries the real setup (persona, voice); Gemini ignores everything here but the model.
      ws.onopen = () => ws.send(JSON.stringify({ setup: { model: `models/${data.model}` } }));
      ws.onclose = () => {
        if (!alive()) return;
        if (startedAt.current) stop();
        else fail("Could not connect. Please try again.");
      };

      // Mic samples go up in ~100ms chunks once the session is ready.
      let ready = false;
      let pending: Float32Array[] = [];
      let count = 0;
      capture.port.onmessage = (e: MessageEvent<Float32Array>) => {
        if (!ready || ws.readyState !== WebSocket.OPEN) return;
        pending.push(e.data);
        count += e.data.length;
        if (count < audioCtx.sampleRate / 10) return;
        const pcm = new Int16Array(count);
        let o = 0;
        for (const f of pending) for (const v of f) pcm[o++] = Math.max(-1, Math.min(1, v)) * 0x7fff;
        pending = [];
        count = 0;
        ws.send(
          JSON.stringify({
            realtimeInput: {
              audio: { data: toBase64(new Uint8Array(pcm.buffer)), mimeType: `audio/pcm;rate=${audioCtx.sampleRate}` },
            },
          }),
        );
      };

      ws.onmessage = async (e) => {
        const msg = JSON.parse(typeof e.data === "string" ? e.data : await (e.data as Blob).text());
        if (!alive()) return;
        if (msg.setupComplete) {
          // Make the agent speak first.
          ws.send(
            JSON.stringify({
              clientContent: { turns: [{ role: "user", parts: [{ text: data.greeting }] }], turnComplete: true },
            }),
          );
          ready = true;
          startedAt.current = Date.now();
          track("demo_start", persona);
          setStatus("live");
          const t = setTimeout(stop, MAX_CALL_MS);
          cleanups.push(() => clearTimeout(t));
        }
        const content = msg.serverContent;
        if (content?.interrupted) flush();
        for (const part of content?.modelTurn?.parts ?? []) if (part.inlineData?.data) play(part.inlineData.data);
      };
    } catch (e) {
      if (cancelled()) return;
      fail(
        (e as Error).name === "NotAllowedError"
          ? "Microphone access was blocked. Allow it in your browser settings, or open this page in Safari or Chrome."
          : "Could not start the call. Please try again.",
      );
    }
  }, [fail, stop, persona]);

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
