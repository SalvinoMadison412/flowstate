/* maoshi.ts — app-wide controller. Import `maoshi` anywhere (voice widget, buttons) — no React context needed.
 * Calls made before the 3D engine has loaded are remembered and applied once it is ready. */
import type { MaoshiEngine, VoiceState } from './maoshi-engine';

type Listener = (open: boolean) => void;
let engine: MaoshiEngine | null = null;
let pendingVoice: VoiceState = 'off';
let immersive = false;
const immersiveListeners = new Set<Listener>();

export const maoshi = {
  /** internal: called by <MaoshiStage> once the engine is ready */
  _attach(e: MaoshiEngine | null) { engine = e; if (e) e.setVoice(pendingVoice); },

  /** Voice agent lifecycle → Maoshi body language. */
  setVoice(v: VoiceState) { pendingVoice = v; engine?.setVoice(v); },
  /** 0..1 loudness of the AGENT's audio (call every frame / every volume event while speaking). */
  setAgentLevel(level: number) { if (engine) engine.agentLevel = Math.max(0, Math.min(1, level)); },
  /** 0..1 loudness of the USER's mic (optional; makes him nod while listening). */
  setUserLevel(level: number) { if (engine) engine.userLevel = Math.max(0, Math.min(1, level)); },
  /** One-shot reactions: 'Happy', 'Wave', 'Nod', 'Point', 'HangPoint', 'HangPeek', ... */
  react(...clips: string[]) { engine?.play(...clips); },
  release() { engine?.release(); },

  /** Talk button: zoom Maoshi to centre stage (immersive). Close returns him to where he was. */
  openTalk() { immersive = true; immersiveListeners.forEach((l) => l(true)); },
  closeTalk() { immersive = false; immersiveListeners.forEach((l) => l(false)); },
  isTalkOpen() { return immersive; },
  onTalkChange(l: Listener) { immersiveListeners.add(l); return () => { immersiveListeners.delete(l); }; },
};
export type { VoiceState };
