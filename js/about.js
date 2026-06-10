/* ==========================================================
   行记 — about / news pages
   shared chrome: cursor, progress bar, smooth scroll, text reveals
   ========================================================== */
(function () {
  'use strict';

  gsap.registerPlugin(ScrollTrigger);
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

  const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function splitWords(el, perChar) {
    const walk = (node) => {
      [...node.childNodes].forEach((child) => {
        if (child.nodeType === Node.TEXT_NODE) {
          const frag = document.createDocumentFragment();
          const tokens = child.textContent.split(/(\s+)/);
          tokens.forEach((tok) => {
            if (!tok) return;
            if (/^\s+$/.test(tok)) { frag.appendChild(document.createTextNode(' ')); return; }
            const chunks = perChar === 'cjk' ? [...tok] : [tok];
            chunks.forEach((chunk) => {
              const w = document.createElement('span');
              w.className = 'word';
              if (perChar === true) {
                [...chunk].forEach((c) => {
                  const i = document.createElement('i');
                  i.textContent = c;
                  w.appendChild(i);
                });
              } else {
                const i = document.createElement('i');
                i.textContent = chunk;
                w.appendChild(i);
              }
              frag.appendChild(w);
            });
          });
          node.replaceChild(frag, child);
        } else if (child.nodeType === Node.ELEMENT_NODE && child.tagName !== 'BR' && !child.classList.contains('word')) {
          walk(child);
        }
      });
    };
    walk(el);
    return el.querySelectorAll('.word > i');
  }

  /* ---------- smooth scroll ---------- */
  let lenis = null;
  if (!REDUCED) {
    lenis = new Lenis({ duration: 1.25, smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }

  /* ---------- progress bar ---------- */
  gsap.to('#progressBar', {
    scaleX: 1, ease: 'none',
    scrollTrigger: { trigger: document.body, start: 'top top', end: 'max', scrub: 0.4 },
  });

  /* ---------- cursor ---------- */
  const cursor = document.getElementById('cursor');
  if (cursor && window.matchMedia('(pointer: fine)').matches) {
    const dot = cursor.querySelector('.cursor-dot');
    const ring = cursor.querySelector('.cursor-ring');
    const label = cursor.querySelector('.cursor-label');
    const dotX = gsap.quickTo(dot, 'x', { duration: 0.12, ease: 'power2.out' });
    const dotY = gsap.quickTo(dot, 'y', { duration: 0.12, ease: 'power2.out' });
    const ringX = gsap.quickTo(ring, 'x', { duration: 0.45, ease: 'power3.out' });
    const ringY = gsap.quickTo(ring, 'y', { duration: 0.45, ease: 'power3.out' });
    window.addEventListener('mousemove', (e) => {
      dotX(e.clientX); dotY(e.clientY); ringX(e.clientX); ringY(e.clientY);
    }, { passive: true });
    document.addEventListener('mouseover', (e) => {
      const t = e.target.closest('[data-cursor], a, button');
      if (t) {
        cursor.classList.add('is-view');
        label.textContent = t.dataset.cursor === 'view' ? 'view' : '';
      } else {
        cursor.classList.remove('is-view');
      }
    });
  }

  /* ---------- text reveals ---------- */
  document.querySelectorAll('[data-anim]').forEach((el) => {
    if (REDUCED) return;
    const kind = el.dataset.anim;
    if (kind === 'chars' || kind === 'chars-cn') {
      const targets = splitWords(el, kind === 'chars-cn' ? 'cjk' : true);
      gsap.set(targets, { yPercent: 115 });
      gsap.to(targets, {
        yPercent: 0, duration: 1.1, ease: 'expo.out',
        stagger: { each: 0.018, from: 'start' },
        scrollTrigger: { trigger: el, start: 'top 84%', once: true },
      });
    } else if (kind === 'words') {
      const targets = splitWords(el, false);
      gsap.set(targets, { yPercent: 110 });
      gsap.to(targets, {
        yPercent: 0, duration: 1.15, ease: 'expo.out', stagger: 0.028,
        scrollTrigger: { trigger: el, start: 'top 82%', once: true },
      });
    } else {
      gsap.fromTo(el, { opacity: 0, y: 28 }, {
        opacity: 1, y: 0, duration: 1.1, ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 88%', once: true },
      });
    }
  });

  /* ---------- figure reveals ---------- */
  if (!REDUCED) {
    document.querySelectorAll('.ph-frame').forEach((frame) => {
      const img = frame.querySelector('img');
      if (!img) return;
      gsap.set(frame, { clipPath: 'inset(100% 0% 0% 0%)' });
      gsap.set(img, { scale: 1.25 });
      ScrollTrigger.create({
        trigger: frame, start: 'top 90%', once: true,
        onEnter: () => {
          gsap.to(frame, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.3, ease: 'expo.inOut' });
          gsap.to(img, { scale: 1, duration: 1.7, ease: 'expo.out', delay: 0.1 });
        },
      });
    });
  }

  window.addEventListener('load', () => ScrollTrigger.refresh());
})();
