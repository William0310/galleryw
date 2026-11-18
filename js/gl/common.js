import * as THREE from 'three';
import { glDpr } from '../core/env.js';
import { pick, info } from '../core/img.js';

export { THREE };

export function createRenderer(canvas, { heavy = false, alpha = false } = {}) {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: false,
      alpha,
      powerPreference: 'high-performance',
      premultipliedAlpha: true,
    });
  } catch (e) {
    console.warn('[Wphoto] WebGL unavailable, using image fallback.', e);
    return null;
  }
  renderer.setPixelRatio(glDpr(heavy));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  canvas.addEventListener('webglcontextlost', (e) => {
    e.preventDefault();
    document.documentElement.classList.add('no-webgl');
  });
  return renderer;
}

const loader = new THREE.TextureLoader();
const cache = new Map();

// Load the variant that is just big enough for `px` device pixels across.
export function loadTexture(id, px, renderer) {
  const src = pick(id, px);
  if (cache.has(src)) return cache.get(src);
  const p = new Promise((resolve, reject) => {
    loader.load(src, (tex) => {
      // Keep pixels in sRGB end-to-end: shaders output exactly what they sample.
      tex.colorSpace = THREE.NoColorSpace;
      tex.minFilter = THREE.LinearFilter;
      tex.magFilter = THREE.LinearFilter;
      tex.generateMipmaps = false;
      tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
      tex.userData.aspect = info(id).w / info(id).h;
      tex.userData.id = id;
      if (renderer) renderer.initTexture(tex); // upload now rather than mid-animation
      resolve(tex);
    }, undefined, reject);
  });
  cache.set(src, p);
  return p;
}

// --- GLSL chunks -------------------------------------------------------------------------
export const glsl = {
  // object-fit: cover with a focal point (focus in GL uv space, y up).
  cover: /* glsl */ `
    vec2 coverUv(vec2 uv, vec2 res, float ar, vec2 focus) {
      float sa = res.x / res.y;
      vec2 s = sa > ar ? vec2(1.0, ar / sa) : vec2(sa / ar, 1.0);
      return uv * s + (1.0 - s) * focus;
    }`,
  noise: /* glsl */ `
    float hash(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
    float vnoise(vec2 p) {
      vec2 i = floor(p), f = fract(p);
      vec2 u = f * f * (3.0 - 2.0 * f);
      return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
    }
    float fbm(vec2 p) {
      float v = 0.0, a = 0.5;
      for (int i = 0; i < 4; i++) { v += a * vnoise(p); p = p * 2.03 + 17.1; a *= 0.5; }
      return v;
    }`,
  luma: /* glsl */ `float luma(vec3 c) { return dot(c, vec3(0.2126, 0.7152, 0.0722)); }`,
};

export const fullscreenVert = /* glsl */ `
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }
`;

// Simple pointer tracker in normalised [0,1] coords of an element (y up, like GL).
export function trackPointer(el, { onMove } = {}) {
  const p = { x: 0.5, y: 0.5, tx: 0.5, ty: 0.5, vx: 0, vy: 0, active: false, last: 0 };
  const set = (e) => {
    const r = el.getBoundingClientRect();
    p.tx = (e.clientX - r.left) / r.width;
    p.ty = 1 - (e.clientY - r.top) / r.height;
    p.active = true;
    p.last = performance.now();
    onMove && onMove(p, e);
  };
  el.addEventListener('pointermove', set, { passive: true });
  el.addEventListener('pointerdown', set, { passive: true });
  el.addEventListener('pointerleave', () => { p.active = false; });
  return p;
}
