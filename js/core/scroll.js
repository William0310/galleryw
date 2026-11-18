// Lenis smooth scrolling wired into GSAP's ticker so ScrollTrigger, Lenis and every
// WebGL render share exactly one requestAnimationFrame per frame.
import { env } from './env.js';

const { gsap, ScrollTrigger, Lenis } = window;
gsap.registerPlugin(ScrollTrigger);
ScrollTrigger.config({ ignoreMobileResize: true });

export { gsap, ScrollTrigger };

export const scroll = {
  lenis: null,
  y: window.scrollY,
  velocity: 0, // px per frame, smoothed
  _last: window.scrollY,
};

export function initScroll() {
  // Pages are built and choreographed from the top; don't let the browser restore a
  // half-way position into a pinned section before the layout exists.
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  window.scrollTo(0, 0);
  if (!env.reduced && Lenis) {
    // Touch devices keep native momentum scrolling (syncTouch off) — it feels right on phones
    // and avoids fighting the browser's own gesture handling.
    scroll.lenis = new Lenis({ lerp: 0.1, wheelMultiplier: 1, smoothWheel: true });
    scroll.lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((t) => scroll.lenis.raf(t * 1000));
  }
  gsap.ticker.lagSmoothing(0);

  // Velocity tracker that works for both Lenis and native scrolling.
  gsap.ticker.add(() => {
    const y = window.scrollY;
    const raw = y - scroll._last;
    scroll._last = y;
    scroll.y = y;
    scroll.velocity += (raw - scroll.velocity) * 0.2;
    if (Math.abs(scroll.velocity) < 0.01) scroll.velocity = 0;
  });
  return scroll;
}

export function lockScroll(lock) {
  document.documentElement.classList.toggle('is-locked', lock);
  if (scroll.lenis) lock ? scroll.lenis.stop() : scroll.lenis.start();
}

export function scrollToTop(immediate = false) {
  if (scroll.lenis) scroll.lenis.scrollTo(0, { immediate, duration: 1.6 });
  else window.scrollTo({ top: 0, behavior: immediate ? 'auto' : 'smooth' });
}
