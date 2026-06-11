/* ==========================================================
   行记 — scroll "golden-centre" focus
   A photo sitting on the exact vertical centre of the viewport
   is at full clarity; as it drifts toward an edge (sliding in or
   out) it eases down in opacity + scale and picks up a faint
   grayscale / blur. Driven per-frame off the shared GSAP ticker
   so it stays in sync with the Lenis smooth scroll & parallax.

   Targets only the framed photos (.ph-frame). The pinned pano /
   zoom / aperture scenes use other classes and are left alone.
   ========================================================== */
(function () {
  'use strict';

  const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (REDUCED) return;

  const MOBILE = window.innerWidth < 821;

  /* bell width, in units of half the viewport height */
  const SIGMA = 0.55;

  /* the "edge" look (reached as focus → 0) */
  const OPACITY_DROP = 0.60;   // → opacity .40
  const SCALE_DROP   = 0.06;   // → scale .94
  const GRAY_MAX     = 0.30;   // → grayscale(.30)
  const SAT_DROP     = 0.15;   // → saturate(.85)
  const BRIGHT_DROP  = 0.10;   // → brightness(.90)
  const BLUR_MAX     = MOBILE ? 0 : 1.4;   // px — blur is costly on mobile

  let frames = [];
  function collect() {
    frames = Array.from(document.querySelectorAll('.ph .ph-frame, .about-photo .ph-frame'))
      .map((el) => {
        el.style.willChange = 'transform, filter, opacity';
        return { el, last: -1 };
      });
  }
  collect();
  if (!frames.length) return;

  function apply(f, focus) {
    /* quantise so we don't re-paint on imperceptible deltas */
    const q = Math.round(focus * 50) / 50;
    if (q === f.last) return;
    f.last = q;
    const inv = 1 - q;
    f.el.style.opacity = (1 - OPACITY_DROP * inv).toFixed(3);
    f.el.style.transform = 'scale(' + (1 - SCALE_DROP * inv).toFixed(4) + ')';
    f.el.style.filter =
      'grayscale(' + (GRAY_MAX * inv).toFixed(3) + ') ' +
      'saturate(' + (1 - SAT_DROP * inv).toFixed(3) + ') ' +
      'brightness(' + (1 - BRIGHT_DROP * inv).toFixed(3) + ') ' +
      'blur(' + (BLUR_MAX * inv).toFixed(2) + 'px)';
  }

  let lastScroll = NaN;
  function update() {
    const sy = window.scrollY || window.pageYOffset || 0;
    if (sy === lastScroll) return;
    lastScroll = sy;

    const vh = window.innerHeight;
    const vc = vh / 2;
    const half = vh / 2;
    for (let i = 0; i < frames.length; i++) {
      const r = frames[i].el.getBoundingClientRect();
      if (r.bottom < -60 || r.top > vh + 60) { apply(frames[i], 0); continue; }
      let t = Math.abs((r.top + r.height / 2) - vc) / half;
      if (t > 1) t = 1;
      const x = t / SIGMA;
      apply(frames[i], Math.exp(-0.5 * x * x));
    }
  }

  /* drive off the GSAP ticker (interpolates every smooth-scroll frame) AND
     native scroll events (guarantees a fresh value once motion settles, and
     keeps working if rAF is throttled). The scrollY gate dedupes the two. */
  if (window.gsap && gsap.ticker) gsap.ticker.add(update);
  window.addEventListener('scroll', update, { passive: true });

  window.addEventListener('resize', () => { lastScroll = NaN; update(); });
  window.addEventListener('load', () => { collect(); lastScroll = NaN; update(); });
  update();
})();
