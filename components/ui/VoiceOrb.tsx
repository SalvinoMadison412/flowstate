"use client";

/**
 * Interactive 3D orb (three.js). Drag to spin it, hover to tilt it, click to
 * start/stop the call. It idles with a slow breathing swell, spins up while
 * connecting, and while live its surface is displaced by the agent's voice level.
 * Loaded with dynamic({ ssr: false }); falls back to a CSS glow without WebGL.
 */
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { useVoiceCall } from "@/lib/useVoiceCall";
import { usePrefersReducedMotion } from "@/lib/useReveal";

// Shared displacement: cheap layered sines, amplitude driven by the voice level.
const DISPLACE = /* glsl */ `
  uniform float uTime;
  uniform float uAmp;
  vec3 displace(vec3 p) {
    float n = sin(p.x * 3.1 + uTime * 1.1) * sin(p.y * 3.7 - uTime * 0.9) * sin(p.z * 2.9 + uTime * 0.7);
    float m = sin(p.x * 7.0 - uTime * 2.0) * sin(p.y * 6.0 + p.z * 5.0 + uTime * 1.6);
    return p * (1.0 + uAmp * (n + 0.35 * m));
  }
`;

const BODY_VERT = /* glsl */ `
  ${DISPLACE}
  varying vec3 vNormal;
  varying vec3 vView;
  varying float vDisp;
  void main() {
    vec3 p = displace(position);
    vDisp = length(p) - 1.0;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    vNormal = normalize(normalMatrix * normalize(position));
    vView = normalize(-mv.xyz);
    gl_Position = projectionMatrix * mv;
  }
`;

const BODY_FRAG = /* glsl */ `
  uniform float uActive;
  varying vec3 vNormal;
  varying vec3 vView;
  varying float vDisp;
  void main() {
    float fres = pow(1.0 - max(dot(normalize(vNormal), normalize(vView)), 0.0), 2.4);
    vec3 deep = vec3(0.02, 0.05, 0.08);
    vec3 cyan = vec3(0.0, 0.78, 0.94);
    vec3 col = mix(deep, cyan, fres * (0.75 + uActive * 0.5));
    col += vec3(1.0) * smoothstep(0.06, 0.28, vDisp) * 0.55; // bright crests while speaking
    gl_FragColor = vec4(col, 1.0);
  }
`;

const DOT_VERT = /* glsl */ `
  ${DISPLACE}
  uniform float uSize;
  void main() {
    vec3 p = displace(position) * 1.16;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_PointSize = uSize * (1.0 / -mv.z);
    gl_Position = projectionMatrix * mv;
  }
`;

const DOT_FRAG = /* glsl */ `
  void main() {
    float d = length(gl_PointCoord - 0.5);
    if (d > 0.5) discard;
    gl_FragColor = vec4(0.55, 0.92, 1.0, (0.5 - d) * 1.1);
  }
`;

export function VoiceOrb({ className }: { className?: string }) {
  const host = useRef<HTMLDivElement>(null);
  const { status, toggle, levels } = useVoiceCall();
  const reduceMotion = usePrefersReducedMotion();
  const [noGL, setNoGL] = useState(false);
  // The render loop reads these; keeping them in refs avoids rebuilding the scene.
  const live = useRef({ status, toggle });
  live.current = { status, toggle };

  useEffect(() => {
    const el = host.current;
    if (!el) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch {
      setNoGL(true);
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    el.appendChild(renderer.domElement);
    renderer.domElement.style.cssText = "width:100%;height:100%;display:block;touch-action:pan-y;cursor:grab";

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 20);
    camera.position.z = 4.2;

    const uniforms = { uTime: { value: 0 }, uAmp: { value: 0.05 }, uActive: { value: 0 }, uSize: { value: 11 } };
    const geo = new THREE.IcosahedronGeometry(1, 24);
    const body = new THREE.Mesh(geo, new THREE.ShaderMaterial({ uniforms, vertexShader: BODY_VERT, fragmentShader: BODY_FRAG }));
    const dots = new THREE.Points(
      new THREE.IcosahedronGeometry(1, 14),
      new THREE.ShaderMaterial({
        uniforms,
        vertexShader: DOT_VERT,
        fragmentShader: DOT_FRAG,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    );
    const group = new THREE.Group();
    group.add(body, dots);
    scene.add(group);

    const resize = () => {
      const w = el.clientWidth || 1;
      const h = el.clientHeight || 1;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    const ro = new ResizeObserver(resize);
    ro.observe(el);
    resize();

    // ── interaction: drag to spin (with inertia), hover to tilt, click to toggle
    let dragging = false;
    let moved = 0;
    let lastX = 0;
    let lastY = 0;
    let velX = 0;
    let velY = 0;
    let tiltX = 0;
    let tiltY = 0;
    const cv = renderer.domElement;
    const onDown = (e: PointerEvent) => {
      dragging = true;
      moved = 0;
      lastX = e.clientX;
      lastY = e.clientY;
      cv.setPointerCapture(e.pointerId);
      cv.style.cursor = "grabbing";
    };
    const onMove = (e: PointerEvent) => {
      const r = cv.getBoundingClientRect();
      tiltY = ((e.clientX - r.left) / r.width - 0.5) * 0.6;
      tiltX = ((e.clientY - r.top) / r.height - 0.5) * 0.6;
      if (!dragging) return;
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      moved += Math.abs(dx) + Math.abs(dy);
      velY = dx * 0.006;
      velX = dy * 0.006;
      group.rotation.y += velY;
      group.rotation.x += velX;
      lastX = e.clientX;
      lastY = e.clientY;
    };
    const onUp = () => {
      dragging = false;
      cv.style.cursor = "grab";
      if (moved < 6) live.current.toggle(); // a click, not a drag
    };
    const onLeave = () => {
      tiltX = tiltY = 0;
    };
    cv.addEventListener("pointerdown", onDown);
    cv.addEventListener("pointermove", onMove);
    cv.addEventListener("pointerup", onUp);
    cv.addEventListener("pointercancel", onUp);
    cv.addEventListener("pointerleave", onLeave);

    // ── loop (paused while offscreen)
    let visible = true;
    const io = new IntersectionObserver(([en]) => (visible = en.isIntersecting));
    io.observe(el);
    let raf = 0;
    let last = performance.now();
    let amp = 0.05;
    let active = 0;
    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      if (!visible) return;
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      const st = live.current.status;
      const lv = levels.current;
      const level = Math.max(lv.agent, lv.mic * 0.5);

      const targetAmp =
        st === "live" ? 0.05 + level * 0.55 : st === "connecting" ? 0.11 + Math.sin(now / 160) * 0.03 : 0.05 + Math.sin(now / 900) * 0.015;
      amp += (targetAmp - amp) * 0.2;
      active += ((st === "live" ? 1 : 0) - active) * 0.08;
      uniforms.uAmp.value = amp;
      uniforms.uActive.value = active;
      uniforms.uTime.value += dt * (st === "connecting" ? 2.4 : 0.7 + active * 0.8);

      if (!dragging) {
        velX *= 0.94;
        velY *= 0.94;
        group.rotation.y += velY + dt * (st === "connecting" ? 0.9 : 0.18);
        group.rotation.x += velX;
      }
      // ease the hover tilt on the camera so it never fights the drag rotation
      camera.position.x += (tiltY * 1.4 - camera.position.x) * 0.06;
      camera.position.y += (tiltX * 1.4 - camera.position.y) * 0.06;
      camera.lookAt(0, 0, 0);
      renderer.render(scene, camera);
    };
    if (reduceMotion) {
      renderer.render(scene, camera); // one static frame
    } else {
      raf = requestAnimationFrame(frame);
    }

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      cv.removeEventListener("pointerdown", onDown);
      cv.removeEventListener("pointermove", onMove);
      cv.removeEventListener("pointerup", onUp);
      cv.removeEventListener("pointercancel", onUp);
      cv.removeEventListener("pointerleave", onLeave);
      geo.dispose();
      dots.geometry.dispose();
      (body.material as THREE.Material).dispose();
      (dots.material as THREE.Material).dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [levels, reduceMotion]);

  return (
    <div
      ref={host}
      className={className}
      role="button"
      aria-label={status === "live" ? "End call with Maoshi" : "Talk to Maoshi, our AI voice agent"}
    >
      {noGL && (
        <div className="h-full w-full rounded-full bg-[radial-gradient(circle,rgba(0,200,240,0.5),rgba(0,200,240,0.05)_60%,transparent_70%)]" />
      )}
    </div>
  );
}
