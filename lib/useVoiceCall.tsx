"use client";

/**
 * One shared voice call for the whole page: the hero button, the 3D orb, the
 * waveform and the demo section all read the same connection. Free pipeline:
 * the browser's speech recognition hears the visitor, /api/voice/chat gets the
 * reply from a free OpenRouter model, and the browser's own voice speaks it.
 * `levels` is a ref (not state) so 60fps visuals can read it without
 * re-rendering React.
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

const MAX_CALL_MS = 5 * 60_000; // client-side cap; the route's per-IP turn limit is the real guard

// Minimal typing for the Web Speech API (not in TS's DOM lib everywhere).
type SpeechRecognitionCtor = new () => {
  lang: string;
  onresult: ((e: { results: { [i: number]: { [j: number]: { transcript: string } } } }) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  abort: () => void;
};

/** Best-sounding installed voice for the language (OS "natural"/"premium" voices beat the defaults). */
function pickVoice(lang: string) {
  const voices = speechSynthesis.getVoices().filter((v) => v.lang.startsWith(lang.slice(0, 2)));
  return (
    voices.find((v) => /natural|premium|enhanced|neural/i.test(v.name)) ??
    voices.find((v) => /google|samantha|siri/i.test(v.name)) ??
    voices[0] ??
    null
  );
}

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
    const w = window as unknown as { SpeechRecognition?: SpeechRecognitionCtor; webkitSpeechRecognition?: SpeechRecognitionCtor };
    const SR = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (!navigator.mediaDevices?.getUserMedia || !SR || !window.speechSynthesis)
      return fail("Live calls don't work in this browser. Open this page in Chrome or Safari to try it.");
    // Safari only lets speech play if the first speak() happens inside the click.
    speechSynthesis.speak(new SpeechSynthesisUtterance(""));
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
    try {
      const mic = await navigator.mediaDevices.getUserMedia({ audio: true });
      cleanups.push(() => mic.getTracks().forEach((t) => t.stop()));
      if (cancelled()) return;
      const audioCtx = new AudioContext();
      cleanups.push(() => void audioCtx.close());
      cleanups.push(meter(audioCtx, mic, levels, "mic"));

      const lang = navigator.language || "en-US";
      const history: { role: "user" | "assistant"; content: string }[] = [];
      const rec = new SR();
      rec.lang = lang;
      let heard = "";
      rec.onresult = (e) => (heard = e.results[0][0].transcript);
      rec.onerror = (e) => {
        if (e.error === "not-allowed" || e.error === "service-not-allowed")
          fail("Microphone access was blocked. Allow it in your browser settings, or open this page in Chrome or Safari.");
        else if (e.error === "network") fail("Voice recognition couldn't connect. Check your connection and try again.");
      };
      // One phrase per recognition run: reply if something was heard, else keep listening.
      rec.onend = () => {
        if (!alive()) return;
        const said = heard.trim();
        heard = "";
        if (said) void turn(said);
        else listen();
      };
      const listen = () => {
        if (alive()) try { rec.start(); } catch {}
      };
      cleanups.push(() => {
        rec.onend = null;
        rec.abort();
        speechSynthesis.cancel();
      });

      // speechSynthesis gives no audio stream to meter, so animate the agent level while it talks.
      const say = (text: string) =>
        new Promise<void>((done) => {
          const u = new SpeechSynthesisUtterance(text);
          u.lang = lang;
          u.voice = pickVoice(lang);
          let raf = 0;
          const pulse = () => {
            const target = 0.35 + 0.35 * Math.abs(Math.sin(performance.now() / 90));
            levels.current.agent += (target - levels.current.agent) * 0.25;
            raf = requestAnimationFrame(pulse);
          };
          u.onend = u.onerror = () => {
            cancelAnimationFrame(raf);
            levels.current.agent = 0;
            done();
          };
          pulse();
          speechSynthesis.speak(u);
        });

      const turn = async (said?: string) => {
        if (said) history.push({ role: "user", content: said });
        const res = await fetch("/api/voice/chat", {
          method: "POST",
          cache: "no-store",
          body: JSON.stringify({ persona, messages: history }),
          headers: { "content-type": "application/json" },
        });
        const data = await res.json().catch(() => ({}));
        if (!alive()) return;
        if (!res.ok) return fail(data.error || "Could not start the demo.");
        history.push({ role: "assistant", content: data.reply });
        if (!startedAt.current) {
          startedAt.current = Date.now();
          track("demo_start", persona);
          setStatus("live");
          const t = setTimeout(stop, MAX_CALL_MS);
          cleanups.push(() => clearTimeout(t));
        }
        await say(data.reply);
        listen();
      };

      await turn(); // empty history: the route adds the greeting trigger, so the agent speaks first
    } catch (e) {
      if (cancelled()) return;
      fail(
        (e as Error).name === "NotAllowedError"
          ? "Microphone access was blocked. Allow it in your browser settings, or open this page in Chrome or Safari."
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
