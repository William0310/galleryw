// Page-to-page transition: a short fade through the page's own background colour.
// Leaving: a veil in the current page colour fades in, then we navigate.
// Arriving (flagged through sessionStorage + a class set in <head> before first paint): the
// page starts transparent over its own themed background and fades in — no coloured flash.
// Works with the native back button and the bfcache.
import { gsap } from './scroll.js';
import { env } from './env.js';

const KEY = 'wp-curtain';
let veil;
let busy = false;

function ensure() {
  if (veil) return veil;
  veil = document.createElement('div');
  veil.className = 'veil';
  veil.setAttribute('aria-hidden', 'true');
  document.body.append(veil);
  return veil;
}

export function initTransitions() {
  ensure();
  let data = null;
  try {
    data = JSON.parse(sessionStorage.getItem(KEY) || 'null');
    sessionStorage.removeItem(KEY);
  } catch (e) { /* storage blocked: plain navigation */ }

  const root = document.documentElement;
  if (root.classList.contains('is-entering')) {
    // Fade the content in over the themed background (header included, once it exists).
    requestAnimationFrame(() => {
      gsap.fromTo(['.page', '.site-head'], { opacity: 0 }, {
        opacity: 1, duration: env.reduced ? 0.01 : 0.7, ease: 'power2.out', clearProps: 'opacity',
        onComplete: () => root.classList.remove('is-entering'),
      });
      root.classList.add('is-revealing');
    });
  }

  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[data-link]');
    if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || a.target === '_blank') return;
    const href = a.getAttribute('href');
    if (!href || href.startsWith('#')) return;
    e.preventDefault();
    go(a.href);
  });

  // Back/forward from the bfcache: make sure nothing is left covering the page.
  window.addEventListener('pageshow', (e) => {
    if (e.persisted) {
      busy = false;
      root.classList.remove('is-entering', 'is-leaving', 'is-revealing');
      gsap.set(veil, { opacity: 0 });
      document.dispatchEvent(new CustomEvent('wp:restored'));
    }
  });
  return data;
}

// curtain:false = seamless hand-off (the home page's expanding cover) — no fade at all.
export function go(href, data = {}, { curtain: withCurtain = true } = {}) {
  if (busy) return;
  busy = true;
  try { sessionStorage.setItem(KEY, JSON.stringify(withCurtain ? { fade: true } : { ...data, silent: true })); } catch (e) { /* ignore */ }
  document.documentElement.classList.add('is-leaving');
  if (!withCurtain || env.reduced) {
    window.location.href = href;
    return;
  }
  ensure();
  veil.style.background = getComputedStyle(document.body).backgroundColor;
  gsap.fromTo(veil, { opacity: 0 }, { opacity: 1, duration: 0.35, ease: 'power2.in', onComplete: () => { window.location.href = href; } });
}
