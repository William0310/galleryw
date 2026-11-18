// Full-screen viewer. Two display modes:
//   fit  – whole frame visible (default for normal photos)
//   fill – frame covers the screen and can be dragged / wheeled to pan (default for panoramas)
// so a 5:1 panorama on a 9:19 phone is explored by dragging instead of shown as a sliver.
import { info, pick, caption, aspect } from './img.js';
import { gsap, lockScroll } from './scroll.js';
import { env, clamp, pad2 } from './env.js';

export function createLightbox() {
  const root = document.createElement('div');
  root.className = 'lb';
  root.setAttribute('role', 'dialog');
  root.setAttribute('aria-modal', 'true');
  root.setAttribute('aria-label', 'Photo viewer');
  root.hidden = true;
  root.innerHTML = `
    <div class="lb__bg"></div>
    <div class="lb__stage"><img class="lb__lq" alt="" aria-hidden="true"><img class="lb__img" alt=""></div>
    <div class="lb__ui">
      <div class="lb__top">
        <span class="lb__count"></span>
        <button class="lb__btn lb__close" type="button" aria-label="Close viewer">Close <i>✕</i></button>
      </div>
      <div class="lb__cap"><span class="lb__t"></span><span class="lb__e"></span><span class="lb__loc"></span></div>
      <div class="lb__bar">
        <button class="lb__btn lb__prev" type="button" aria-label="Previous photo">←</button>
        <button class="lb__btn lb__mode" type="button"></button>
        <button class="lb__btn lb__next" type="button" aria-label="Next photo">→</button>
      </div>
      <div class="lb__map" aria-hidden="true"><img alt=""><i></i></div>
      <p class="lb__hint" aria-hidden="true">${env.touch ? 'Drag to explore' : 'Drag or scroll to explore'}</p>
    </div>`;
  document.body.append(root);

  const $ = (s) => root.querySelector(s);
  const stage = $('.lb__stage');
  const img = $('.lb__img');
  const lq = $('.lb__lq');
  const map = $('.lb__map');
  const mapImg = map.querySelector('img');
  const mapWin = map.querySelector('i');
  const modeBtn = $('.lb__mode');
  const hint = $('.lb__hint');

  let list = [];
  let index = 0;
  let mode = 'fit';
  let isOpen = false;
  const s = { W: 0, H: 0, w: 0, h: 0, x: 0, y: 0, vx: 0, vy: 0, maxX: 0, maxY: 0 };
  let dragging = false;
  let lastFocus = null;

  function measure() {
    s.W = window.innerWidth;
    s.H = window.innerHeight;
  }

  function layout(resetPan = false) {
    measure();
    const ar = aspect(list[index]);
    const pad = env.narrow ? { x: 0, y: 150 } : { x: 160, y: 170 };
    if (mode === 'fit') {
      const availW = s.W - pad.x;
      const availH = s.H - pad.y;
      if (availW / availH > ar) { s.h = availH; s.w = availH * ar; } else { s.w = availW; s.h = availW / ar; }
    } else {
      if (s.W / s.H > ar) { s.w = s.W; s.h = s.W / ar; } else { s.h = s.H; s.w = s.H * ar; }
    }
    s.maxX = Math.max(0, (s.w - s.W) / 2);
    s.maxY = Math.max(0, (s.h - s.H) / 2);
    if (resetPan) { s.x = 0; s.y = 0; s.vx = 0; s.vy = 0; }
    s.x = clamp(s.x, -s.maxX, s.maxX);
    s.y = clamp(s.y, -s.maxY, s.maxY);
    for (const el of [img, lq]) {
      el.style.width = `${s.w}px`;
      el.style.height = `${s.h}px`;
    }
    root.classList.toggle('is-pannable', s.maxX > 1 || s.maxY > 1);
    modeBtn.textContent = mode === 'fit' ? 'Fill ⤢' : 'Fit ⤡';
    modeBtn.setAttribute('aria-label', mode === 'fit' ? 'Fill the screen and pan' : 'Show the whole frame');
    apply();
  }

  function apply() {
    const t = `translate3d(calc(-50% + ${s.x}px), calc(-50% + ${s.y}px), 0)`;
    img.style.transform = t;
    lq.style.transform = t;
    if (s.maxX > 1 || s.maxY > 1) {
      // Minimap window: visible fraction of the frame.
      const fw = Math.min(1, s.W / s.w);
      const fh = Math.min(1, s.H / s.h);
      const cx = 0.5 - s.x / s.w;
      const cy = 0.5 - s.y / s.h;
      mapWin.style.left = `${(cx - fw / 2) * 100}%`;
      mapWin.style.top = `${(cy - fh / 2) * 100}%`;
      mapWin.style.width = `${fw * 100}%`;
      mapWin.style.height = `${fh * 100}%`;
    }
  }

  function load(i, { resetMode = true } = {}) {
    index = (i + list.length) % list.length;
    const id = list[index];
    const m = info(id);
    const ar = m.w / m.h;
    // Panoramas open in pan mode when they are much wider than the screen; everything else
    // opens showing the whole frame.
    if (resetMode) mode = ar >= 2.2 && ar > (window.innerWidth / window.innerHeight) * 1.4 ? 'fill' : 'fit';
    const c = caption(id);
    $('.lb__t').textContent = c.t;
    $('.lb__e').textContent = c.e;
    $('.lb__loc').textContent = c.loc;
    $('.lb__count').textContent = `${pad2(index + 1)} / ${pad2(list.length)}`;
    img.alt = `${c.t} — ${c.e}`;
    lq.src = m.lqip;
    mapImg.src = m.lqip;
    map.style.aspectRatio = String(ar);
    img.classList.remove('is-loaded');
    layout(true);
    // Request a size that matches the largest displayed dimension at device resolution.
    const need = Math.max(s.w, mode === 'fit' ? 0 : s.H * ar) * Math.min(window.devicePixelRatio || 1, 2);
    const src = pick(id, need);
    img.onload = () => { if (list[index] === id) img.classList.add('is-loaded'); };
    img.src = src;
    if (img.complete && img.naturalWidth) img.classList.add('is-loaded');
    if (s.maxX > 1 || s.maxY > 1) {
      hint.classList.add('is-on');
      clearTimeout(hint._t);
      hint._t = setTimeout(() => hint.classList.remove('is-on'), 2200);
    }
  }

  function open(ids, i, fromEl) {
    list = ids;
    lastFocus = document.activeElement;
    root.hidden = false;
    isOpen = true;
    lockScroll(true);
    load(i);
    const rect = fromEl?.getBoundingClientRect();
    const tl = gsap.timeline();
    tl.fromTo($('.lb__bg'), { opacity: 0 }, { opacity: 1, duration: 0.5, ease: 'power2.out' });
    if (rect && rect.width && !env.reduced) {
      const sc = rect.width / s.w;
      const dx = rect.left + rect.width / 2 - s.W / 2 - s.x;
      const dy = rect.top + rect.height / 2 - s.H / 2 - s.y;
      tl.fromTo(stage, { x: dx, y: dy, scale: sc }, { x: 0, y: 0, scale: 1, duration: 0.9, ease: 'expo.out' }, 0);
    } else {
      tl.fromTo(stage, { opacity: 0 }, { opacity: 1, duration: 0.4 }, 0);
    }
    tl.fromTo($('.lb__ui'), { opacity: 0 }, { opacity: 1, duration: 0.5 }, 0.25);
    $('.lb__close').focus({ preventScroll: true });
  }

  function close() {
    if (!isOpen) return;
    isOpen = false;
    gsap.timeline({
      onComplete: () => {
        root.hidden = true;
        gsap.set(stage, { clearProps: 'all' });
        lockScroll(false);
        lastFocus?.focus?.({ preventScroll: true });
      },
    })
      .to($('.lb__ui'), { opacity: 0, duration: 0.2 })
      .to(stage, { opacity: 0, scale: 0.96, duration: 0.35, ease: 'power2.in' }, 0)
      .to($('.lb__bg'), { opacity: 0, duration: 0.4 }, 0.1);
  }

  function step(d) {
    gsap.fromTo(stage, { opacity: 0.2, x: d * 40 }, { opacity: 1, x: 0, duration: 0.6, ease: 'expo.out' });
    load(index + d);
  }

  function toggleMode() {
    mode = mode === 'fit' ? 'fill' : 'fit';
    const id = list[index];
    layout(true);
    const need = Math.max(s.w, s.h * aspect(id)) * Math.min(window.devicePixelRatio || 1, 2);
    const src = pick(id, need);
    if (!img.src.endsWith(src)) img.src = src;
  }

  // ---- input -------------------------------------------------------------------------
  $('.lb__close').addEventListener('click', close);
  $('.lb__prev').addEventListener('click', () => step(-1));
  $('.lb__next').addEventListener('click', () => step(1));
  modeBtn.addEventListener('click', toggleMode);
  $('.lb__bg').addEventListener('click', close);

  window.addEventListener('keydown', (e) => {
    if (!isOpen) return;
    if (e.key === 'Escape') close();
    else if (e.key === 'ArrowRight') step(1);
    else if (e.key === 'ArrowLeft') step(-1);
    else if (e.key === 'f' || e.key === 'F') toggleMode();
    else if (e.key === 'Tab') {
      // Keep focus inside the dialog.
      const f = [...root.querySelectorAll('button')];
      const i = f.indexOf(document.activeElement);
      e.preventDefault();
      f[(i + (e.shiftKey ? -1 : 1) + f.length) % f.length].focus();
    }
  });

  let px = 0, py = 0, sx = 0, sy = 0, lastT = 0, downT = 0, lastTap = 0, moved = 0;
  stage.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    dragging = true;
    moved = 0;
    stage.setPointerCapture(e.pointerId);
    px = sx = e.clientX; py = sy = e.clientY;
    lastT = downT = performance.now();
    s.vx = s.vy = 0;
    root.classList.add('is-dragging');
  });
  stage.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const now = performance.now();
    const dx = e.clientX - px;
    const dy = e.clientY - py;
    moved += Math.abs(dx) + Math.abs(dy);
    px = e.clientX; py = e.clientY;
    if (s.maxX > 1 || s.maxY > 1) {
      s.x = clamp(s.x + dx, -s.maxX, s.maxX);
      s.y = clamp(s.y + dy, -s.maxY, s.maxY);
      const dt = Math.max(1, now - lastT);
      s.vx = (dx / dt) * 16;
      s.vy = (dy / dt) * 16;
      apply();
    } else {
      // Not pannable: preview the swipe.
      gsap.set(stage, { x: e.clientX - sx });
    }
    lastT = now;
  });
  const end = (e) => {
    if (!dragging) return;
    dragging = false;
    root.classList.remove('is-dragging');
    const now = performance.now();
    const dx = e.clientX - sx;
    if (!(s.maxX > 1 || s.maxY > 1)) {
      if (Math.abs(dx) > 60 && now - downT < 600) step(dx < 0 ? 1 : -1);
      else gsap.to(stage, { x: 0, duration: 0.4, ease: 'power3.out' });
    }
    // Double tap / double click toggles fit ↔ fill.
    if (moved < 8) {
      if (now - lastTap < 320) { toggleMode(); lastTap = 0; } else lastTap = now;
    }
    if (now - lastT > 80) { s.vx = 0; s.vy = 0; }
  };
  stage.addEventListener('pointerup', end);
  stage.addEventListener('pointercancel', end);

  root.addEventListener('wheel', (e) => {
    if (!isOpen) return;
    e.preventDefault();
    if (s.maxX > 1) s.x = clamp(s.x - (e.deltaY + e.deltaX), -s.maxX, s.maxX);
    else if (s.maxY > 1) s.y = clamp(s.y - e.deltaY, -s.maxY, s.maxY);
    apply();
  }, { passive: false });

  // Inertia after a flick.
  gsap.ticker.add(() => {
    if (!isOpen || dragging) return;
    if (Math.abs(s.vx) < 0.05 && Math.abs(s.vy) < 0.05) return;
    s.x = clamp(s.x + s.vx, -s.maxX, s.maxX);
    s.y = clamp(s.y + s.vy, -s.maxY, s.maxY);
    s.vx *= 0.93; s.vy *= 0.93;
    apply();
  });

  let rw = window.innerWidth;
  window.addEventListener('resize', () => {
    if (!isOpen) return;
    if (env.touch && window.innerWidth === rw) return; // URL-bar resize on phones
    rw = window.innerWidth;
    layout();
  });

  return { open, close, get isOpen() { return isOpen; } };
}
