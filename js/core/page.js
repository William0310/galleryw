// Shared setup for the editorial pages (About, Newsroom).
import { initScroll, gsap, ScrollTrigger, scroll, scrollToTop } from './scroll.js';
import { initNav } from './nav.js';
import { initTransitions } from './transition.js';
import { split } from './split.js';
import { env, damp } from './env.js';

export { gsap, ScrollTrigger, scroll, env, split };

export function initPage() {
  initScroll();
  initTransitions();
  initNav();

  const foot = document.createElement('footer');
  foot.className = 'pg-foot';
  foot.innerHTML = `
    <a href="index.html" data-link data-en="Wphotographs" class="pg-foot__home">Wphotographs</a>
    <nav aria-label="Pages"><a href="about.html" data-link data-en="About">About</a><a href="news.html" data-link data-en="Newsroom">Newsroom</a><a href="ataraxia/">Ataraxia</a></nav>
    <button type="button" class="pg-foot__top">Back to top ↑</button>`;
  document.querySelector('main').append(foot);
  foot.querySelector('.pg-foot__top').addEventListener('click', () => scrollToTop());

  // Fade-up for marked blocks.
  document.querySelectorAll('[data-reveal]').forEach((el) => {
    if (env.reduced) return;
    gsap.fromTo(el, { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 1.1, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 90%', once: true } });
  });

  // In-page anchors go through Lenis.
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[data-scroll]');
    if (!a) return;
    const target = document.querySelector(a.getAttribute('href'));
    if (!target) return;
    e.preventDefault();
    if (scroll.lenis) scroll.lenis.scrollTo(target, { offset: -40, duration: 1.4 });
    else target.scrollIntoView({ behavior: 'smooth' });
  });

  document.fonts?.ready.then(() => ScrollTrigger.refresh());
  window.addEventListener('load', () => ScrollTrigger.refresh());
}

// Big headline whose letters rise in, then swell in weight under the pointer
// (a slow wave on touch screens). Returns the letter spans.
export function kineticHeading(el, { min = 200, max = 900, delay = 0.2 } = {}) {
  const letters = split(el, { chars: true });
  if (env.reduced) return letters;
  gsap.fromTo(letters, { yPercent: 115 }, { yPercent: 0, duration: 1.4, stagger: 0.05, ease: 'expo.out', delay });
  let mx = -1e4;
  let centres = [];
  const measure = () => { centres = letters.map((l) => { const r = l.getBoundingClientRect(); return r.left + r.width / 2; }); };
  window.addEventListener('pointermove', (e) => { if (e.pointerType === 'mouse') mx = e.clientX; }, { passive: true });
  document.addEventListener('pointerleave', () => { mx = -1e4; });
  window.addEventListener('resize', () => setTimeout(measure, 60));
  const w = letters.map(() => min + 100);
  let visible = true;
  ScrollTrigger.create({ trigger: el, start: 'top bottom', end: 'bottom top', onToggle: (s) => { visible = s.isActive; } });
  gsap.ticker.add((t, dtMs) => {
    if (!visible) return;
    if (!centres.length) measure();
    const sigma = window.innerWidth * 0.08;
    letters.forEach((l, i) => {
      const target = mx > -1e3
        ? min + (max - min) * Math.exp(-(((centres[i] - mx) / sigma) ** 2))
        : (min + max) / 2 + ((max - min) / 2.6) * Math.sin(t * 1.3 - i * 0.6);
      w[i] = damp(w[i], target, 8, dtMs / 1000);
      l.style.fontWeight = String(Math.round(w[i]));
    });
  });
  setTimeout(measure, 1600);
  return letters;
}
