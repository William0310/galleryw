// One WebGL canvas for the whole home page. Every photo on the page is an empty DOM box;
// this layer draws a plane exactly over each visible box and reveals it with the
// signature effect of its album, so the home page previews each album's character:
//   0 tile    – hero contact strip: monochrome until touched
//   1 mirror  – Qinghai: opens outward from the horizon line, water ripples
//   2 frost   – Lijiang: crystallises in, icy edge, sparkles on hover
//   3 slit    – Xinjiang: cinema letterbox opening, light streak under the pointer
//   4 ink     – Japan: bleeds in like ink on washi
//   5 scroll  – Beijing: unrolls from the top with a gold edge, gilded glints
//   6 candle  – Datong: a dark hall lit by a moving light, then daylight
//   7 neon    – Chongqing: stepped scanline power-on, RGB split
// The DOM keeps layout, links and accessibility; GSAP drives the boxes and `uReveal`.
import { THREE, createRenderer, loadTexture, glsl } from './common.js';
import { env, damp } from '../core/env.js';
import { gsap, scroll } from '../core/scroll.js';

export const FX = { tile: 0, mirror: 1, frost: 2, slit: 3, ink: 4, scroll: 5, candle: 6, neon: 7 };

const vert = /* glsl */ `
  uniform float uVel, uHover, uExpand;
  uniform vec2 uMouse;
  varying vec2 vUv;
  #define PI 3.14159265
  void main() {
    vUv = uv;
    vec3 p = position;
    float k = 1.0 - uExpand;
    p.y += sin(uv.x * PI) * uVel * 0.08 * k;               // bow against the scroll
    p.z += sin(uv.y * PI) * abs(uVel) * 26.0 * k;            // pixels (scale.z = 1)
    p.z += uHover * smoothstep(0.65, 0.0, distance(uv, uMouse)) * 30.0 * k;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`;

const frag = /* glsl */ `
  precision highp float;
  uniform sampler2D tMap;
  uniform float uAr, uPlaneAr, uTime, uReveal, uFade, uHover, uVel, uExpand, uFx, uGray, uAmb, uSeed;
  uniform vec2 uFocus, uMouse, uLight;
  varying vec2 vUv;
  ${glsl.cover}
  ${glsl.noise}
  ${glsl.luma}
  vec3 tex(vec2 uv) { return texture2D(tMap, coverUv(uv, vec2(uPlaneAr, 1.0), uAr, uFocus)).rgb; }
  // t: per-pixel threshold in [0,1]; r: progress. 0 → hidden, 1 → fully shown.
  float wipe(float t, float r, float soft) { return smoothstep(t - soft, t + soft, r * (1.0 + 2.0 * soft) - soft); }
  float edge(float t, float r, float w, float soft) { float x = r * (1.0 + 2.0 * soft) - soft; return smoothstep(w, 0.0, abs(x - t)) * step(0.001, r) * step(r, 0.999); }

  void main() {
    vec2 uv = vUv;
    vec2 asp = vec2(uPlaneAr, 1.0);
    float k = 1.0 - uExpand;
    float h = uHover * k;
    float r = max(uReveal * (1.0 - uFade), uExpand);
    int fx = int(uFx + 0.5);
    vec2 zuv = (uv - 0.5) * (1.0 - h * 0.05) + 0.5;
    float n = fbm(uv * asp * 2.6 + uSeed);
    vec3 col;
    float a = 1.0;
    float ca = clamp(abs(uVel) * 0.006, 0.0, 0.008) * k;

    if (fx == 1) {
      // mirror
      vec2 d = (uv - uMouse) * asp;
      float dist = length(d);
      vec2 rip = normalize(d + 1e-4) * sin(dist * 46.0 - uTime * 5.0) * exp(-dist * 5.0) * h * 0.008;
      float t = abs(uv.y - 0.5) * 2.0 * 0.85 + n * 0.15;
      a = wipe(t, r, 0.06);
      vec2 w = vec2(0.0, sin(uv.x * 38.0 + uTime * 3.0) * 0.012 * (1.0 - a));
      col = tex(zuv + rip + w);
      col += edge(t, r, 0.05, 0.06) * vec3(0.85, 0.93, 1.0) * 0.5;
    } else if (fx == 2) {
      // frost
      vec2 cell = floor(uv * asp * 13.0);
      float t = hash(cell + uSeed) * 0.55 + (1.0 - uv.y) * 0.45;
      a = wipe(t, r, 0.03);
      col = tex(zuv);
      col = mix(col, vec3(0.93, 0.96, 1.0), edge(t, r, 0.07, 0.03) * 0.85);
      float sp = pow(hash(floor(uv * asp * 70.0) + floor(uTime * 7.0)), 36.0) * h;
      col += sp * 1.6;
    } else if (fx == 3) {
      // slit
      float half_ = r * 0.5;
      a = smoothstep(half_ + 0.004, half_ - 0.004, abs(uv.y - 0.5));
      col = tex((zuv - 0.5) * (1.0 + (1.0 - r) * 0.15) + 0.5);
      float sweep = exp(-pow((uv.x - uMouse.x) * asp.x * 3.5, 2.0)) * h;
      col += vec3(1.0, 0.78, 0.5) * sweep * 0.28;
      col = mix(col, smoothstep(0.0, 1.0, col) * vec3(1.05, 0.98, 0.9), 0.35);
    } else if (fx == 4) {
      // ink
      float t = n * 0.75 + length(uv - 0.5) * 0.35;
      a = wipe(t, r, 0.05);
      col = tex(zuv);
      float g = luma(col);
      col = mix(vec3(g), col, 0.82 + 0.18 * h);
      col = mix(col, col * 0.2, edge(t, r, 0.08, 0.05) * 0.7);
    } else if (fx == 5) {
      // hanging scroll
      float t = 1.0 - uv.y;
      a = wipe(t, r, 0.004);
      col = tex(zuv + vec2(0.0, (1.0 - r) * 0.08));
      float gild = smoothstep(0.12, 0.3, col.r - col.b) * smoothstep(0.35, 0.65, col.r);
      col += pow(hash(floor(uv * asp * 90.0) + floor(uTime * 5.0)), 40.0) * gild * (0.4 + h) * vec3(1.0, 0.86, 0.5) * 2.0;
      float e = edge(t, r, 0.012, 0.004);
      col += vec3(0.95, 0.72, 0.3) * e * 1.4;
      a = max(a, e);
    } else if (fx == 6) {
      // candle
      col = tex(zuv);
      float rad = mix(0.05, 0.75, r);
      float dd = length((uv - uLight) * asp);
      float flick = 0.85 + 0.15 * vnoise(vec2(uTime * 6.0, uSeed));
      float light = exp(-dd * dd / (rad * rad) * 2.2) * flick;
      float amb = max(uAmb, uExpand);
      col = col * (amb + light * 2.3 * vec3(1.0, 0.8, 0.55) * (1.0 - amb));
      a = smoothstep(0.0, 0.08, r);
    } else if (fx == 7) {
      // neon
      float row = floor(uv.y * 22.0);
      float t = hash(vec2(row, 7.0 + uSeed)) * 0.65 + uv.x * 0.35;
      a = step(t, r * 1.15 - 0.05);
      float glitch = step(0.82, hash(vec2(row, floor(uTime * 12.0)))) * (h + (1.0 - r) * 0.8);
      float sh = (hash(vec2(row * 3.1, floor(uTime * 12.0))) - 0.5) * 0.06 * glitch;
      float c2 = 0.002 + glitch * 0.012;
      vec2 u2 = zuv + vec2(sh, 0.0);
      col = vec3(tex(u2 + vec2(c2, 0.0)).r, tex(u2).g, tex(u2 - vec2(c2, 0.0)).b);
      col *= 0.92 + 0.08 * sin(uv.y * 600.0);
    } else {
      // hero tile: monochrome contact print until touched
      float t = n * 0.5 + (1.0 - uv.y) * 0.5;
      a = wipe(t, r, 0.1);
      col = tex(zuv);
      float g = luma(col);
      col = mix(vec3(g) * vec3(1.03, 1.0, 0.95), col, max(h, 1.0 - uGray));
    }
    if (ca > 0.0001 && fx != 7) {
      vec3 c1 = tex(zuv + vec2(0.0, ca));
      col.r = mix(col.r, c1.r, 0.6);
    }
    gl_FragColor = vec4(col * a, a);
  }
`;

const AUTO_LIGHT = (t, seed) => [0.5 + Math.sin(t * 0.43 + seed) * 0.3, 0.5 + Math.sin(t * 0.61 + seed * 2.0) * 0.25];

export class World {
  constructor() {
    this.planes = [];
    this.byEl = new Map();
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'gl-world';
    document.body.append(this.canvas);
    this.renderer = createRenderer(this.canvas, { alpha: true });
    if (!this.renderer) return;
    this.renderer.setClearColor(0x000000, 0);
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(45, 1, 10, 4000);
    this.geometry = new THREE.PlaneGeometry(1, 1, 20, 20);
    this.base = new THREE.ShaderMaterial({ vertexShader: vert, fragmentShader: frag, transparent: true, depthTest: false, premultipliedAlpha: true });
    this.expanding = null;
    this.cap = env.touch ? 1280 : 1600;
    this.io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        const p = this.byEl.get(e.target);
        if (!p) continue;
        p.active = e.isIntersecting;
        if (p.active) this.ensureTexture(p);
      }
    }, { rootMargin: '60% 0px 60% 0px' });
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  get ok() { return !!this.renderer; }

  add(el, { id, fx = 0, gray = 0, focus = [0.5, 0.5], reveal = 0 }) {
    const fallbackImg = el.querySelector('img');
    if (!this.ok) {
      // No WebGL: animate the <img> instead of the plane.
      const proxy = { _v: reveal, get value() { return this._v; }, set value(v) { this._v = v; if (fallbackImg) fallbackImg.style.opacity = String(v); } };
      proxy.value = reveal;
      const p = { el, id, fx, uniforms: { uReveal: proxy, uAmb: { value: 1 }, uHover: { value: 0 } } };
      this.byEl.set(el, p);
      return p;
    }
    const uniforms = {
      tMap: { value: null }, uAr: { value: 1.5 }, uPlaneAr: { value: 1 },
      uFocus: { value: new THREE.Vector2(focus[0], 1 - focus[1]) },
      uTime: { value: 0 }, uReveal: { value: reveal }, uFade: { value: 0 }, uHover: { value: 0 }, uVel: { value: 0 }, uExpand: { value: 0 },
      uFx: { value: fx }, uGray: { value: gray }, uAmb: { value: fx === FX.candle ? 0 : 1 }, uSeed: { value: Math.random() * 10 },
      uMouse: { value: new THREE.Vector2(0.5, 0.5) }, uLight: { value: new THREE.Vector2(0.5, 0.5) },
    };
    const mat = this.base.clone();
    mat.uniforms = uniforms;
    const mesh = new THREE.Mesh(this.geometry, mat);
    mesh.visible = false;
    mesh.frustumCulled = false;
    this.scene.add(mesh);
    const p = { el, id, fx, mesh, uniforms, active: false, hover: 0, target: 0, mouse: new THREE.Vector2(0.5, 0.5), lastMove: -9, light: new THREE.Vector2(0.5, 0.5), seed: Math.random() * 6 };
    el.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') p.target = 1; });
    el.addEventListener('pointerleave', () => { p.target = 0; });
    el.addEventListener('pointermove', (e) => this.local(p, e), { passive: true });
    el.addEventListener('pointerdown', (e) => {
      this.local(p, e);
      if (e.pointerType !== 'mouse') { p.target = 1; clearTimeout(p._t); p._t = setTimeout(() => { p.target = 0; }, 900); }
    }, { passive: true });
    this.planes.push(p);
    this.byEl.set(el, p);
    this.io.observe(el);
    return p;
  }

  local(p, e) {
    const r = p.el.getBoundingClientRect();
    p.mouse.set((e.clientX - r.left) / r.width, 1 - (e.clientY - r.top) / r.height);
    p.lastMove = performance.now() / 1000;
  }

  u(el) { return this.byEl.get(el)?.uniforms; }

  ensureTexture(p) {
    if (p.loading || !this.ok) return p.loading;
    const w = Math.max(p.el.clientWidth, p.el.clientHeight * 0.7) * Math.min(window.devicePixelRatio || 1, 2) * 1.1;
    p.loading = loadTexture(p.id, Math.min(this.cap, Math.max(480, w)), this.renderer).then((tex) => {
      p.uniforms.tMap.value = tex;
      p.uniforms.uAr.value = tex.userData.aspect;
      return tex;
    });
    return p.loading;
  }

  preload(els, onProgress) {
    const ps = els.map((el) => this.byEl.get(el)).filter(Boolean);
    if (!this.ok) return Promise.resolve();
    let done = 0;
    return Promise.all(ps.map((p) => this.ensureTexture(p).then(() => onProgress && onProgress(++done / ps.length))));
  }

  resize() {
    if (!this.ok) return;
    const W = window.innerWidth, H = window.innerHeight;
    this.W = W; this.H = H;
    this.renderer.setSize(W, H, false);
    const dist = 1000;
    this.camera.position.z = dist;
    this.camera.fov = (2 * Math.atan(H / 2 / dist) * 180) / Math.PI;
    this.camera.aspect = W / H;
    this.camera.updateProjectionMatrix();
  }

  expand(el, duration = 1.1) {
    const p = this.byEl.get(el);
    if (!p || !this.ok) return null;
    const r = el.getBoundingClientRect();
    this.expanding = p;
    p.from = { x: r.left, y: r.top, w: r.width, h: r.height };
    p.t = { v: 0 };
    p.mesh.renderOrder = 10;
    return gsap.timeline()
      .to(p.t, { v: 1, duration, ease: 'expo.inOut' }, 0)
      .to(p.uniforms.uExpand, { value: 1, duration: duration * 0.7, ease: 'power2.out' }, 0);
  }

  render(time, dt) {
    if (!this.ok || document.hidden) return;
    const vel = Math.max(-1, Math.min(1, scroll.velocity / 140));
    const now = performance.now() / 1000;
    let any = false;
    for (const p of this.planes) {
      const u = p.uniforms;
      let x, y, w, h;
      if (this.expanding) {
        if (this.expanding !== p) { p.mesh.visible = false; continue; }
        const t = p.t.v, f = p.from;
        x = f.x * (1 - t); y = f.y * (1 - t); w = f.w + (this.W - f.w) * t; h = f.h + (this.H - f.h) * t;
      } else {
        if (!p.active || !u.tMap.value || u.uReveal.value * (1 - u.uFade.value) <= 0.001) { p.mesh.visible = false; continue; }
        const r = p.el.getBoundingClientRect();
        if (r.width < 2 || r.bottom < -50 || r.top > this.H + 50 || r.right < -50 || r.left > this.W + 50) { p.mesh.visible = false; continue; }
        ({ left: x, top: y, width: w, height: h } = r);
      }
      p.mesh.visible = true;
      any = true;
      p.hover = damp(p.hover, p.target, 7, dt);
      u.uHover.value = p.hover;
      u.uVel.value = damp(u.uVel.value, vel, 8, dt);
      u.uTime.value = time;
      u.uMouse.value.lerp(p.mouse, 0.15);
      u.uPlaneAr.value = w / h;
      if (p.fx === FX.candle) {
        const idle = now - p.lastMove > 1.6;
        const [ax, ay] = AUTO_LIGHT(time, p.seed);
        p.light.x = damp(p.light.x, idle ? ax : p.mouse.x, idle ? 1.5 : 6, dt);
        p.light.y = damp(p.light.y, idle ? ay : p.mouse.y, idle ? 1.5 : 6, dt);
        u.uLight.value.copy(p.light);
      }
      p.mesh.scale.set(w, h, 1);
      p.mesh.position.set(x + w / 2 - this.W / 2, this.H / 2 - (y + h / 2), 0);
    }
    if (any) { this.renderer.render(this.scene, this.camera); this._drawn = true; }
    else if (this._drawn) { this.renderer.clear(); this._drawn = false; }
  }
}
