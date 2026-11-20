// Scroll choreography for album pages. Every album shares the same block types but gets
// its own "reveal grammar", so Japan breathes slowly while Qinghai slams frames open.
import { gsap, ScrollTrigger } from '../core/scroll.js';
import { split } from '../core/split.js';
import { env } from '../core/env.js';

const R = env.reduced;

// How a photo enters, per album.
const REVEALS = {
  qinghai: (frame, inner) => gsap.timeline()
    .fromTo(frame, { clipPath: 'inset(16% 14% 16% 14%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.3, ease: 'expo.out' })
    .fromTo(inner, { scale: 1.4 }, { scale: 1, duration: 1.8, ease: 'expo.out' }, 0),
  lijiang: (frame, inner) => gsap.timeline()
    .fromTo(frame, { clipPath: 'inset(0% 0% 0% 100%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.4, ease: 'expo.inOut' })
    .fromTo(inner, { xPercent: -12, scale: 1.15 }, { xPercent: 0, scale: 1, duration: 1.6, ease: 'expo.inOut' }, 0),
  xinjiang: (frame, inner) => gsap.timeline()
    .fromTo(frame, { clipPath: 'inset(50% 0% 50% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.5, ease: 'expo.inOut' })
    .fromTo(inner, { scale: 1.25 }, { scale: 1, duration: 2, ease: 'power3.out' }, 0),
  japan: (frame, inner) => gsap.timeline()
    .fromTo(frame, { opacity: 0, y: 50 }, { opacity: 1, y: 0, duration: 2.2, ease: 'power2.out' })
    .fromTo(inner, { scale: 1.06 }, { scale: 1, duration: 3, ease: 'power2.out' }, 0),
  beijing: (frame, inner) => gsap.timeline()
    .fromTo(frame, { clipPath: 'inset(0% 0% 100% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.6, ease: 'power4.inOut' })
    .fromTo(inner, { yPercent: -10, scale: 1.12 }, { yPercent: 0, scale: 1, duration: 1.9, ease: 'power3.out' }, 0),
  datong: (frame, inner) => gsap.timeline()
    // Temple doors swinging open from the centre line.
    .fromTo(frame, { clipPath: 'inset(0% 50% 0% 50%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.6, ease: 'expo.inOut' })
    .fromTo(inner, { scale: 1.2, filter: 'brightness(0.3)' }, { scale: 1, filter: 'brightness(1)', duration: 2, ease: 'power2.out', clearProps: 'filter' }, 0),
  misc: (frame, inner) => gsap.timeline()
    .fromTo(frame, { clipPath: 'inset(12% 0% 0% 0%)', opacity: 0 }, { clipPath: 'inset(0% 0% 0% 0%)', opacity: 1, duration: 1.4, ease: 'power3.out' })
    .fromTo(inner, { yPercent: 6, scale: 1.08 }, { yPercent: 0, scale: 1, duration: 1.8, ease: 'power3.out' }, 0),
};

export function heroMotion(hero, gl) {
  const text = hero.querySelector('.hero__text');
  const name = hero.querySelector('.hero__name');
  const zh = hero.querySelector('.hero__zh');
  const chars = [...split(name, { chars: true }), ...split(zh)];
  const intro = gsap.timeline({ delay: 0.25 })
    .fromTo(chars, { yPercent: 110 }, { yPercent: 0, duration: R ? 0.01 : 1.4, stagger: 0.035, ease: 'expo.out' })
    .fromTo(hero.querySelectorAll('.hero__kicker, .hero__sub, .hero__meta, .hero__view, .hero__cue'), { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 1, stagger: 0.08, ease: 'power3.out' }, '-=1.0');

  // Hero exit: GL zooms & fades; text drifts up faster than the page.
  ScrollTrigger.create({
    trigger: hero,
    start: 'top top',
    end: 'bottom top',
    scrub: true,
    onUpdate: (st) => gl && gl.setScroll(st.progress),
  });
  if (!R) {
    gsap.to(text, { yPercent: -35, opacity: 0, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: '80% top', scrub: true } });
  }
  return intro;
}

export function blockMotion(root, album) {
  const reveal = REVEALS[album.slug] || REVEALS.qinghai;

  // --- pinned sections first, strictly in document order -----------------------------
  // ScrollTrigger computes positions in creation order; every later trigger must already
  // know how much scroll each earlier pin adds, or panoramas start overlapping each other.
  root.querySelectorAll('.b-pano, .b-strip, .b-seq').forEach((s) => {
    if (s.classList.contains('b-pano')) {
      horizontal(s, s.querySelector('.b-pano__pin'), s.querySelector('.b-pano__track'), {
        map: s.querySelector('.b-pano__map i'),
        minRatio: 0.22,
        onFit: () => s.classList.add('b-pano--fit'),
      });
    } else if (s.classList.contains('b-strip')) {
      horizontal(s, s.querySelector('.b-strip__pin'), s.querySelector('.b-strip__track'), {
        bar: s.querySelector('.b-strip__progress i'),
        minRatio: 0.05,
        onFit: () => s.classList.add('b-strip--fit'),
      });
    } else sequence(s);
  });

  // --- generic figure reveals -------------------------------------------------------
  root.querySelectorAll('.b-full .ph, .b-row .ph, .b-solo .ph, .b-grid .ph, .next .ph').forEach((fig) => {
    const frame = fig.querySelector('.ph__frame');
    const inner = fig.querySelector('.ph__inner');
    const cap = fig.querySelector('.ph__cap');
    if (R) return;
    const tl = reveal(frame, inner).pause();
    if (cap) tl.fromTo(cap, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.9, ease: 'power2.out' }, 0.5);
    ScrollTrigger.create({ trigger: fig, start: 'top 88%', once: true, onEnter: () => tl.play() });
  });

  // --- parallax inside full-bleed frames ----------------------------------------------
  if (!R && album.slug !== 'japan') {
    root.querySelectorAll('.b-full .ph__img, .b-full .ph__lqip').forEach((img) => {
      gsap.fromTo(img, { yPercent: -6 }, { yPercent: 6, ease: 'none', scrollTrigger: { trigger: img.closest('.b-full'), start: 'top bottom', end: 'bottom top', scrub: true } });
    });
  }

  // --- intro / quote / chapter text --------------------------------------------------
  root.querySelectorAll('.b-intro').forEach((s) => {
    const words = split(s.querySelector('.b-intro__lead'));
    const tl = gsap.timeline({ paused: true })
      .fromTo(words, { yPercent: 110 }, { yPercent: 0, duration: 1.2, stagger: 0.03, ease: 'expo.out' })
      .fromTo(s.querySelectorAll('.b-intro__en, .b-intro__body'), { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 1.1, stagger: 0.12, ease: 'power3.out' }, 0.3);
    ScrollTrigger.create({ trigger: s, start: 'top 80%', once: true, onEnter: () => tl.play() });
  });

  root.querySelectorAll('.b-quote').forEach((s) => {
    const words = split(s.querySelector('.b-quote__zh'));
    gsap.fromTo(words, { opacity: 0.12 }, { opacity: 1, stagger: 0.1, ease: 'none', scrollTrigger: { trigger: s, start: 'top 75%', end: 'center 45%', scrub: true } });
    gsap.fromTo(s.querySelector('.b-quote__en'), { opacity: 0 }, { opacity: 1, scrollTrigger: { trigger: s, start: 'center 60%', end: 'center 40%', scrub: true } });
  });

  root.querySelectorAll('.b-chapter').forEach((s) => {
    const chars = split(s.querySelector('.b-chapter__zh'));
    const tl = gsap.timeline({ paused: true })
      .fromTo(s.querySelector('.b-chapter__num'), { opacity: 0, scale: 0.6 }, { opacity: 1, scale: 1, duration: 1.4, ease: 'expo.out' })
      .fromTo(chars, { yPercent: 110 }, { yPercent: 0, duration: 1.2, stagger: 0.08, ease: 'expo.out' }, 0.1)
      .fromTo(s.querySelector('.b-chapter__en'), { opacity: 0 }, { opacity: 1, duration: 1 }, 0.5)
      .fromTo(s.querySelector('.b-chapter__rule'), { scaleX: 0 }, { scaleX: 1, duration: 1.4, ease: 'expo.inOut' }, 0.3);
    ScrollTrigger.create({ trigger: s, start: 'top 75%', once: true, onEnter: () => tl.play() });
  });

  // --- chapter palette shifts (Datong: shadow → light) --------------------------------
  const body = document.body;
  const cs = getComputedStyle(body);
  let prev = { bg: cs.getPropertyValue('--bg').trim(), fg: cs.getPropertyValue('--fg').trim(), muted: cs.getPropertyValue('--muted').trim() };
  root.querySelectorAll('.b-chapter[data-palette]').forEach((s) => {
    const next = JSON.parse(s.dataset.palette);
    const from = { '--bg': prev.bg, '--fg': prev.fg, '--muted': prev.muted };
    const to = { '--bg': next.bg, '--fg': next.fg, '--muted': next.muted };
    gsap.fromTo(body, from, { ...to, ease: 'none', immediateRender: false, scrollTrigger: { trigger: s, start: 'top 75%', end: 'top 35%', scrub: true } });
    prev = next;
  });

  // --- marquee ------------------------------------------------------------------------
  root.querySelectorAll('.b-marquee').forEach((s) => {
    const [a, b] = s.querySelectorAll('.b-marquee__line');
    gsap.fromTo(a, { xPercent: 0 }, { xPercent: -25, ease: 'none', scrollTrigger: { trigger: s, start: 'top bottom', end: 'bottom top', scrub: true } });
    gsap.fromTo(b, { xPercent: -25 }, { xPercent: 0, ease: 'none', scrollTrigger: { trigger: s, start: 'top bottom', end: 'bottom top', scrub: true } });
  });

  // --- altitude counter ---------------------------------------------------------------
  root.querySelectorAll('.b-counter').forEach((s) => {
    const val = s.querySelector('.b-counter__val');
    const to = +val.dataset.to;
    const gauge = s.querySelector('.b-counter__gauge i');
    const fmt = new Intl.NumberFormat('en-US');
    const st = { v: 0 };
    gsap.to(st, {
      v: to, ease: 'power1.inOut',
      scrollTrigger: { trigger: s, start: 'top 85%', end: 'center 45%', scrub: true },
      onUpdate: () => {
        val.textContent = fmt.format(Math.round(st.v));
        gauge.style.transform = `scaleY(${st.v / to})`;
      },
    });
    if (R) { val.textContent = fmt.format(to); gauge.style.transform = 'scaleY(1)'; }
  });

  // --- next album -----------------------------------------------------------------------
  root.querySelectorAll('.next').forEach((s) => {
    const name = s.querySelector('.next__name');
    const chars = split(name, { chars: true });
    gsap.fromTo(chars, { yPercent: 110 }, { yPercent: 0, stagger: 0.03, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: s, start: 'top 70%', once: true } });
  });
}

// Pins `pin` and slides `track` sideways for exactly its overflow. If the content nearly
// fits already (a 2.3:1 pano on a 21:9 monitor), it is shown statically instead.
function horizontal(section, pin, track, { map, bar, minRatio = 0.2, onFit }) {
  const dist = () => Math.max(0, track.scrollWidth - pin.clientWidth);
  if (R || dist() < window.innerWidth * minRatio) {
    onFit && onFit();
    // Even when fitted, a reduced-motion user can still scroll the track natively.
    if (R) track.parentElement.classList.add('is-native');
    return;
  }
  section.classList.add('is-pinned');
  const frac = () => Math.min(1, pin.clientWidth / track.scrollWidth);
  if (map) map.style.width = `${frac() * 100}%`;
  gsap.to(track, {
    x: () => -dist(),
    ease: 'none',
    scrollTrigger: {
      trigger: section,
      pin,
      start: 'top top',
      end: () => `+=${dist()}`,
      scrub: env.touch ? 0.4 : 0.9,
      invalidateOnRefresh: true,
      refreshPriority: 1,
      anticipatePin: 1,
      onRefresh: () => { if (map) map.style.width = `${frac() * 100}%`; },
      onUpdate: (st) => {
        if (map) map.style.left = `${st.progress * (1 - frac()) * 100}%`;
        if (bar) bar.style.transform = `scaleX(${st.progress})`;
      },
    },
  });
}

function sequence(section) {
  const pin = section.querySelector('.b-seq__pin');
  const figs = [...section.querySelectorAll('.ph--seq')];
  const labels = [...section.querySelectorAll('.b-seq__labels li')];
  labels[0]?.classList.add('is-active');
  if (R) { section.classList.add('is-static'); return; }
  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: section,
      pin,
      start: 'top top',
      end: () => `+=${window.innerHeight * (figs.length - 1) * 0.9}`,
      scrub: 0.6,
      invalidateOnRefresh: true,
      refreshPriority: 1,
      onUpdate: (st) => {
        const i = Math.min(figs.length - 1, Math.round(st.progress * (figs.length - 1)));
        labels.forEach((l, j) => l.classList.toggle('is-active', j === i));
      },
    },
  });
  figs.slice(1).forEach((f, i) => {
    tl.fromTo(f.querySelector('.ph__frame'), { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', ease: 'none', duration: 1 }, i)
      .fromTo(f.querySelector('.ph__inner'), { scale: 1.2, yPercent: 8 }, { scale: 1, yPercent: 0, ease: 'none', duration: 1 }, i)
      .fromTo(figs[i].querySelector('.ph__inner'), { scale: 1, filter: 'brightness(1)' }, { scale: 0.92, filter: 'brightness(0.55)', ease: 'none', duration: 1 }, i);
  });
}
