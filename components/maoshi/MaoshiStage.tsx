'use client';
/* MaoshiStage — mount ONCE in app/layout.tsx (inside <body>, after the page content).
 * Reads two kinds of anchors from the DOM:
 *   data-maoshi-anchor="hero"  → the box Maoshi stands in on pages that have one (replaces the old orb)
 *   data-maoshi-anchor="grip"  → the nav logo; when scrolled he stands beside it, leaning on it with arms crossed
 * Buttons with data-maoshi-point make him point when hovered.
 */
import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import type { MaoshiEngine, Placement } from './maoshi-engine';
import { maoshi } from './maoshi';

const MODEL_URL = '/maoshi/maoshi.glb';
const LEAN_MAX_H = 76;                            // px, tallest he gets while leaning (capped by nav height)
const LEAN_GAP = 0.3;                             // × his height: how far right of the logo's edge he stands (lower = closer)
const IDLE_MS = 25000;                            // no input for this long → "need a hand?" bubble
const BUBBLE_MS = 14000;                          // bubble auto-hides after this
const SCROLL_TO_LEAN = 0.35;                      // fraction of the hero height scrolled before he jumps up
const VOICE_PATH = '/voice-agent';

export default function MaoshiStage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hitRef = useRef<HTMLButtonElement>(null);
  const engineRef = useRef<MaoshiEngine | null>(null);
  const pathname = usePathname();
  const [talkOpen, setTalkOpen] = useState(false);
  const [help, setHelp] = useState(false);
  const bubbleRef = useRef<HTMLDivElement>(null);
  const tailRef = useRef<HTMLSpanElement>(null);
  const helpShown = useRef(new Set<string>());

  // boot the engine lazily after first paint
  useEffect(() => {
    let cancelled = false;
    const start = async () => {
      const { MaoshiEngine } = await import('./maoshi-engine');
      if (cancelled || !canvasRef.current) return;
      const e = new MaoshiEngine(canvasRef.current);
      e.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      e.onFrame = (b) => {
        const h = hitRef.current; if (h) Object.assign(h.style, { left: `${b.x}px`, top: `${b.y}px`, width: `${b.w}px`, height: `${b.h}px` });
        const bub = bubbleRef.current; if (!bub) return;
        const lean = e.mode === 'lean', w = bub.offsetWidth;
        const left = lean ? b.x - 8 : b.x + b.w + 10;
        bub.style.left = `${Math.max(12, Math.min(left, window.innerWidth - w - 12))}px`;
        bub.style.top = `${lean ? b.y + b.h + 12 : b.y + b.h * 0.1}px`;
        const tail = tailRef.current; if (tail) tail.style.display = lean ? 'block' : 'none';
      };
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
            const hero = document.querySelector<HTMLElement>('[data-maoshi-anchor="hero"]');
      const grip = document.querySelector<HTMLElement>('[data-maoshi-anchor="grip"]');
      let mode: 'hero' | 'lean' | 'immersive';
      let place: Placement;
      if (maoshi.isTalkOpen()) {
        mode = 'immersive';
        const h = Math.min(window.innerHeight * 0.6, 560);
        place = { x: window.innerWidth / 2, footY: window.innerHeight / 2 + h * 0.45, h };
      } else {
        const hr = hero?.getBoundingClientRect();
        const scrolledPast = !hr || hr.top < -hr.height * SCROLL_TO_LEAN || hr.bottom < 80 || hr.top > window.innerHeight;
        if (hr && !scrolledPast) {
          mode = 'hero';
          const h = Math.min(hr.height * 0.9, hr.width * 1.15);
          place = { x: hr.left + hr.width / 2, footY: hr.bottom - hr.height * 0.04, h };
        } else {
          mode = 'lean';
          const g = grip?.getBoundingClientRect();
          const nav = grip?.closest('header, nav')?.getBoundingClientRect();
          const h = Math.max(44, Math.min(LEAN_MAX_H, (nav ? nav.height : 64) - 8));
          const gx = g ? g.right + h * LEAN_GAP : window.innerWidth - 60;
          const gy = nav ? nav.bottom - 3 : g ? g.bottom + 8 : 60;   // feet rest on the nav's bottom edge
          place = { x: gx, footY: gy, h };
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
    e.play(document.querySelector('[data-maoshi-anchor="hero"]') ? 'Hop' : 'LeanWave');
  }, [pathname]);

  // hover → point (works in both stances)
  useEffect(() => {
    const over = (ev: Event) => {
      const el = (ev.target as HTMLElement).closest?.('[data-maoshi-point]'); const e = engineRef.current;
      if (!el || !e || e.voice !== 'off') return;
      e.play(e.mode === 'lean' ? 'LeanPoint' : 'Point');
    };
    const out = (ev: Event) => { if ((ev.target as HTMLElement).closest?.('[data-maoshi-point]')) engineRef.current?.release(); };
    document.addEventListener('pointerover', over); document.addEventListener('pointerout', out);
    return () => { document.removeEventListener('pointerover', over); document.removeEventListener('pointerout', out); };
  }, []);

  // inactivity: after IDLE_MS without input, wave and offer help (once per page per session)
  useEffect(() => {
    setHelp(false);
    let idle: ReturnType<typeof setTimeout>, hide: ReturnType<typeof setTimeout>;
    const show = () => {
      const e = engineRef.current;
      if (!e || maoshi.isTalkOpen() || document.hidden || e.voice !== 'off') return arm();
      helpShown.current.add(pathname); setHelp(true);
      e.play(e.mode === 'lean' ? 'LeanWave' : 'Wave');
      hide = setTimeout(() => setHelp(false), BUBBLE_MS);
    };
    const arm = () => { clearTimeout(idle); if (!helpShown.current.has(pathname)) idle = setTimeout(show, IDLE_MS); };
    const active = (ev: Event) => { if (ev.type === 'scroll' || ev.type === 'keydown') setHelp(false); arm(); };
    const evs = ['pointermove', 'pointerdown', 'keydown', 'scroll', 'touchstart'];
    evs.forEach((n) => window.addEventListener(n, active, { passive: true }));
    arm();
    return () => { clearTimeout(idle); clearTimeout(hide); evs.forEach((n) => window.removeEventListener(n, active)); };
  }, [pathname]);
  useEffect(() => { if (talkOpen) setHelp(false); }, [talkOpen]);

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
      <div ref={bubbleRef} role="status" aria-live="polite"
        style={{ position: 'fixed', zIndex: 61, maxWidth: 'min(260px, calc(100vw - 24px))', padding: '12px 14px', borderRadius: 16, color: '#fff', fontSize: 14, lineHeight: 1.4,
          background: 'rgba(18,18,18,.94)', border: '1px solid rgba(255,255,255,.14)', boxShadow: '0 8px 30px rgba(0,0,0,.45)',
          opacity: help ? 1 : 0, transform: help ? 'none' : 'translateY(-6px)', pointerEvents: help ? 'auto' : 'none', transition: 'opacity .3s ease, transform .3s ease' }}>
        <span ref={tailRef} aria-hidden style={{ position: 'absolute', top: -6, left: 34, width: 12, height: 12, background: 'rgba(18,18,18,.94)', borderLeft: '1px solid rgba(255,255,255,.14)', borderTop: '1px solid rgba(255,255,255,.14)', transform: 'rotate(45deg)' }} />
        <div style={{ paddingRight: 18 }}>Need a hand? Let me know if you need any help.</div>
        <button type="button" onClick={() => { setHelp(false); maoshi.openTalk(); }} tabIndex={help ? 0 : -1}
          style={{ marginTop: 10, padding: '7px 14px', borderRadius: 999, border: 0, background: '#29b6e8', color: '#06121a', fontWeight: 600, cursor: 'pointer' }}>Talk to Maoshi</button>
        <button type="button" onClick={() => setHelp(false)} aria-label="Dismiss" tabIndex={help ? 0 : -1}
          style={{ position: 'absolute', top: 6, right: 8, border: 0, background: 'transparent', color: 'rgba(255,255,255,.6)', fontSize: 18, lineHeight: 1, cursor: 'pointer' }}>×</button>
      </div>
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
