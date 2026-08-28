"use client";

import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/Button";
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
/*  Floating "AI Visibility Score" card                                        */
/* -------------------------------------------------------------------------- */

function ScoreCard() {
  // arc: 34/100 of a 260deg sweep
  const radius = 34;
  const circumference = 2 * Math.PI * radius;
  const progress = 0.34;

  return (
    <div
      className="reveal-up pointer-events-none absolute bottom-8 right-4 hidden w-[230px] lg:block lg:right-10"
      style={{ animationDelay: "0.4s" }}
    >
      <div className="float-y rounded-xl border border-border-subtle bg-surface/90 p-4 backdrop-blur-sm shadow-card-lift">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-text-secondary">
            AI Visibility Score
          </span>
          <span className="font-mono text-[10px] text-accent">improving</span>
        </div>
        <div className="mt-3 flex items-center gap-3">
          <div className="relative h-16 w-16">
            <svg viewBox="0 0 80 80" className="h-full w-full -rotate-[130deg]">
              <circle
                cx="40"
                cy="40"
                r={radius}
                fill="none"
                stroke="#222222"
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={`${circumference * 0.72} ${circumference}`}
              />
              <circle
                cx="40"
                cy="40"
                r={radius}
                fill="none"
                stroke="#FFFFFF"
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={`${circumference * 0.72 * progress} ${circumference}`}
              />
            </svg>
          </div>
          <div className="leading-none">
            <div className="flex items-end gap-1">
              <span className="font-display text-3xl font-bold text-text-primary">
                34
              </span>
              <span className="mb-1 font-mono text-xs text-text-secondary">
                → 41
              </span>
            </div>
            <span className="font-mono text-[10px] text-text-muted">
              +7 this week
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

export function Hero() {
  return (
    <section
      id="top"
      className="relative flex min-h-[100svh] items-center justify-center overflow-hidden px-5 pt-16"
    >
      <ParticleField />
      {/* vignette so the headline stays readable over the field */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(8,8,8,0.2)_0%,rgba(8,8,8,0.75)_70%,#080808_100%)]" />

      {/* Entrance is CSS-driven (see .reveal-up) so the LCP headline is never
          left mid-fade by a throttled tab. */}
      <div className="relative z-10 mx-auto max-w-3xl text-center">
        <p className="reveal-up font-mono text-xs uppercase tracking-[0.24em] text-text-secondary">
          AI Visibility &amp; Growth
        </p>

        <h1
          className="reveal-up mt-5 font-display text-[2.25rem] font-bold leading-[1.05] tracking-display sm:text-5xl md:text-6xl lg:text-7xl"
          style={{ animationDelay: "0.06s" }}
        >
          AI is the new search engine.
          <br />
          <span className="text-text-secondary">Are you in it?</span>
        </h1>

        <p
          className="reveal-up mx-auto mt-6 max-w-xl text-lg text-text-secondary sm:text-xl"
          style={{ animationDelay: "0.13s" }}
        >
          Flow State helps brands get found, cited, and recommended by ChatGPT,
          Gemini, Perplexity, and every AI system replacing traditional search.
        </p>

        <div
          className="reveal-up mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row"
          style={{ animationDelay: "0.2s" }}
        >
          <Button href="#audit" variant="filled" size="lg">
            Start Your AI Audit
          </Button>
          <Button href="#how-it-works" variant="ghost" size="lg">
            See How It Works
          </Button>
        </div>
      </div>

      <ScoreCard />
    </section>
  );
}
