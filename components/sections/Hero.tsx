"use client";

import { useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/Button";
import { VoiceWaveform } from "@/components/ui/VoiceWaveform";
import { useVoiceCall } from "@/lib/useVoiceCall";
import { usePrefersReducedMotion } from "@/lib/useReveal";

/* -------------------------------------------------------------------------- */
/*  Particle field — vanilla canvas, white nodes + thin connectors, slow drift */
/* -------------------------------------------------------------------------- */

type Node = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  pulse: boolean;
};

function ParticleField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reduceMotion = usePrefersReducedMotion();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let dpr = 1;
    let nodes: Node[] = [];
    let raf = 0;
    let t = 0;

    const NODE_COUNT = () => Math.min(64, Math.floor((width * height) / 22000));
    const LINK_DIST = 140;

    const build = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const count = NODE_COUNT();
      nodes = Array.from({ length: count }, (_, i) => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.15,
        vy: (Math.random() - 0.5) * 0.15,
        // Only one or two nodes carry a cyan pulse.
        pulse: i < 2,
      }));
    };

    const draw = () => {
      t += 0.016;
      ctx.clearRect(0, 0, width, height);

      for (const n of nodes) {
        n.x += n.vx;
        n.y += n.vy;
        if (n.x < 0 || n.x > width) n.vx *= -1;
        if (n.y < 0 || n.y > height) n.vy *= -1;
      }

      // connectors
      ctx.lineWidth = 1;
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i];
          const b = nodes[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.hypot(dx, dy);
          if (dist < LINK_DIST) {
            const alpha = (1 - dist / LINK_DIST) * 0.12;
            ctx.strokeStyle = `rgba(255,255,255,${alpha})`;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }

      // nodes
      for (const n of nodes) {
        if (n.pulse) {
          const glow = 0.5 + 0.5 * Math.sin(t * 1.6);
          ctx.fillStyle = `rgba(0,200,240,${0.15 + glow * 0.25})`;
          ctx.beginPath();
          ctx.arc(n.x, n.y, 6 + glow * 6, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = "rgba(0,200,240,0.9)";
          ctx.beginPath();
          ctx.arc(n.x, n.y, 2, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillStyle = "rgba(255,255,255,0.4)";
          ctx.beginPath();
          ctx.arc(n.x, n.y, 1.6, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      raf = requestAnimationFrame(draw);
    };

    build();

    if (reduceMotion) {
      // Draw a single static frame.
      draw();
      cancelAnimationFrame(raf);
    } else {
      raf = requestAnimationFrame(draw);
    }

    const onResize = () => {
      cancelAnimationFrame(raf);
      build();
      if (!reduceMotion) raf = requestAnimationFrame(draw);
      else draw();
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
    };
  }, [reduceMotion]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="absolute inset-0 h-full w-full"
    />
  );
}

/* -------------------------------------------------------------------------- */

// three.js is loaded on the client only, after first paint.
const VoiceOrb = dynamic(() => import("@/components/ui/VoiceOrb").then((m) => m.VoiceOrb), {
  ssr: false,
  loading: () => null,
});

const STATUS_COPY = {
  idle: "Tap the orb or press the button. Allow your mic and say hello.",
  connecting: "Connecting to Maoshi…",
  live: "Live. Maoshi is listening. Say hello.",
  error: "",
} as const;

export function Hero() {
  const { status, error, toggle } = useVoiceCall();

  return (
    <section
      id="top"
      className="relative flex min-h-[100svh] items-center overflow-hidden px-5 pb-12 pt-24 sm:px-8"
    >
      <ParticleField />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(8,8,8,0.2)_0%,rgba(8,8,8,0.75)_70%,#080808_100%)]" />

      {/* Entrance is CSS-driven (see .reveal-up) so the LCP headline is never
          left mid-fade by a throttled tab. */}
      <div className="relative z-10 mx-auto grid w-full max-w-6xl items-center gap-8 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="order-2 text-center lg:order-1 lg:text-left">
          <p className="reveal-up font-mono text-xs uppercase tracking-[0.24em] text-text-secondary">
            AI voice agents &nbsp;&middot;&nbsp; Ads &nbsp;&middot;&nbsp; GEO
          </p>

          <h1
            className="reveal-up mt-5 font-display text-[2.1rem] font-bold leading-[1.06] tracking-display sm:text-5xl md:text-6xl"
            style={{ animationDelay: "0.06s" }}
          >
            Meet the AI that <span className="text-accent">answers your phone.</span>
          </h1>

          <p
            className="reveal-up mx-auto mt-6 max-w-xl text-lg text-text-secondary sm:text-xl lg:mx-0"
            style={{ animationDelay: "0.13s" }}
          >
            Flow State builds voice agents that pick up every call, answer
            questions and take booking requests, then runs the ads and AI search
            that make the phone ring.
          </p>

          <div
            className="reveal-up mt-8 flex flex-col items-center gap-3 sm:flex-row lg:justify-start"
            style={{ animationDelay: "0.2s" }}
          >
            <Button variant="filled" size="lg" onClick={toggle} disabled={status === "connecting"}>
              {status === "live" ? "End call" : status === "connecting" ? "Connecting…" : "Talk to Maoshi, live"}
            </Button>
            <Button href="#audit" variant="ghost" size="lg">
              Book a strategy call
            </Button>
          </div>

          <div
            className="reveal-up mt-7 flex flex-col items-center gap-3 sm:flex-row lg:justify-start"
            style={{ animationDelay: "0.26s" }}
          >
            <VoiceWaveform className="w-[120px]" />
            <p role="status" aria-live="polite" className="font-mono text-xs text-text-secondary">
              {status === "error" ? <span className="text-red-400">{error}</span> : STATUS_COPY[status]}
            </p>
          </div>
        </div>

        <div className="relative order-1 mx-auto aspect-square w-full max-w-[280px] sm:max-w-[380px] lg:order-2 lg:max-w-[520px]">
          {/* ripples while the call is live */}
          {status === "live" &&
            [0, 1, 2].map((i) => (
              <span
                key={i}
                aria-hidden
                className="orb-ripple pointer-events-none absolute inset-[12%] rounded-full border border-accent/40"
                style={{ animationDelay: `${i * 0.9}s` }}
              />
            ))}
          <span
            aria-hidden
            className="pointer-events-none absolute inset-[8%] rounded-full bg-accent/10 blur-3xl"
          />
          <VoiceOrb className="absolute inset-0" />
        </div>
      </div>
    </section>
  );
}
