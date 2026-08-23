/* ==========================================================
   行记 — Datong (大同) album · dark subpage
   The album is now a single movement: the temple dark, within the walls.
   The page stays on the dark ground throughout (body keeps .theme-dark).
   ========================================================== */
(function () {
  'use strict';

  gsap.registerPlugin(ScrollTrigger);
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

  const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const MOBILE = window.innerWidth < 821;

  /* ---------- photographs ---------- */
  const DARK = [
    { src: 'assets/img/datong5.webp',  cap: '薄伽教藏殿 — three Buddhas keep the gold in the dark', l: 'full' },
    { src: 'assets/img/datong2.webp',  cap: '华严寺 — eaves folded against a hard sky', l: 'tall' },
    { src: 'assets/img/datong4.webp',  cap: 'the great hall holds its breath under weather', l: 'tall' },
    { src: 'assets/img/datong10.webp', cap: 'the swallows file their evening report', l: 'tall' },
    { src: 'assets/img/datong7.webp',  cap: '彩塑 — a thousand years of patient gilding', l: 'full' },
    { src: 'assets/img/datong1.webp',  cap: 'roofs stacked like a closed argument', l: 'wide' },
    { src: 'assets/img/datong9.webp',  cap: '三圣殿 — a door kept shut on the cold', l: 'tall' },
    { src: 'assets/img/datong8.webp',  cap: 'autumn leans on the lattice', l: 'tall' },
    { src: 'assets/img/datong3.webp',  cap: '鼓楼 — the drum tower, kept by the pines', l: 'std' },
    { src: 'assets/img/datong11.webp', cap: '善化寺 — two lions, one long silence', l: 'wide' },
    { src: 'assets/img/datong6.webp',  cap: 'a courtyard, read through a keyhole arch', l: 'tall' },
    { src: 'assets/img/datong12.webp', cap: 'the ridge line, signed by birds', l: 'tall' },
  ];

  /* ---------- render the grid (running №, eager for the first couple) ---------- */
  let n = 0;
  function render(list, mount) {
    const frag = document.createDocumentFragment();
    list.forEach((p) => {
      n += 1;
      const fig = document.createElement('figure');
      fig.className = `ph al-${p.l}`;
      fig.dataset.cursor = 'view';
      if (p.l === 'std' || p.l === 'tall') fig.dataset.speed = (n % 2 ? -0.08 : 0.08).toString();
      fig.innerHTML = `
        <div class="ph-frame${p.l === 'full' ? ' deep' : ''}">
          <img src="${p.src}" alt="${p.cap.replace(/"/g, '&quot;')}" loading="${n <= 2 ? 'eager' : 'lazy'}" decoding="async"${p.l === 'full' ? ' data-deep' : ''}>
        </div>
        <figcaption><span>№${String(n).padStart(2, '0')}</span>${p.cap}</figcaption>`;
      frag.appendChild(fig);
    });
    mount.appendChild(frag);
  }
  render(DARK, document.getElementById('datongDark'));

  /* the page stays dark end to end (body keeps .theme-dark from the markup) */
  if (!REDUCED) requestAnimationFrame(() => document.body.classList.add('theme-anim'));

  /* ---------- smooth scroll ---------- */
  let lenis = null;
  if (!REDUCED) {
    lenis = new Lenis({ duration: 1.25, smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }

  /* ---------- progress ---------- */
  gsap.to('#progressBar', {
    scaleX: 1, ease: 'none',
    scrollTrigger: { trigger: document.body, start: 'top top', end: 'max', scrub: 0.4 },
  });

  /* ---------- head intro ---------- */
  if (!REDUCED) {
    gsap.from('.album-head > *', { y: 40, opacity: 0, duration: 1.2, ease: 'expo.out', stagger: 0.09, delay: 0.15 });
  }

  /* ---------- cursor ---------- */
  const cursor = document.getElementById('cursor');
  if (window.matchMedia('(pointer: fine)').matches) {
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

  /* ---------- reveals + parallax ---------- */
  if (!REDUCED) {
    document.querySelectorAll('.ph .ph-frame').forEach((frame) => {
      const img = frame.querySelector('img');
      gsap.set(frame, { clipPath: 'inset(100% 0% 0% 0%)' });
      gsap.set(img, { scale: 1.32 });
      ScrollTrigger.create({
        trigger: frame, start: 'top 88%', once: true,
        onEnter: () => {
          gsap.to(frame, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.35, ease: 'expo.inOut' });
          gsap.to(img, { scale: 1, duration: 1.8, ease: 'expo.out', delay: 0.1 });
        },
      });
    });
    document.querySelectorAll('.ph-frame.deep img').forEach((img) => {
      gsap.fromTo(img, { yPercent: -11 }, {
        yPercent: 0, ease: 'none',
        scrollTrigger: { trigger: img.closest('.ph-frame'), start: 'top bottom', end: 'bottom top', scrub: true },
      });
    });
    const PX = MOBILE ? 0.5 : 1;
    document.querySelectorAll('[data-speed]').forEach((el) => {
      const speed = parseFloat(el.dataset.speed) * PX;
      gsap.fromTo(el, { y: speed * 220 }, {
        y: speed * -220, ease: 'none',
        scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true },
      });
    });
  }

  /* ---------- lightbox ---------- */
  const lightbox = document.getElementById('lightbox');
  const lbImg = document.getElementById('lightboxImg');
  const lbVeil = document.getElementById('lightboxVeil');
  const lbCap = document.getElementById('lightboxCap');
  const lbClose = document.getElementById('lightboxClose');
  let lbOpen = false;

  function openLightbox(img, caption) {
    if (lbOpen) return;
    lbOpen = true;
    const rect = img.getBoundingClientRect();
    lbImg.src = img.currentSrc || img.src;
    lbCap.textContent = caption || '';
    lightbox.classList.add('is-open');
    if (lenis) lenis.stop();
    const natW = img.naturalWidth || rect.width;
    const natH = img.naturalHeight || rect.height;
    const margin = Math.min(window.innerWidth, window.innerHeight) * 0.06;
    const maxW = window.innerWidth - margin * 2;
    const maxH = window.innerHeight - margin * 2 - 40;
    const ratio = Math.min(maxW / natW, maxH / natH);
    const tw = natW * ratio, th = natH * ratio;
    const tx = (window.innerWidth - tw) / 2, ty = (window.innerHeight - th - 30) / 2;
    gsap.set(lbImg, { left: rect.left, top: rect.top, width: rect.width, height: rect.height });
    gsap.to(lbVeil, { opacity: 1, duration: 0.45, ease: 'power2.out' });
    gsap.to(lbImg, { left: tx, top: ty, width: tw, height: th, duration: 0.75, ease: 'expo.inOut' });
    gsap.to([lbCap, lbClose], { opacity: 1, duration: 0.4, delay: 0.4 });
  }

  function closeLightbox() {
    if (!lbOpen) return;
    lbOpen = false;
    gsap.to([lbCap, lbClose], { opacity: 0, duration: 0.2 });
    gsap.to(lbImg, { opacity: 0, scale: 0.96, duration: 0.4, ease: 'power2.in' });
    gsap.to(lbVeil, {
      opacity: 0, duration: 0.5, delay: 0.1,
      onComplete: () => {
        lightbox.classList.remove('is-open');
        gsap.set(lbImg, { opacity: 1, scale: 1 });
        if (lenis) lenis.start();
      },
    });
  }

  document.querySelector('.datong-page').addEventListener('click', (e) => {
    const img = e.target.closest('.ph-frame img');
    if (!img) return;
    const cap = img.closest('figure')?.querySelector('figcaption')?.textContent.trim() || '';
    openLightbox(img, cap);
  });
  lbVeil.addEventListener('click', closeLightbox);
  lbClose.addEventListener('click', closeLightbox);
  window.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeLightbox(); });

  window.addEventListener('load', () => ScrollTrigger.refresh());
})();
