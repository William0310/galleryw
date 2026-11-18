import { albums, albumBySlug, photoIds } from './data/albums.js';
import { initScroll, gsap, ScrollTrigger, scrollToTop } from './core/scroll.js';
import { initNav } from './core/nav.js';
import { initTransitions } from './core/transition.js';
import { createLightbox } from './core/lightbox.js';
import { pick, heroPx } from './core/img.js';
import { renderHero, renderBlocks, renderNext, renderFoot } from './album/render.js';
import { heroMotion, blockMotion } from './album/motion.js';
import { AlbumHero } from './gl/album-hero.js';

const slug = new URLSearchParams(location.search).get('a');
const album = albumBySlug[slug] || albums[0];

document.title = `${album.name} ${album.zh} — Wphotographs`;
document.body.classList.add(`t-${album.slug}`);
document.querySelector('meta[name="theme-color"]')?.setAttribute('content', getComputedStyle(document.body).getPropertyValue('--bg').trim());

initScroll();
const arrival = initTransitions();
const seamless = !!(arrival && arrival.silent);
if (seamless) document.documentElement.classList.add('is-seamless');
initNav({ current: album });

const main = document.querySelector('main');
const hero = renderHero(album);
main.append(hero, renderBlocks(album), renderNext(album));
document.body.append(renderFoot());

// Swap the hero placeholder to a real image right away (GL takes over when ready).
const fallback = hero.querySelector('.hero__fallback');
const full = new Image();
full.decoding = 'async';
full.src = pick(album.cover, heroPx());
full.decode().then(() => { fallback.src = full.src; fallback.classList.add('is-sharp'); }).catch(() => {});

// --- WebGL hero -------------------------------------------------------------------------
const gl = new AlbumHero(hero.querySelector('.hero__media'), album);
// Arriving from the home page's full-screen cover into a framed hero (Japan's "print on
// paper"): start the frame full-bleed and let it settle into its margins.
function settleFrame() {
  const media = hero.querySelector('.hero__media');
  const cs = getComputedStyle(media);
  const to = { top: cs.top, right: cs.right, bottom: cs.bottom, left: cs.left };
  if (Object.values(to).every((v) => parseFloat(v) === 0)) return;
  gsap.fromTo(media, { top: 0, right: 0, bottom: 0, left: 0 }, {
    ...to, duration: 1.5, delay: 0.2, ease: 'expo.inOut',
    onUpdate: () => gl.ok && gl.resize(),
    onComplete: () => { gsap.set(media, { clearProps: 'top,right,bottom,left' }); gl.ok && gl.resize(); },
  });
}
if (seamless) settleFrame();

let started = false;
const start = () => {
  if (started) return;
  started = true;
  gl.intro(0.1, seamless);
  heroMotion(hero, gl);
};
if (gl.ok) {
  gl.load().then(() => { hero.classList.add('gl-ready'); start(); }).catch((e) => { console.warn(e); start(); });
  setTimeout(start, 4000); // never block the page on a slow texture
} else start();

gsap.ticker.add((t, dt) => gl.ok && gl.render(t, dt / 1000));

// --- blocks -------------------------------------------------------------------------------
blockMotion(main, album);

// --- lightbox: every frame on the page in reading order ---------------------------------
const lb = createLightbox();
const ids = photoIds(album);
main.addEventListener('click', (e) => {
  const opener = e.target.closest('[data-open]');
  const fig = e.target.closest('.ph');
  if (e.target.closest('a')) return;
  const id = opener ? opener.dataset.open : fig?.dataset.id;
  if (!id) return;
  lb.open(ids, Math.max(0, ids.indexOf(id)), opener ? null : fig.querySelector('.ph__frame'));
});

// --- scroll progress + back to top --------------------------------------------------------
const bar = document.createElement('div');
bar.className = 'progress';
bar.innerHTML = '<i></i>';
document.body.append(bar);
ScrollTrigger.create({ start: 0, end: 'max', onUpdate: (st) => { bar.firstChild.style.transform = `scaleY(${st.progress})`; } });
document.querySelector('.foot__top')?.addEventListener('click', () => scrollToTop());

// Layout can shift when web fonts arrive; re-measure pins once everything settles.
document.fonts?.ready.then(() => ScrollTrigger.refresh());
window.addEventListener('load', () => ScrollTrigger.refresh());
document.addEventListener('wp:restored', () => ScrollTrigger.refresh());

// Handle for debugging / performance checks from the console.
window.__wp = { gl, lb, gsap, ScrollTrigger };
