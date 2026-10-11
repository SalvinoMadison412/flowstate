"use client";

/**
 * Glass orb: a flat frosted-glass disc with six colours drifting behind it and
 * Maoshi's face (three.js, transparent canvas) inside the pane. Spec: glass-orb-handoff/DESIGN.md.
 * The glass is plain CSS (blurred blobs + backdrop-filter); per-frame work is transforms and
 * opacity only. Loaded with dynamic({ ssr: false }); without WebGL the glass shows on its own.
 */
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { useVoiceCall } from "@/lib/useVoiceCall";
import { usePrefersReducedMotion } from "@/lib/useReveal";

// [colour, phase, turns round x, turns round y, orbit, size] (from INK in frosted_glass.html)
const INK = [
  ["#00C8F0", 0.0, 1, 1, 1.0, 1.0],
  ["#3B6BFF", 1.1, 1, 2, 0.9, 0.9],
  ["#9B5CFF", 2.3, 2, 1, 0.95, 0.85],
  ["#FF4FA3", 3.4, 1, 1, 0.85, 0.8],
  ["#FFB02E", 4.4, 1, 2, 0.95, 0.72],
  ["#2EE6A6", 5.5, 2, 1, 0.9, 0.8],
] as const;

const TAU = Math.PI * 2;
const SKIN = 0xf3eadd;
const CLIPS = ["Idle", "Listen", "Talk", "Wave", "Nod", "Happy"];
const FX = ["Wave", "Nod", "Happy"]; // little antics while idle
const FADE = 0.15; // clip crossfade, seconds
const TALK_HOLD = 0.3; // keep Talk this long after the agent goes quiet
const FRAME_R = { feet: 1.95, height: 2.57 }; // in disc radii: only the face and shoulders show
const GRAIN = `url("data:image/svg+xml,${encodeURIComponent(
  "<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix type='saturate' values='0'/></filter><rect width='200' height='200' filter='url(%23n)'/></svg>",
)}")`;
const abs = "absolute inset-0 rounded-full pointer-events-none";

export function VoiceOrb({ className }: { className?: string }) {
  const host = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null); // the disc box, 2R square
  const pane = useRef<HTMLDivElement>(null); // scaled with the voice
  const blobs = useRef<(HTMLSpanElement | null)[]>([]);
  const glow = useRef<HTMLDivElement>(null);
  const rings = useRef<(HTMLSpanElement | null)[]>([]);
  const canvas = useRef<HTMLCanvasElement>(null);
  const { status, toggle, stop, levels } = useVoiceCall();
  // while a call is connecting or live, Maoshi takes over the whole screen
  const full = status === "connecting" || status === "live";
  const reduceMotion = usePrefersReducedMotion();
  const [noGL, setNoGL] = useState(false);

  // Zoom in/out: slide and scale the disc between where it sits on the page and the full-screen spot (FLIP).
  const rects = useRef<{ inline?: DOMRect; full?: DOMRect }>({});
  const wasFull = useRef(false);
  useEffect(() => {
    const note = () => {
      if (!wasFull.current && stage.current) rects.current.inline = stage.current.getBoundingClientRect();
    };
    note();
    window.addEventListener("pointerdown", note, true);
    window.addEventListener("resize", note);
    return () => {
      window.removeEventListener("pointerdown", note, true);
      window.removeEventListener("resize", note);
    };
  }, []);
  useLayoutEffect(() => {
    const st = stage.current;
    if (!st || full === wasFull.current) return;
    wasFull.current = full;
    const to = st.getBoundingClientRect();
    const from = full ? rects.current.inline : rects.current.full;
    if (full) rects.current.full = to;
    else rects.current.inline = to;
    if (!from || reduceMotion || !st.animate) return;
    const dx = from.left + from.width / 2 - (to.left + to.width / 2);
    const dy = from.top + from.height / 2 - (to.top + to.height / 2);
    st.animate(
      [{ translate: `${dx}px ${dy}px`, scale: from.width / to.width }, { translate: "0 0", scale: 1 }],
      { duration: 900, easing: "cubic-bezier(.45,0,.2,1)" },
    );
  }, [full, reduceMotion]);

  useEffect(() => {
    if (!full) return;
    const prev = document.body.style.overflow;
    const opener = document.activeElement as HTMLElement | null;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") stop();
      if (e.key === "Tab") {
        e.preventDefault(); // End call is the only control, keep focus on it
        host.current?.querySelector("button")?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      opener?.focus?.();
      window.removeEventListener("keydown", onKey);
    };
  }, [full, stop]);
  const live = useRef({ status, toggle });
  live.current = { status, toggle };

  useEffect(() => {
    const el = host.current;
    const st = stage.current;
    const cv = canvas.current;
    if (!el || !st || !cv) return;

    let R = 100;
    // ── three.js: Maoshi, orthographic, 1 unit = 1 disc radius
    let renderer: THREE.WebGLRenderer | null = null;
    try {
      renderer = new THREE.WebGLRenderer({ canvas: cv, alpha: true, antialias: true });
    } catch {
      setNoGL(true);
    }
    const scene = new THREE.Scene();
    const cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 50);
    cam.position.z = 10;
    const body = new THREE.Group();
    body.position.y = -FRAME_R.feet;
    body.scale.setScalar(FRAME_R.height);
    scene.add(body);
    for (const sx of [-1, 1]) {
      const l = new THREE.PointLight(0x00c8f0, 1.2, 0, 0);
      l.position.set(sx * 0.8, 0.9, -0.7);
      body.add(l);
    }
    if (renderer) {
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.NoToneMapping;
      scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.04).texture;
      scene.environmentIntensity = 0.25;
      scene.add(new THREE.HemisphereLight(0xffffff, 0xd8d2c6, 0.4));
      const key = new THREE.DirectionalLight(0xffffff, 0.25);
      key.position.set(300, 500, 600);
      scene.add(key);
    }

    let mixer: THREE.AnimationMixer | undefined;
    const actions: Record<string, THREE.AnimationAction> = {};
    let hips: THREE.Object3D | undefined;
    let head: THREE.Object3D | undefined;
    const headClean = new THREE.Quaternion();
    const look = { yaw: 0, pitch: 0, ex: 0, ey: 0, tx: 0, ty: 0 };
    let fxUntil = 0;
    let fxIn = 5;
    const hipsScale = new THREE.Vector3(1, 1, 1);
    const eyes: { o: THREE.Object3D; s: THREE.Vector3; p: THREE.Vector3 }[] = [];
    let current: THREE.AnimationAction | undefined;
    let loaded = false;
    let alive = true;

    const play = (name: string) => {
      const a = actions[name];
      if (!a || a === current) return;
      a.reset().setEffectiveWeight(1).play();
      current?.crossFadeTo(a, reduceMotion ? 0.05 : FADE, false);
      current = a;
    };

    const resize = () => {
      R = (st.clientWidth || 200) / 2;
      st.style.setProperty("--R", `${R}px`);
      renderer?.setSize(2 * R, 2 * R, false);
    };
    const ro = new ResizeObserver(() => {
      resize();
      if (reduceMotion) drawStatic();
    });
    ro.observe(st);

    // ── glass: blob positions are the only thing that moves (transforms), plus pane scale and rings
    let phase = 0; // 0..1 loops are 5 s at rest
    let lean = { x: 0, y: 0, tx: 0, ty: 0 };
    const place = (v: number, k: number) => {
      INK.forEach(([, p, nx, ny, orbit, size], i) => {
        const b = blobs.current[i];
        if (!b) return;
        const x = (190 + 50 * v) / 300 * orbit * Math.cos(phase * TAU * nx + p) * R;
        const y = (175 + 40 * v) / 300 * orbit * Math.sin(phase * TAU * ny + p * 1.3) * R;
        b.style.transform = `translate3d(${x}px,${y}px,0) scale(${((150 + 36 * v) / 300) * size})`;
      });
      if (pane.current) pane.current.style.transform = `scale(${k})`;
      if (glow.current) glow.current.style.transform = `translate3d(${lean.x}px,${lean.y}px,0)`;
    };

    const setBlink = (open: number, ex = 0, ey = 0) => {
      const o = Math.max(0.14, open);
      const shut = 1 - o;
      for (const e of eyes) {
        e.o.scale.set(e.s.x * (1 + shut * 0.12), e.s.y * o, e.s.z * (1 + shut * 0.5));
        e.o.position.set(e.p.x + ex * 0.005, e.p.y - ey * 0.004, e.p.z + 0.012 + shut * 0.012);
      }
    };

    function drawStatic() {
      place(0, 1);
      for (const r of rings.current) if (r) r.style.opacity = "0";
      if (loaded && renderer) {
        play("Idle");
        mixer?.update(0);
        renderer.render(scene, cam);
      }
    }

    new GLTFLoader()
      .loadAsync("/maoshi/maoshi.glb")
      .then((gltf) => {
        if (!alive) return;
        gltf.scene.traverse((o) => {
          if (/Hips$/.test(o.name) && (o as THREE.Bone).isBone) {
            hips = o;
            hipsScale.copy(o.scale);
          }
          if (/Head$/.test(o.name) && (o as THREE.Bone).isBone) head = o;
          const m = o as THREE.Mesh;
          if (m.isMesh) {
            m.frustumCulled = false;
            const mat = m.material as THREE.MeshStandardMaterial;
            if (o.name.startsWith("Eye")) mat.envMapIntensity = 1.4;
            else {
              mat.envMapIntensity = 0.05;
              mat.roughness = 0.95;
              mat.metalness = 0;
              mat.color.set(SKIN);
              mat.emissive.copy(mat.color).multiplyScalar(0.3);
            }
          }
          if (/^Eye_[LR]$/.test(o.name)) eyes.push({ o, s: o.scale.clone(), p: o.position.clone() });
        });
        body.add(gltf.scene);
        mixer = new THREE.AnimationMixer(gltf.scene);
        for (const clip of gltf.animations) {
          if (!CLIPS.includes(clip.name)) continue;
          const a = mixer.clipAction(clip);
          if (FX.includes(clip.name)) {
            a.setLoop(THREE.LoopOnce, 1);
            a.clampWhenFinished = true;
          }
          actions[clip.name] = a;
        }
        loaded = true;
        play("Idle");
        if (reduceMotion) drawStatic();
      })
      .catch(() => alive && setNoGL(true));

    // ── pointer: blobs lean a few px toward the cursor
    const onLook = (e: PointerEvent) => {
      const r = st.getBoundingClientRect();
      look.tx = Math.max(-1, Math.min(1, (e.clientX - (r.left + r.width / 2)) / 500));
      look.ty = Math.max(-1, Math.min(1, (e.clientY - (r.top + r.height / 2)) / 400));
    };
    window.addEventListener("pointermove", onLook, { passive: true });
    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      lean.tx = ((e.clientX - r.left) / r.width - 0.5) * 0.08 * R * 2;
      lean.ty = ((e.clientY - r.top) / r.height - 0.5) * 0.08 * R * 2;
    };
    const onLeave = () => (lean.tx = lean.ty = 0);
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerleave", onLeave);

    // ── loop: paused offscreen / hidden tab
    let visible = true;
    const io = new IntersectionObserver(([en]) => (visible = en.isIntersecting));
    io.observe(el);
    let raf = 0;
    let last = performance.now();
    let level = 0;
    let talkUntil = 0;
    let blinkT = 0;
    let t = 0;
    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      if (!visible || document.hidden) {
        last = now;
        return;
      }
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      t += dt;
      const s = live.current.status;
      const lv = levels.current;
      const target = s === "live" ? Math.max(lv.agent, lv.mic * 0.5) : 0;
      level += (target - level) * Math.min(1, dt * 14);
      phase = (phase + (dt / 5) * (s === "connecting" ? 1.5 : 1)) % 1000;

      // clip: Talk while the agent speaks (held briefly), Listen on a call, else Idle
      const speaking = s === "live" && lv.agent > 0.08;
      if (speaking) talkUntil = now + TALK_HOLD * 1000;
      // idle antics: Wave / Nod / Happy every so often, then back to Idle
      if (s !== "idle") fxUntil = 0;
      else if (now > fxUntil) {
        fxIn -= dt;
        if (fxIn <= 0 && loaded) {
          fxIn = 7 + Math.random() * 6;
          const n = FX[Math.floor(Math.random() * FX.length)];
          if (actions[n]) {
            play(n);
            fxUntil = now + actions[n].getClip().duration * 1000;
          }
        }
      }
      if (!(s === "idle" && now < fxUntil)) play(s === "idle" ? "Idle" : now < talkUntil ? "Talk" : "Listen");

      lean.x += (lean.tx - lean.x) * 0.08;
      lean.y += (lean.ty - lean.y) * 0.08;
      const agentLevel = s === "live" ? lv.agent : 0;
      place(level, 1 + 0.022 * level);
      rings.current.forEach((r, i) => {
        if (!r) return;
        const u = (t * 3 + i / 3) % 1;
        r.style.transform = `scale(${(40 + u * 250) / 300})`;
        r.style.opacity = String(0.5 * agentLevel * Math.sin(u * Math.PI));
      });

      if (loaded && renderer && mixer) {
        const talk = current === actions.Talk;
        if (talk) current!.setEffectiveTimeScale(0.7 + agentLevel * 0.9);
        if (head) head.quaternion.copy(headClean);
        mixer.update(dt);
        if (head) {
          headClean.copy(head.quaternion);
          const a = Math.min(1, dt * 5);
          look.yaw += (look.tx * 0.2 - look.yaw) * a;
          look.pitch += (look.ty * 0.12 - look.pitch) * a;
          look.ex += (look.tx - look.ex) * Math.min(1, dt * 14);
          look.ey += (look.ty - look.ey) * Math.min(1, dt * 14);
          head.quaternion.multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(look.pitch * 0.9, look.yaw, 0, "YXZ")));
        }
        if (hips) {
          const k = 1 + agentLevel * 0.035;
          hips.scale.set(hipsScale.x / Math.sqrt(k), hipsScale.y * k, hipsScale.z / Math.sqrt(k));
        }
        blinkT += dt;
        if (blinkT > 3.2) blinkT = 0;
        setBlink(blinkT < 0.16 ? Math.abs(Math.cos((blinkT / 0.16) * Math.PI)) : 1, look.ex, look.ey);
        renderer.render(scene, cam);
      }
    };
    resize();
    if (reduceMotion) drawStatic();
    else raf = requestAnimationFrame(frame);

    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("pointermove", onLook);
      scene.traverse((o) => {
        const m = o as THREE.Mesh;
        if (m.isMesh) {
          m.geometry.dispose();
          (m.material as THREE.MeshStandardMaterial).map?.dispose();
          (m.material as THREE.Material).dispose();
        }
      });
      scene.environment?.dispose();
      renderer?.dispose();
    };
  }, [levels, reduceMotion]);

  return (
    <div
      ref={host}
      className={`${className ?? ""} cursor-pointer select-none rounded-full outline-none focus-visible:ring-2 focus-visible:ring-accent`}
      role={full ? "dialog" : "button"}
      aria-modal={full || undefined}
      tabIndex={full ? -1 : 0}
      aria-label={full ? "Call with Maoshi" : "Talk to Maoshi, our AI voice agent"}
      onClick={() => !full && toggle()}
      onKeyDown={(e) => {
        if (!full && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          toggle();
        }
      }}
      style={
        full
          ? { position: "fixed", inset: 0, zIndex: 1000, borderRadius: 0, background: "#080808", animation: reduceMotion ? undefined : "orb-bg-in .6s ease-out" }
          : { overflow: "visible", touchAction: "manipulation" }
      }
    >
      {/* disc box: 2R, centred; the glow overflows it on purpose */}
      <div
        ref={stage}
        className="pointer-events-none absolute left-1/2 top-1/2 aspect-square w-[68%] -translate-x-1/2 -translate-y-1/2"
        style={{ ["--R" as string]: "100px", ...(full ? { width: "min(56vh, 86vw)", top: "44%" } : null) }}
      >
        <div ref={pane} className="absolute inset-0 will-change-transform">
          {/* 1. glow behind the glass */}
          <div ref={glow} className={abs} style={{ filter: "blur(calc(var(--R) * .15))", opacity: 0.95 }}>
            {INK.map(([col, , , , , ], i) => (
              <span
                key={col}
                ref={(n) => {
                  blobs.current[i] = n;
                }}
                className="absolute rounded-full will-change-transform"
                style={{ left: "0%", top: "0%", width: "100%", height: "100%", background: col, transform: "scale(0)" }}
              />
            ))}
          </div>
          {/* 2. soft shadow */}
          <span
            className={abs}
            style={{ background: "#060d24", opacity: 0.55, filter: "blur(calc(var(--R) * .11))", transform: "translateY(calc(var(--R) * .09)) scale(.98)" }}
          />
          {/* 3. the pane: frost over the glow */}
          <div
            className={`${abs} overflow-hidden`}
            style={{
              background: "rgba(22,24,30,.42)",
              WebkitBackdropFilter: "blur(calc(var(--R) * .32)) saturate(1.1)",
              backdropFilter: "blur(calc(var(--R) * .32)) saturate(1.1)",
            }}
          >
            <span className={abs} style={{ background: "#101216", opacity: 0.35, mixBlendMode: "multiply" }} />
            <span className={abs} style={{ background: "linear-gradient(180deg,rgba(255,255,255,.16),rgba(255,255,255,0) 50%,rgba(255,255,255,.03))" }} />
            <span className={abs} style={{ backgroundImage: GRAIN, backgroundSize: "200px", opacity: 0.05 }} />
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                ref={(n) => {
                  rings.current[i] = n;
                }}
                className={abs}
                style={{ border: "calc(var(--R) * .05) solid #fff", filter: "blur(calc(var(--R) * .033))", opacity: 0 }}
              />
            ))}
          </div>
          {/* 4. Maoshi, clipped just inside the lit edge */}
          <canvas
            ref={canvas}
            className="absolute inset-0 h-full w-full"
            style={{ clipPath: "circle(49.35%)", display: noGL ? "none" : "block" }}
          />
          {/* 5. glass sheen over him */}
          <span
            className={abs}
            style={{
              background: "linear-gradient(180deg,rgba(255,255,255,.34) 0%,transparent 42%,transparent 78%,rgba(255,255,255,.14) 100%)",
              boxShadow: "inset 0 0 calc(var(--R) * .2) rgba(255,255,255,.22)",
            }}
          />
          {/* 6. lit edge */}
          <span
            className={abs}
            style={{
              border: "calc(var(--R) * .01) solid transparent",
              background: "linear-gradient(180deg,rgba(255,255,255,.98),rgba(255,255,255,.14)) border-box",
              WebkitMask: "linear-gradient(#000 0 0) padding-box, linear-gradient(#000 0 0)",
              WebkitMaskComposite: "xor",
              mask: "linear-gradient(#000 0 0) padding-box exclude, linear-gradient(#000 0 0)",
            }}
          />
        </div>
      </div>
      {full && (
        <div className="absolute inset-x-0 bottom-[8vh] flex flex-col items-center gap-4" style={{ animation: reduceMotion ? undefined : "orb-full-in .5s ease-out .45s both" }}>
          <p role="status" aria-live="polite" className="font-mono text-xs uppercase tracking-[0.16em] text-white/70">
            {status === "live" ? "Live. Say hello" : "Connecting…"}
          </p>
          <button
            type="button"
            autoFocus
            onClick={stop}
            className="inline-flex h-12 items-center justify-center rounded-full bg-red-600 px-6 text-[0.95rem] font-medium text-white transition-colors hover:bg-red-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
          >
            End call
          </button>
        </div>
      )}
    </div>
  );
}
