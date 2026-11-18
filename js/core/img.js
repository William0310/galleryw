import meta from '../data/meta.js';
import { photos } from '../data/albums.js';
import { esc } from './env.js';

const DIR = 'assets/photos/';

export const info = (id) => {
  const m = meta[id];
  if (!m) throw new Error(`Unknown photo id: ${id}`);
  return m;
};
export const aspect = (id) => info(id).w / info(id).h;
export const isPano = (id) => aspect(id) >= 2.2;
// The largest size is the original file itself (assets/img), never a copy.
export const url = (id, w) => {
  const m = info(id);
  return w === m.w && m.src ? `assets/img/${encodeURIComponent(m.src)}` : `${DIR}${id}-${w}.webp`;
};

export function srcset(id) {
  return info(id).sizes.map((w) => `${url(id, w)} ${w}w`).join(', ');
}

// Smallest variant at least `px` wide (falls back to the largest one).
export function pick(id, px) {
  const s = info(id).sizes;
  return url(id, s.find((w) => w >= px) || s[s.length - 1]);
}

// One shared size for full-screen covers, so the home slideshow, the album hero texture and
// the album hero <img> all hit the same cached file.
export function heroPx() {
  return Math.min(2400, Math.max(window.innerWidth, window.innerHeight * 1.6) * Math.min(window.devicePixelRatio || 1, 1.5));
}

export function caption(id) {
  return photos[id] || { t: '', e: '', loc: '' };
}

/**
 * <figure> with a blurred placeholder underneath the real image.
 * opts.sizes  – sizes attribute
 * opts.eager  – load immediately (above the fold)
 * opts.parallax – adds an inner wrapper that motion.js can translate
 */
export function figure(id, opts = {}) {
  const m = info(id);
  const c = caption(id);
  const fig = document.createElement('figure');
  fig.className = `ph ${opts.className || ''}`.trim();
  fig.dataset.id = id;
  fig.style.setProperty('--ar', (m.w / m.h).toFixed(4));
  fig.style.setProperty('--ph-color', m.color);

  const frame = document.createElement('div');
  frame.className = 'ph__frame';
  const inner = document.createElement('div');
  inner.className = 'ph__inner';

  const lq = document.createElement('img');
  lq.className = 'ph__lqip';
  lq.src = m.lqip;
  lq.alt = '';
  lq.setAttribute('aria-hidden', 'true');

  const img = document.createElement('img');
  img.className = 'ph__img';
  img.alt = `${c.t} — ${c.e}`; // property, not HTML: no escaping
  img.width = m.w;
  img.height = m.h;
  img.decoding = 'async';
  img.loading = opts.eager ? 'eager' : 'lazy';
  img.sizes = opts.sizes || '100vw';
  img.srcset = srcset(id);
  img.src = pick(id, 1600);
  const done = () => fig.classList.add('is-loaded');
  if (img.complete && img.naturalWidth) done();
  else img.addEventListener('load', done, { once: true });

  inner.append(lq, img);
  frame.append(inner);
  fig.append(frame);

  if (opts.caption !== false) {
    const cap = document.createElement('figcaption');
    cap.className = 'ph__cap';
    cap.innerHTML = `<span class="ph__t">${esc(c.t)}</span><span class="ph__e">${esc(c.e)}</span><span class="ph__loc">${esc(c.loc)}</span>`;
    fig.append(cap);
  }
  return fig;
}
