// Device / capability flags shared by every module.
const mq = (q) => window.matchMedia(q);

export const env = {
  touch: mq('(hover: none), (pointer: coarse)').matches,
  reduced: mq('(prefers-reduced-motion: reduce)').matches,
  get narrow() { return window.innerWidth < 760; },
  get portrait() { return window.innerHeight > window.innerWidth; },
  lowPower: (navigator.hardwareConcurrency || 8) <= 4 || (navigator.deviceMemory || 8) <= 4,
};

// Pixel-ratio budget for WebGL canvases. Full-screen shaders are fill-rate bound,
// so phones (dpr 3) are capped hard; the eye can't tell at these image sizes.
export function glDpr(heavy = false) {
  const d = window.devicePixelRatio || 1;
  if (env.touch || env.lowPower) return Math.min(d, heavy ? 1.25 : 1.5);
  return Math.min(d, heavy ? 1.5 : 2);
}

// Stable viewport height: on mobile the URL bar changes innerHeight while scrolling;
// we only re-measure when the width changes (i.e. a real resize/rotation).
let vh = window.innerHeight;
let lastW = window.innerWidth;
export function viewportH() { return vh; }
window.addEventListener('resize', () => {
  if (window.innerWidth !== lastW || !env.touch) {
    lastW = window.innerWidth;
    vh = window.innerHeight;
  }
});

export const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const damp = (a, b, lambda, dt) => lerp(a, b, 1 - Math.exp(-lambda * dt));
export const pad2 = (n) => String(n).padStart(2, '0');

// Escape user-editable text before it goes into innerHTML.
export const esc = (t) => String(t ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
