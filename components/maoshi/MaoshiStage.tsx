'use client';
/* MaoshiStage — mount ONCE in app/layout.tsx (inside <body>, after the page content).
 * Reads two kinds of anchors from the DOM:
 *   data-maoshi-anchor="hero"  → the box Maoshi stands in on pages that have one (replaces the old orb)
 *   data-maoshi-anchor="grip"  → the element he hangs from when scrolled (the logo; he grips its bottom edge)
 * Buttons with data-maoshi-point make him point when hovered.
 */
import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import type { MaoshiEngine, Placement } from './maoshi-engine';
import { GRIP } from './maoshi-engine';
import { maoshi } from './maoshi';

const MODEL_URL = '/maoshi/maoshi.glb';
const HANG_H = { desktop: 74, mobile: 56 };      // px height while hanging
const HANG_OFFSET_X = 34;                         // px right of the logo's right edge
const SCROLL_TO_HANG = 0.35;                      // fraction of the hero height scrolled before he jumps up
const VOICE_PATH = '/voice-agent';

export default function MaoshiStage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hitRef = useRef<HTMLButtonElement>(null);
  const engineRef = useRef<MaoshiEngine | null>(null);
  const pathname = usePathname();
  const [talkOpen, setTalkOpen] = useState(false);

  // boot the engine lazily after first paint
  useEffect(() => {
    let cancelled = false;
    const start = async () => {
      const { MaoshiEngine } = await import('./maoshi-engine');
      if (cancelled || !canvasRef.current) return;
      const e = new MaoshiEngine(canvasRef.current);
      e.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      e.onFrame = (b) => { const h = hitRef.current; if (h) Object.assign(h.style, { left: `${b.x}px`, top: `${b.y}px`, width: `${b.w}px`, height: `${b.h}px` }); };
      await e.load(MODEL_URL);
      if (cancelled) { e.destroy(); return; }
      engineRef.current = e; maoshi._attach(e);
      // first visit greeting
      try { if (!sessionStorage.getItem('maoshi-hi')) { sessionStorage.setItem('maoshi-hi', '1'); e.play('PopIn', 'Wave'); } } catch { e.play('Wave'); }
    };
    const id = 'requestIdleCallback' in window ? (window as any).requestIdleCallback(start, { timeout: 1500 }) : setTimeout(start, 300);
    return () => { cancelled = true; ('cancelIdleCallback' in window) ? (window as any).cancelIdleCallback(id) : clearTimeout(id); engineRef.current?.destroy(); maoshi._attach(null); };
  }, []);

  useEffect(() => maoshi.onTalkChange(setTalkOpen), []);

  // placement + mode, recomputed every frame from anchors (cheap: 2 rects)
  useEffect(() => {
    let raf = 0;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      const e = engineRef.current; if (!e) return;
      const mobile = window.innerWidth < 768;
      const hero = document.querySelector<HTMLElement>('[data-maoshi-anchor="hero"]');
      const grip = document.querySelector<HTMLElement>('[data-maoshi-anchor="grip"]');
      let mode: 'hero' | 'hang' | 'immersive';
      let place: Placement;
      if (maoshi.isTalkOpen()) {
        mode = 'immersive';
        const h = Math.min(window.innerHeight * 0.6, 560);
        place = { x: window.innerWidth / 2, footY: window.innerHeight / 2 + h * 0.45, h };
      } else {
        const hr = hero?.getBoundingClientRect();
        const scrolledPast = !hr || hr.top < -hr.height * SCROLL_TO_HANG || hr.bottom < 80 || hr.top > window.innerHeight;
        if (hr && !scrolledPast) {
          mode = 'hero';
          const h = Math.min(hr.height * 0.9, hr.width * 1.15);
          place = { x: hr.left + hr.width / 2, footY: hr.bottom - hr.height * 0.04, h };
        } else {
          mode = 'hang';
          const g = grip?.getBoundingClientRect();
          const h = mobile ? HANG_H.mobile : HANG_H.desktop;
          const gx = g ? g.right + HANG_OFFSET_X : window.innerWidth - 60;
          const gy = g ? g.bottom - 2 : 56;
          place = { x: gx, footY: gy + GRIP * h, h };
        }
      }
      e.setMode(mode);
      e.setPlacement(place);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  // route changes: voice-agent page gets the boxing entrance; other pages a small hello
  useEffect(() => {
    const e = engineRef.current; if (!e) return;
    if (pathname === VOICE_PATH) {
      e.heroClip = 'BoxReady';
      e.play('BoxingIntro');
      const t = setTimeout(() => { e.heroClip = 'Idle'; e.play('Happy'); }, 9000); // settle after the show
      return () => clearTimeout(t);
    }
    e.heroClip = 'Idle';
    e.play(document.querySelector('[data-maoshi-anchor="hero"]') ? 'Hop' : 'HangWave');
  }, [pathname]);

  // hover → point (works in both stances)
  useEffect(() => {
    const over = (ev: Event) => {
      const el = (ev.target as HTMLElement).closest?.('[data-maoshi-point]'); const e = engineRef.current;
      if (!el || !e || e.voice !== 'off') return;
      e.play(e.mode === 'hang' ? 'HangPoint' : 'Point');
    };
    const out = (ev: Event) => { if ((ev.target as HTMLElement).closest?.('[data-maoshi-point]')) engineRef.current?.release(); };
    document.addEventListener('pointerover', over); document.addEventListener('pointerout', out);
    return () => { document.removeEventListener('pointerover', over); document.removeEventListener('pointerout', out); };
  }, []);

  // Esc closes the immersive talk view
  useEffect(() => {
    if (!talkOpen) return;
    const k = (ev: KeyboardEvent) => { if (ev.key === 'Escape') maoshi.closeTalk(); };
    window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k);
  }, [talkOpen]);

  return (
    <>
      {/* immersive backdrop sits under the canvas */}
      <div aria-hidden onClick={() => maoshi.closeTalk()}
        style={{ position: 'fixed', inset: 0, zIndex: 59, background: 'radial-gradient(ellipse at 50% 55%, rgba(41,182,232,.14), rgba(8,8,8,.92) 60%)',
          backdropFilter: talkOpen ? 'blur(10px)' : 'none', opacity: talkOpen ? 1 : 0, pointerEvents: talkOpen ? 'auto' : 'none', transition: 'opacity .45s ease' }} />
      <canvas ref={canvasRef} aria-hidden
        style={{ position: 'fixed', inset: 0, width: '100vw', height: '100vh', zIndex: 60, pointerEvents: 'none' }} />
      <button ref={hitRef} type="button" aria-label="Talk to Maoshi"
        onClick={() => (maoshi.isTalkOpen() ? null : maoshi.openTalk())}
        style={{ position: 'fixed', zIndex: 61, background: 'transparent', border: 0, padding: 0, cursor: 'pointer', borderRadius: 24 }} />
      {talkOpen && (
        <button type="button" onClick={() => maoshi.closeTalk()} aria-label="End conversation"
          style={{ position: 'fixed', zIndex: 62, left: '50%', bottom: 'calc(env(safe-area-inset-bottom,0px) + 40px)', transform: 'translateX(-50%)',
            padding: '12px 22px', borderRadius: 999, border: '1px solid rgba(255,255,255,.2)', background: 'rgba(255,255,255,.06)', color: '#fff', cursor: 'pointer' }}>
          End conversation
        </button>
      )}
    </>
  );
}
