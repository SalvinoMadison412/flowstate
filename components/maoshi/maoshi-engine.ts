/* maoshi-engine.ts — framework-free three.js engine for the Maoshi mascot.
 * One full-viewport transparent canvas, orthographic camera in CSS pixels.
 * The React side only tells it WHERE to stand (screen rects), WHICH mode it is in,
 * and the voice state / audio levels. Everything else (clips, blinking, looking,
 * swinging, squash) happens here.
 */
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

export type VoiceState = 'off' | 'connecting' | 'listening' | 'thinking' | 'speaking';
export type Mode = 'hero' | 'lean' | 'immersive';
/** Where Maoshi should stand, in viewport CSS px: x = centre, footY = feet baseline (from top), h = model height. */
export type Placement = { x: number; footY: number; h: number; flip?: boolean };
export type FrameInfo = { x: number; y: number; w: number; h: number }; // screen box around the model, for the hit-target button

/** Cursor tracking pauses while scrolling and resumes this long after the last scroll event. */
const TRACK_RESUME_MS = 1000;

/** Played when he goes from the nav back to the hero (scroll up): a simple hop. */
const BACK_TO_HERO = 'Hop';

const LOOPING = new Set(['Idle', 'Listen', 'Think', 'Talk', 'BoxReady', 'LeanIdle']);
const HOLD_LAST_FRAME = new Set(['Point', 'LeanPoint', 'LeanPointNear']);

export class MaoshiEngine {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private cam = new THREE.OrthographicCamera(0, 1, 0, -1, 0.1, 4000);
  private pivot = new THREE.Group();          // sits at the feet
  private body = new THREE.Group();           // the model, feet at local origin, scaled to px height
  private mixer?: THREE.AnimationMixer;
  private actions: Record<string, THREE.AnimationAction> = {};
  private current?: THREE.AnimationAction;
  private queue: string[] = [];
  private bones: Record<string, THREE.Bone> = {};
  private eyes: { o: THREE.Object3D; s: THREE.Vector3; p: THREE.Vector3 }[] = [];
  private clean = new Map<THREE.Object3D, { q: THREE.Quaternion; s: THREE.Vector3 }>();
  private rim = new THREE.PointLight(0x29b6e8, 0, 0, 0);
  private clock = new THREE.Clock();
  private raf = 0;
  private alive = true;

  mode: Mode = 'hero';
  voice: VoiceState = 'off';
  agentLevel = 0;            // 0..1, agent's output volume (drive while speaking)
  userLevel = 0;             // 0..1, mic volume (drive while listening)
  heroClip = 'Idle';         // base loop for hero mode (voice-agent page sets 'BoxReady' for a while)
  reducedMotion = false;
  onFrame?: (box: FrameInfo) => void;

  private target: Placement = { x: -999, footY: -999, h: 1 };
  private pos = { x: -999, y: -999, h: 1, vx: 0, vy: 0, vh: 0 };
  private snapNext = true; private springT = 0;   // spring only for a moment after a mode change, otherwise follow the anchor exactly (no jiggle while scrolling)
  private mir = 1;                                 // 1 = normal, -1 = mirrored (leaning on a logo that is to his right)
  private mouse = { x: 0, y: 0 };
  private look = { yaw: 0, pitch: 0, ex: 0, ey: 0, body: 0 };
  private lastScrollAt = -1e9;
  private blinkIn = 1.5; private blinkT = 9; private blinkTwice = false;
  private agentSm = 0;

  constructor(private canvas: HTMLCanvasElement) {
    this.renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping; this.renderer.toneMappingExposure = 0.9;
    const pm = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture;
    this.scene.add(new THREE.HemisphereLight(0xffffff, 0x1a1d22, 0.5));
    const key = new THREE.DirectionalLight(0xffffff, 1.1); key.position.set(300, 500, 600); this.scene.add(key);
    this.cam.position.z = 2000;
    this.pivot.add(this.body); this.scene.add(this.pivot);
    this.body.add(this.rim); this.rim.position.set(0, 0.9, -0.8);
        window.addEventListener('pointermove', this.onPointer, { passive: true });
    window.addEventListener('scroll', this.onScroll, { passive: true });
    window.addEventListener('resize', this.resize);
    this.resize();
  }

  async load(url: string) {
    const gltf = await new GLTFLoader().loadAsync(url);
    const root = gltf.scene;
    root.traverse((o) => {
      if ((o as THREE.Bone).isBone) this.bones[o.name.replace('mixamorig', '')] = o as THREE.Bone; // names arrive as mixamorigHead etc.
      const m = o as THREE.Mesh;
      if (m.isMesh) {
        m.frustumCulled = false;
        const mat = m.material as THREE.MeshStandardMaterial;
        mat.envMapIntensity = o.name.startsWith('Eye') ? 1.4 : 0.6;
      }
      if (/^Eye_[LR]$/.test(o.name)) this.eyes.push({ o, s: o.scale.clone(), p: o.position.clone() });
    });
    this.body.add(root);
    this.mixer = new THREE.AnimationMixer(root);
    for (const clip of gltf.animations) {
      const a = this.mixer.clipAction(clip);
      if (!LOOPING.has(clip.name)) { a.setLoop(THREE.LoopOnce, 1); a.clampWhenFinished = true; }
      this.actions[clip.name] = a;
    }
    this.mixer.addEventListener('finished', (e) => {
      const name = (e.action as THREE.AnimationAction).getClip().name;
      if (HOLD_LAST_FRAME.has(name) && !this.queue.length) return; // stays until next command
      this.next();
    });
    this.toBase(0);
    this.raf = requestAnimationFrame(this.tick);
  }

  /* ---------------- public API ---------------- */
  setPlacement(p: Placement, snap = false) { this.target = p; if (snap) this.snapNext = true; }
  /** Play clips in sequence, then return to the base loop. */
  play(...names: string[]) { this.queue = names.filter((n) => this.actions[n]); this.next(0.2); }
  setMode(m: Mode) {
    if (m === this.mode) return;
    const from = this.mode; this.mode = m; this.springT = 1;
    if (from === 'hero' && m === 'lean') this.play('LeanEnter');
    else if (from === 'lean' && m === 'hero') this.play(BACK_TO_HERO);
    else if (m === 'immersive') this.play('BoxOpen');
    else if (from === 'immersive') this.play(m === 'lean' ? 'LeanWave' : 'Wave');
    else this.toBase();
  }
  setVoice(v: VoiceState) { if (v === this.voice) return; const was = this.voice; this.voice = v; if (v === 'off' && was !== 'off') this.play(this.mode === 'lean' ? 'LeanWave' : 'Wave'); else this.toBase(); }
  get flipped() { return this.mir < 0; }
  /** Release a held pose (Point / LeanPoint / LeanPointNear). */
  release() { if (this.current && HOLD_LAST_FRAME.has(this.current.getClip().name)) this.toBase(); }
  destroy() {
    this.alive = false; cancelAnimationFrame(this.raf);
    window.removeEventListener('pointermove', this.onPointer); window.removeEventListener('scroll', this.onScroll); window.removeEventListener('resize', this.resize);
    this.renderer.dispose();
  }

  /* ---------------- clip plumbing ---------------- */
  private baseClip() {
    if (this.voice === 'connecting' || this.voice === 'listening') return this.mode === 'lean' ? 'LeanIdle' : 'Listen';
    if (this.voice === 'thinking') return this.mode === 'lean' ? 'LeanIdle' : 'Think';
    if (this.voice === 'speaking') return this.mode === 'lean' ? 'LeanIdle' : 'Talk';
    if (this.mode === 'lean') return 'LeanIdle';
    if (this.mode === 'immersive') return 'Listen';
    return this.heroClip;
  }
  private next(fade = 0.25) { const n = this.queue.shift(); n ? this.fadeTo(n, fade) : this.toBase(); }
  private toBase(fade = 0.35) { this.queue = []; this.fadeTo(this.baseClip(), fade); }
  private fadeTo(name: string, fade: number) {
    const a = this.actions[name]; if (!a) return;
    if (a === this.current && LOOPING.has(name)) return;
    a.reset().setEffectiveWeight(1).setEffectiveTimeScale(1).play();
    if (this.current && this.current !== a) this.current.crossFadeTo(a, this.reducedMotion ? 0.05 : fade, false);
    this.current = a;
  }

  /* ---------------- input ---------------- */
  private onPointer = (e: PointerEvent) => { this.mouse.x = e.clientX; this.mouse.y = e.clientY; };
  private onScroll = () => { this.lastScrollAt = performance.now(); };
  private resize = () => {
    const w = window.innerWidth, h = window.innerHeight;
    this.renderer.setSize(w, h, false);
    Object.assign(this.cam, { left: 0, right: w, top: 0, bottom: -h }); this.cam.updateProjectionMatrix();
  };

  /* ---------------- per-frame ---------------- */
  private remember(o?: THREE.Object3D) { if (!o) return; let v = this.clean.get(o); if (!v) { v = { q: new THREE.Quaternion(), s: new THREE.Vector3() }; this.clean.set(o, v); } v.q.copy(o.quaternion); v.s.copy(o.scale); }
  private addRot(b: THREE.Object3D | undefined, x: number, y: number, z: number) { if (b) b.quaternion.multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(x, y, z, 'YXZ'))); }

  private tick = () => {
    if (!this.alive) return;
    this.raf = requestAnimationFrame(this.tick);
    if (document.hidden || !this.mixer) return;
    const dt = Math.min(this.clock.getDelta(), 0.05), t = this.clock.elapsedTime, rm = this.reducedMotion;

    // 1) placement spring (slight overshoot = "jump" feel). Snap on first frame / when asked.
    const T = this.target, P = this.pos;
    this.springT -= dt;
    if (this.snapNext || rm || this.springT <= 0) { P.x = T.x; P.y = T.footY; P.h = T.h; P.vx = P.vy = P.vh = 0; this.snapNext = false; }
    const k = 90, d = 14;
    P.vx += ((T.x - P.x) * k - P.vx * d) * dt; P.x += P.vx * dt;
    P.vy += ((T.footY - P.y) * k - P.vy * d) * dt; P.y += P.vy * dt;
    P.vh += ((T.h - P.h) * k - P.vh * d) * dt; P.h += P.vh * dt;

    this.pivot.position.set(P.x, -P.y, 0);
    this.mir += ((T.flip ? -1 : 1) - this.mir) * Math.min(1, dt * (rm ? 60 : 10));   // turns around through a thin squash
    const m = this.mir < 0 ? -1 : 1, sx = Math.abs(this.mir) < 0.06 ? 0.06 * m : this.mir, H = Math.max(P.h, 1);
    this.body.scale.set(H * sx, H, H);

    // 3) animation, then additive layers on a restored clean pose
    this.clean.forEach((v, o) => { o.quaternion.copy(v.q); o.scale.copy(v.s); });
    this.agentSm += ((this.voice === 'speaking' ? this.agentLevel : 0) - this.agentSm) * Math.min(1, dt * 14);
    if (this.current?.getClip().name === 'Talk') this.current.setEffectiveTimeScale(0.7 + this.agentSm * 0.9);
    this.mixer.update(dt);
    const B = this.bones;
    ['Hips', 'Spine', 'Spine1', 'Spine2', 'Head'].forEach((n) => this.remember(B[n]));

    // look at cursor (eyes lead, head follows, body last); in immersive look at the viewer
    const headX = P.x, headY = P.y - P.h * 0.78;
    // cursor tracking pauses while the page is scrolling (look straight ahead, slightly down), resumes TRACK_RESUME_MS after it stops
    const tracking = performance.now() - this.lastScrollAt > TRACK_RESUME_MS;
    const mx = this.mode === 'immersive' || !tracking ? headX : this.mouse.x, my = this.mode === 'immersive' ? headY + 40 : !tracking ? headY + 60 : this.mouse.y;
    const dx = mx - headX, dy = my - headY, a = Math.min(1, dt * 5);
    const wantYaw = THREE.MathUtils.clamp(dx / 700, -1, 1) * 0.45, wantPitch = THREE.MathUtils.clamp(dy / 500, -1, 1) * 0.28;
    this.look.ex += (THREE.MathUtils.clamp(dx / 900, -1, 1) - this.look.ex) * Math.min(1, dt * 14);
    this.look.ey += (THREE.MathUtils.clamp(dy / 600, -1, 1) - this.look.ey) * Math.min(1, dt * 14);
    this.look.yaw += (wantYaw - this.look.yaw) * a; this.look.pitch += (wantPitch - this.look.pitch) * a;
    this.look.body += (wantYaw * 0.35 - this.look.body) * Math.min(1, dt * 2);
    const listenNod = this.voice === 'listening' ? this.userLevel * 0.15 : 0;
    this.addRot(B.Spine2, 0, this.look.body * m, 0);
    this.addRot(B.Head, this.look.pitch * 0.9 + listenNod, this.look.yaw * m, Math.sin(t * 0.7) * 0.02 * m);   // yaw/roll flip sign under the mirror

    // speaking: squash/stretch bounce + cyan rim light
    const s = 1 + this.agentSm * 0.035;
    B.Hips?.scale.multiply(new THREE.Vector3(1 / Math.sqrt(s), s, 1 / Math.sqrt(s)));
    this.rim.intensity = this.voice === 'speaking' ? 1.2 + this.agentSm * 4 : this.voice === 'off' ? 0 : 0.6 + Math.sin(t * 2) * 0.3;

    // blink (random 2–6 s, sometimes double) — eyes are separate meshes, squash them vertically
    this.blinkIn -= dt; if (this.blinkIn <= 0) { this.blinkT = 0; this.blinkIn = 2 + Math.random() * 4; this.blinkTwice = Math.random() < 0.25; }
    this.blinkT += dt;
    let open = 1;
    if (this.blinkT < 0.16) open = Math.abs(Math.cos((this.blinkT / 0.16) * Math.PI));
    else if (this.blinkTwice && this.blinkT > 0.2 && this.blinkT < 0.36) open = Math.abs(Math.cos(((this.blinkT - 0.2) / 0.16) * Math.PI));
    const widen = 1 + (this.voice === 'listening' ? 0.06 : 0) + this.agentSm * 0.05;
    for (const e of this.eyes) {
      e.o.scale.set(e.s.x * widen, e.s.y * Math.max(0.06, open) * widen, e.s.z * widen);
      e.o.position.set(e.p.x + this.look.ex * 0.012 * m, e.p.y - this.look.ey * 0.01, e.p.z);
    }

    this.renderer.render(this.scene, this.cam);
    this.onFrame?.({ x: P.x - P.h * 0.35, y: P.y - P.h, w: P.h * 0.7, h: P.h });
  };
}
