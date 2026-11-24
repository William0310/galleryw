// Ataraxia website — small, dependency-free interactions.
const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Reveal on scroll.
const io = new IntersectionObserver((entries) => {
  for (const e of entries) if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
}, { rootMargin: '0px 0px -8% 0px' });
document.querySelectorAll('.reveal').forEach((el) => (reduce ? el.classList.add('is-in') : io.observe(el)));

// Navigation: hairline once scrolled, active section marker.
const nav = document.querySelector('[data-nav]');
const links = [...document.querySelectorAll('.nav__links a')];
const targets = links.map((a) => document.querySelector(a.getAttribute('href'))).filter(Boolean);
const spy = new IntersectionObserver((entries) => {
  for (const e of entries) {
    if (!e.isIntersecting) continue;
    links.forEach((a) => a.classList.toggle('is-active', a.getAttribute('href') === `#${e.target.id}`));
  }
}, { rootMargin: '-45% 0px -50% 0px' });
targets.forEach((t) => spy.observe(t));

// 01 — the camera pans across the real canvas capture while the section is pinned.
const spatial = document.querySelector('[data-spatial]');
const img = spatial.querySelector('.spatial__img');
const win = spatial.querySelector('.spatial__window');
const steps = [...spatial.querySelectorAll('[data-steps] li')];
const track = spatial.querySelector('[data-track]');
const wide = window.matchMedia('(min-width: 1021px)');

// 02 — the immersive capture settles into place as it arrives (a slow, small push-in).
const shot = document.querySelector('[data-immersive]');
function settle() {
  if (!shot || reduce) return;
  const top = shot.getBoundingClientRect().top;
  const k = Math.min(1, Math.max(0, 1 - (top - innerHeight * 0.25) / (innerHeight * 0.7)));
  const e = 1 - Math.pow(1 - k, 3);
  shot.style.setProperty('--s', (0.93 + 0.07 * e).toFixed(4));
  shot.style.setProperty('--o', (0.25 + 0.75 * e).toFixed(3));
}

let ticking = false;
function update() {
  ticking = false;
  nav.classList.toggle('is-scrolled', window.scrollY > 8);
  settle();
  if (!wide.matches || reduce) return;
  const r = spatial.getBoundingClientRect();
  const total = spatial.offsetHeight - window.innerHeight;
  const p = Math.min(1, Math.max(0, -r.top / Math.max(1, total)));
  // Ease the pan so the view lingers on each "stop" (the left page, the Peek, the right page).
  const eased = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
  const travel = Math.max(0, img.offsetWidth - win.clientWidth);
  img.style.setProperty('--x', `${-eased * travel}px`);
  track.style.setProperty('--p', p.toFixed(3));
  const i = Math.min(steps.length - 1, Math.floor(p * steps.length));
  steps.forEach((s, k) => s.classList.toggle('is-on', k === i));
}
const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
window.addEventListener('scroll', onScroll, { passive: true });
window.addEventListener('resize', onScroll);
img.addEventListener('load', onScroll);
update();

// 02 — Light Tunnel comparison slider (keyboard and touch via the native range input).
// (Section removed for now; kept so it works again once the refined demo returns.)
const compare = document.querySelector('[data-compare]');
if (compare) {
  const range = compare.querySelector('[data-compare-range]');
  const setSplit = () => compare.style.setProperty('--split', `${range.value}%`);
  range.addEventListener('input', setSplit);
  setSplit();
}

// 03 — conceptual resize demo: the handle drifts between two widths while in view.
const demo = document.querySelector('[data-demo]');
if (demo && !reduce) {
  let t0 = null;
  let running = false;
  const loop = (t) => {
    if (!running) return;
    if (t0 === null) t0 = t;
    const s = ((t - t0) / 1000) % 6;
    // hold · widen · hold · narrow
    const k = s < 1 ? 0 : s < 2.6 ? (s - 1) / 1.6 : s < 4 ? 1 : 1 - (s - 4) / 2;
    const e = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
    demo.style.setProperty('--w', `${46 + e * 26}%`);
    requestAnimationFrame(loop);
  };
  new IntersectionObserver(([e]) => {
    running = e.isIntersecting;
    if (running) { t0 = null; requestAnimationFrame(loop); }
  }).observe(demo);
}
