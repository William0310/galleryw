// Home: one continuous journey. A contact-strip hero, then seven pinned chapters — one per
// album — each showing three frames revealed with that album's own WebGL effect while the
// page itself changes colour from place to place, ending at night in Chongqing.
import { albums, photoIds } from './data/albums.js';
import { initScroll, gsap, ScrollTrigger, scroll, scrollToTop } from './core/scroll.js';
import { initNav, albumHref } from './core/nav.js';
import { initTransitions, go } from './core/transition.js';
import { split } from './core/split.js';
import { pick, info, aspect } from './core/img.js';
import { env, pad2, damp, clamp, esc } from './core/env.js';
import { World, FX } from './gl/world.js';

initScroll();
initTransitions();
initNav();

const R = env.reduced;
if (R) document.documentElement.classList.add('is-static');
const total = albums.reduce((n, a) => n + photoIds(a).length, 0);
document.querySelectorAll('[data-total]').forEach((n) => { n.textContent = total; });

const vh = (n) => () => (window.innerHeight * n) / 100;
const body = document.body;
const HERO_PALETTE = { bg: '#ebe8e1', ink: '#151412', accent: '#c2451e' };
gsap.set(body, { '--bg': HERO_PALETTE.bg, '--ink': HERO_PALETTE.ink, '--accent': HERO_PALETTE.accent });

// Each album's fx on the home page and the giant word behind its chapter.
const CH = {
  qinghai: { fx: FX.mirror, word: 'QINGHAI' },
  lijiang: { fx: FX.frost, word: '丽江' },
  xinjiang: { fx: FX.slit, word: 'XINJIANG' },
  japan: { fx: FX.ink, word: '日本' },
  beijing: { fx: FX.scroll, word: '北京' },
  datong: { fx: FX.candle, word: '大同' },
  misc: { fx: FX.neon, word: 'ELSEWHERE' },
};

const world = new World();
if (!world.ok) document.documentElement.classList.add('no-webgl');

// ---------------------------------------------------------------------------------------
// Hero: three contact strips drifting in opposite directions
// ---------------------------------------------------------------------------------------
const hero = document.querySelector('.hero');
const rowsEl = hero.querySelector('.hero__rows');
const tileEls = [];
const rows = [0, 1, 2].map((r) => {
  const row = document.createElement('div');
  row.className = 'hero__row';
  const track = document.createElement('div');
  track.className = 'hero__track';
  // Row r holds the r-th pick of every album; the set is repeated so the loop is seamless.
  for (let rep = 0; rep < 2; rep++) {
    for (const a of albums) {
      const id = a.picks[r];
      const t = document.createElement('a');
      t.className = 'tile';
      t.href = albumHref(a.slug);
      t.setAttribute('data-link', '');
      t.dataset.zh = a.zh; t.dataset.en = a.name; t.dataset.color = a.palette.bg;
      t.setAttribute('aria-label', `${esc(a.name)} ${esc(a.zh)}`);
      if (rep) { t.tabIndex = -1; t.setAttribute('aria-hidden', 'true'); }
      t.style.setProperty('--ar', clamp(aspect(id), 0.66, 1.9).toFixed(3));
      t.innerHTML = `<img src="${pick(id, 480)}" alt="" loading="lazy" decoding="async"><span class="tile__label">${esc(a.zh)}</span>`;
      track.append(t);
      tileEls.push(t);
      world.add(t, { id, fx: FX.tile, gray: 1, reveal: R ? 1 : 0 });
    }
  }
  row.append(track);
  rowsEl.append(row);
  return { row, track, dir: r % 2 ? 1 : -1, speed: [26, 20, 32][r], x: 0 };
});

// Endless drift; scrolling pushes the strips along like wind.
let heroVisible = true;
ScrollTrigger.create({ trigger: hero, start: 'top bottom', end: 'bottom top', onToggle: (s) => {
  heroVisible = s.isActive;
  const t = document.querySelector('.hero__title');
  if (t) t.style.visibility = s.isActive ? '' : 'hidden';
} });
gsap.ticker.add((t, dtMs) => {
  if (!heroVisible || R) return;
  const dt = Math.min(dtMs, 50) / 1000;
  const boost = 1 + Math.min(6, Math.abs(scroll.velocity) * 0.25);
  for (const r of rows) {
    const half = r.track.scrollWidth / 2;
    if (!half) continue;
    r.x += r.dir * r.speed * boost * dt;
    r.x = ((r.x % half) + half) % half;
    r.track.style.transform = `translate3d(${-r.x}px,0,0)`;
  }
});

// Kinetic title: every letter's weight follows the pointer (a slow wave on touch screens).
const title = hero.querySelector('.hero__title');
// The title gets its own band between the first strip and the other two.
rowsEl.insertBefore(title, rows[1].row);
const letters = split(title, { chars: true });
let mx = -1e4;
let centres = [];
const measureLetters = () => { centres = letters.map((l) => { const r = l.getBoundingClientRect(); return r.left + r.width / 2; }); };
hero.addEventListener('pointermove', (e) => { if (e.pointerType === 'mouse') mx = e.clientX; }, { passive: true });
hero.addEventListener('pointerleave', () => { mx = -1e4; });
const weights = letters.map(() => 300);
gsap.ticker.add((t, dtMs) => {
  if (!heroVisible || R) return;
  if (!centres.length) measureLetters();
  const dt = dtMs / 1000;
  const sigma = window.innerWidth * 0.09;
  letters.forEach((l, i) => {
    const target = mx > -1e3
      ? 220 + 680 * Math.exp(-(((centres[i] - mx) / sigma) ** 2))
      : 420 + 300 * Math.sin(t * 1.4 - i * 0.55);
    weights[i] = damp(weights[i], target, 8, dt);
    l.style.fontWeight = String(Math.round(weights[i]));
  });
});
window.addEventListener('resize', () => setTimeout(measureLetters, 50));

// Hero exit: strips part, the title stretches and sinks, tiles wipe away.
if (!R) {
  const tl = gsap.timeline({ scrollTrigger: { trigger: hero, start: 'top top', end: '+=100%', pin: true, scrub: 0.6, refreshPriority: 2 } });
  tl.to(rows[0].row, { y: vh(-34), ease: 'none', duration: 1 }, 0)
    .to(rows[2].row, { y: vh(34), ease: 'none', duration: 1 }, 0)
    .to(rows[1].row, { scale: 1.12, ease: 'none', duration: 1 }, 0)
    .to(title, { yPercent: 60, scaleY: 1.6, opacity: 0, ease: 'power1.in', duration: 0.8 }, 0.15)
    .to(hero.querySelectorAll('.hero__meta, .hero__hint'), { opacity: 0, duration: 0.3 }, 0);
  tileEls.forEach((el, i) => {
    const u = world.u(el);
    // Separate uniform from uReveal (which the intro animates): a scrubbed tween rewinds to
    // the value its property had when the timeline was built, so sharing one property would
    // leave the tiles hidden after scrolling back up.
    if (u && u.uFade) tl.fromTo(u.uFade, { value: 0 }, { value: 1, ease: 'none', duration: 0.3 }, 0.62 + (i % 7) * 0.012);
  });
}

// ---------------------------------------------------------------------------------------
// Chapters
// ---------------------------------------------------------------------------------------
const chaptersEl = document.querySelector('.chapters');
const chapters = albums.map((a, i) => {
  const c = CH[a.slug];
  const sec = document.createElement('section');
  sec.className = `ch ch--${a.slug}`;
  sec.id = a.slug;
  sec.setAttribute('aria-label', `${esc(a.name)} ${esc(a.zh)}`);
  const intro = a.blocks.find((b) => b.type === 'intro');
  const count = photoIds(a).length;
  sec.innerHTML = `
    <div class="ch__stage">
      <div class="ch__word" aria-hidden="true">${esc(c.word)}</div>
      ${a.picks.map((id, k) => `
        <a class="ch__ph ch__ph--${'abc'[k]}" href="${albumHref(a.slug)}" data-id="${id}" style="--ar:${aspect(id).toFixed(4)};--c:${info(id).color}" aria-label="${esc(a.name)}: open album">
          <img src="${pick(id, 960)}" alt="" loading="lazy" decoding="async">
        </a>`).join('')}
      <div class="ch__text">
        <p class="ch__n"><span>${pad2(i + 1)} / ${pad2(albums.length)}</span><span>${esc(a.coords)}</span></p>
        <h2 class="ch__name"><span class="ch__en">${esc(a.short || a.name)}</span><span class="ch__zh">${esc(a.zh)}</span></h2>
        <p class="ch__title">${esc(a.title)} · ${esc(a.zhTitle)}</p>
        <p class="ch__blurb">${esc(intro ? intro.en : '')}</p>
        <a class="ch__cta" href="${albumHref(a.slug)}"><span>Enter album</span><small>${pad2(count)} frames</small><i>→</i></a>
      </div>
    </div>`;
  chaptersEl.append(sec);
  const ph = [...sec.querySelectorAll('.ch__ph')];
  ph.forEach((el, k) => world.add(el, { id: a.picks[k], fx: c.fx, focus: k === 0 ? a.focus : [0.5, 0.5], reveal: R ? 1 : 0 }));
  if (R && c.fx === FX.candle) ph.forEach((el) => { world.u(el).uAmb.value = 1; });
  return { a, sec, stage: sec.querySelector('.ch__stage'), ph, word: sec.querySelector('.ch__word'), text: sec.querySelector('.ch__text') };
});

const REV = (el) => world.u(el).uReveal;
const AMB = (el) => world.u(el).uAmb;

// Per-album choreography inside a pinned, scrubbed timeline (0 → 1 over the pin).
const SCENES = {
  qinghai: ({ tl, ph: [a, b, c], word }) => {
    tl.fromTo(word, { xPercent: 10 }, { xPercent: -10, ease: 'none', duration: 1 }, 0)
      .to(REV(a), { value: 1, duration: 0.28 }, 0)
      .fromTo(a, { y: vh(10) }, { y: vh(-10), ease: 'none', duration: 1 }, 0)
      .to(REV(b), { value: 1, duration: 0.25 }, 0.1)
      .fromTo(b, { x: 0 }, { x: () => -Math.max(0, b.offsetWidth - window.innerWidth * 0.92), ease: 'none', duration: 0.85 }, 0.15)
      .to(REV(c), { value: 1, duration: 0.28 }, 0.22)
      .fromTo(c, { y: vh(28) }, { y: vh(-18), ease: 'none', duration: 1 }, 0);
  },
  lijiang: ({ tl, ph: [a, b, c], word }) => {
    tl.fromTo(word, { y: vh(12) }, { y: vh(-12), ease: 'none', duration: 1 }, 0)
      .fromTo(a, { y: vh(12) }, { y: vh(-10), ease: 'none', duration: 1 }, 0)
      .fromTo(b, { y: vh(34) }, { y: vh(-16), ease: 'none', duration: 1 }, 0)
      .fromTo(c, { y: vh(24) }, { y: vh(-10), ease: 'none', duration: 1 }, 0)
      .to(REV(a), { value: 1, duration: 0.3 }, 0)
      .to(REV(b), { value: 1, duration: 0.3 }, 0.12)
      .to(REV(c), { value: 1, duration: 0.3 }, 0.26);
  },
  xinjiang: ({ tl, ph: [a, b, c], word }) => {
    tl.fromTo(word, { xPercent: 4 }, { xPercent: -6, ease: 'none', duration: 1 }, 0)
      .to(REV(a), { value: 1, duration: 0.32, ease: 'power2.inOut' }, 0)
      .fromTo(a, { scale: 0.86 }, { scale: 1, duration: 0.32, ease: 'none' }, 0)
      .to(a, { y: vh(-16), scale: 0.72, duration: 0.5, ease: 'power1.inOut' }, 0.42)
      .fromTo(b, { y: vh(70) }, { y: vh(0), ease: 'power1.out', duration: 0.45 }, 0.42)
      .to(REV(b), { value: 1, duration: 0.3 }, 0.48)
      .fromTo(c, { y: vh(90) }, { y: vh(6), ease: 'power1.out', duration: 0.5 }, 0.48)
      .to(REV(c), { value: 1, duration: 0.3 }, 0.58);
  },
  japan: ({ tl, ph: [a, b, c], word }) => {
    tl.fromTo(word, { opacity: 0 }, { opacity: 1, duration: 0.3 }, 0)
      .to(REV(a), { value: 1, duration: 0.42, ease: 'none' }, 0)
      .to(REV(b), { value: 1, duration: 0.42, ease: 'none' }, 0.2)
      .to(REV(c), { value: 1, duration: 0.42, ease: 'none' }, 0.36);
    [a, b, c].forEach((el, k) => tl.fromTo(el, { y: vh(6 + k * 2) }, { y: vh(-6 - k * 2), ease: 'none', duration: 1 }, 0));
  },
  beijing: ({ tl, ph: [a, b, c], word }) => {
    tl.fromTo(word, { scale: 1.12, opacity: 0.4 }, { scale: 1, opacity: 1, ease: 'none', duration: 1 }, 0)
      .to(REV(b), { value: 1, duration: 0.32, ease: 'none' }, 0)
      .to(REV(a), { value: 1, duration: 0.36, ease: 'none' }, 0.12)
      .to(REV(c), { value: 1, duration: 0.32, ease: 'none' }, 0.24);
    [b, a, c].forEach((el, k) => tl.fromTo(el, { y: vh(4 + k * 3) }, { y: vh(-5 - k * 3), ease: 'none', duration: 1 }, 0));
  },
  datong: ({ tl, ph: [a, b, c], word, a: album }) => {
    // A dark hall lit by one moving light, then the doors open onto daylight.
    // (The page colour change from shadow to daylight is handled by paletteAt() below.)
    AMB(b).value = 1;
    AMB(c).value = 1;
    tl.to(REV(a), { value: 1, duration: 0.4, ease: 'none' }, 0)
      .fromTo(word, { opacity: 0.1 }, { opacity: 0.4, duration: 0.4 }, 0)
      .to(AMB(a), { value: 1, duration: 0.3, ease: 'power1.inOut' }, 0.45)
      .to(a, { scale: 0.86, y: vh(-6), duration: 0.4, ease: 'none' }, 0.5)
      .fromTo(b, { y: vh(20) }, { y: vh(-8), ease: 'none', duration: 0.5 }, 0.5)
      .to(REV(b), { value: 1, duration: 0.25 }, 0.55)
      .fromTo(c, { y: vh(26) }, { y: vh(0), ease: 'none', duration: 0.4 }, 0.6)
      .to(REV(c), { value: 1, duration: 0.25 }, 0.68);
  },
  misc: ({ tl, ph: [a, b, c], word }) => {
    tl.fromTo(word, { xPercent: 6 }, { xPercent: -8, ease: 'none', duration: 1 }, 0)
      .to(REV(a), { value: 1, duration: 0.3, ease: 'none' }, 0)
      .to(REV(b), { value: 1, duration: 0.3, ease: 'none' }, 0.14)
      .to(REV(c), { value: 1, duration: 0.3, ease: 'none' }, 0.26)
      .fromTo(b, { y: vh(22) }, { y: vh(-12), ease: 'none', duration: 1 }, 0)
      .fromTo(c, { y: vh(34) }, { y: vh(-20), ease: 'none', duration: 1 }, 0);
  },
};

chapters.forEach((ch) => {
  const { a, sec, stage, ph, word, text } = ch;

  // Chapter text lands once, quickly (not scrubbed).
  const nameChars = split(text.querySelector('.ch__en'), { chars: true });
  const textTl = gsap.timeline({ paused: true })
    .fromTo(nameChars, { yPercent: 110 }, { yPercent: 0, duration: 1.1, stagger: 0.03, ease: 'expo.out' })
    .fromTo(text.querySelectorAll('.ch__n, .ch__zh, .ch__title, .ch__blurb, .ch__cta'), { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.9, stagger: 0.06, ease: 'power3.out' }, 0.15);
  if (R) textTl.progress(1);
  else ScrollTrigger.create({ trigger: sec, start: 'top 55%', onEnter: () => textTl.play(), onLeaveBack: () => textTl.reverse() });

  if (R) return;
  const tl = gsap.timeline({
    defaults: { ease: 'power2.out' },
    scrollTrigger: {
      trigger: sec, pin: stage, start: 'top top', end: () => `+=${window.innerHeight * (a.slug === 'datong' ? 2.2 : 1.6)}`,
      scrub: env.touch ? 0.35 : 0.8, invalidateOnRefresh: true, refreshPriority: 1, anticipatePin: 1,
    },
  });
  SCENES[a.slug]({ tl, ph, word, a });
  tl.to({}, { duration: 0.12 }); // a short hold before the next place
  ch.st = tl.scrollTrigger;
  ch.tl = tl;
});

// ---------------------------------------------------------------------------------------
// Colour journey. The page colour is a pure function of the scroll position: a list of
// colour stops rebuilt on every refresh. (Several scrubbed tweens writing the same CSS
// variables fought each other when jumping or scrolling back up.)
// ---------------------------------------------------------------------------------------
let stops = [];
function buildStops() {
  const H = window.innerHeight;
  const topOf = (ch) => (ch.st ? ch.st.start : ch.sec.getBoundingClientRect().top + window.scrollY);
  stops = [{ y: -Infinity, pal: HERO_PALETTE }];
  let prev = HERO_PALETTE;
  for (const ch of chapters) {
    const pal = ch.a.palette;
    const top = topOf(ch);
    stops.push({ y: top - 0.75 * H, pal: prev }, { y: top - 0.3 * H, pal });
    if (pal.end) {
      // Datong: shadow → daylight between 45% and 75% of its scene.
      const len = ch.st ? ch.st.end - ch.st.start : H;
      const d = ch.tl ? ch.tl.duration() : 1;
      stops.push({ y: top + len * (0.45 / d), pal }, { y: top + len * (0.75 / d), pal: pal.end });
    }
    prev = pal.end || pal;
  }
  stops.push({ y: Infinity, pal: prev });
}
const mix = gsap.utils.interpolate;
let lastKey = '';
function paletteAt(y) {
  let i = 0;
  while (i < stops.length - 2 && stops[i + 1].y <= y) i++;
  const A = stops[i], B = stops[i + 1];
  const t = A.pal === B.pal || !isFinite(B.y - A.y) ? 0 : Math.min(1, Math.max(0, (y - A.y) / (B.y - A.y)));
  if (t === 0) return A.pal;
  return { bg: mix(A.pal.bg, B.pal.bg, t), ink: mix(A.pal.ink, B.pal.ink, t), accent: mix(A.pal.accent, B.pal.accent, t) };
}
function applyPalette() {
  const p = paletteAt(window.scrollY);
  const key = p.bg + p.ink + p.accent;
  if (key === lastKey) return;
  lastKey = key;
  body.style.setProperty('--bg', p.bg);
  body.style.setProperty('--ink', p.ink);
  body.style.setProperty('--accent', p.accent);
}
ScrollTrigger.addEventListener('refresh', () => { buildStops(); lastKey = ''; applyPalette(); });
buildStops();
gsap.ticker.add(applyPalette);

// ---------------------------------------------------------------------------------------
// Route: where you are on the road (desktop rail + phone chip)
// ---------------------------------------------------------------------------------------
const route = document.createElement('nav');
route.className = 'route';
route.setAttribute('aria-label', 'Albums on this page');
route.innerHTML = `<span class="route__line"><i></i></span><ol>${albums.map((a, i) => `
  <li><button type="button" data-i="${i}"><span class="route__n">${pad2(i + 1)}</span><span class="route__zh">${esc(a.zh)}</span><span class="route__en">${esc(a.short || a.name)}</span></button></li>`).join('')}</ol>`;
body.append(route);
const chip = document.createElement('div');
chip.className = 'chip';
chip.innerHTML = '<span class="chip__n"></span><span class="chip__name"></span><button type="button" class="chip__go">Enter →</button>';
body.append(chip);

let current = -1;
const setCurrent = (i) => {
  if (i === current) return;
  current = i;
  route.querySelectorAll('li').forEach((li, k) => li.classList.toggle('is-active', k === i));
  const a = albums[i];
  chip.querySelector('.chip__n').textContent = pad2(i + 1);
  chip.querySelector('.chip__name').textContent = `${esc(a.zh)} ${esc(a.short || a.name)}`;
};
chapters.forEach((ch, i) => {
  ScrollTrigger.create({ trigger: ch.sec, start: 'top 50%', end: 'bottom 50%', onToggle: (s) => { if (s.isActive) setCurrent(i); } });
});
ScrollTrigger.create({
  trigger: chaptersEl, start: 'top 60%', end: 'bottom 40%',
  onToggle: (s) => body.classList.toggle('in-journey', s.isActive),
  onUpdate: (s) => { route.querySelector('.route__line i').style.transform = `scaleY(${s.progress})`; },
});
// Land a little way into the chapter, where its frames are already developing.
const chapterY = (ch) => (ch.st ? ch.st.start + (ch.st.end - ch.st.start) * 0.42 : ch.sec.getBoundingClientRect().top + window.scrollY);
route.addEventListener('click', (e) => {
  const b = e.target.closest('button[data-i]');
  if (!b) return;
  const y = chapterY(chapters[+b.dataset.i]);
  if (scroll.lenis) scroll.lenis.scrollTo(y, { duration: 1.8 });
  else window.scrollTo({ top: y, behavior: 'smooth' });
});

// ---------------------------------------------------------------------------------------
// Entering an album: the chapter's cover frame grows to fill the screen, and the album
// page opens on exactly that frame.
// ---------------------------------------------------------------------------------------
let entering = false;
function enter(i) {
  if (entering) return;
  const ch = chapters[i];
  const href = albumHref(ch.a.slug);
  const coverEl = ch.ph[0];
  const r = coverEl.getBoundingClientRect();
  const visible = r.bottom > 0 && r.top < window.innerHeight && (world.u(coverEl)?.uReveal.value || 0) > 0.05;
  if (!world.ok || R || !visible) {
    go(href, { zh: ch.a.zh, en: ch.a.name, color: ch.a.palette.bg });
    return;
  }
  entering = true;
  document.documentElement.classList.add('is-expanding');
  gsap.to('.page, .site-head, .route, .chip, .cursor', { opacity: 0, duration: 0.45, ease: 'power2.out' });
  world.expand(coverEl, 1.1).add(() => go(href, {}, { curtain: false }));
}
chapters.forEach((ch, i) => {
  ch.sec.addEventListener('click', (e) => {
    const t = e.target.closest('.ch__ph, .ch__cta');
    if (!t || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault();
    enter(i);
  });
});
chip.querySelector('.chip__go').addEventListener('click', () => current >= 0 && enter(current));

// ---------------------------------------------------------------------------------------
// Cursor (mouse only)
// ---------------------------------------------------------------------------------------
if (!env.touch) {
  const cur = document.createElement('div');
  cur.className = 'cursor';
  cur.innerHTML = '<span class="cursor__label"></span>';
  body.append(cur);
  const label = cur.firstChild;
  const pos = { x: -100, y: -100, tx: -100, ty: -100 };
  window.addEventListener('pointermove', (e) => { pos.tx = e.clientX; pos.ty = e.clientY; }, { passive: true });
  document.addEventListener('pointerover', (e) => {
    const t = e.target.closest('.ch__ph, .tile, .ch__cta');
    cur.classList.toggle('is-on', !!t);
    if (t) label.textContent = t.classList.contains('tile') ? t.dataset.zh : 'Enter';
  });
  gsap.ticker.add(() => {
    pos.x += (pos.tx - pos.x) * 0.2;
    pos.y += (pos.ty - pos.y) * 0.2;
    cur.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0)`;
  });
}

// ---------------------------------------------------------------------------------------
// About + the end (night continues from Chongqing)
// ---------------------------------------------------------------------------------------
if (!R) {
  gsap.fromTo('.about__img img', { yPercent: -8 }, { yPercent: 8, ease: 'none', scrollTrigger: { trigger: '.about', start: 'top bottom', end: 'bottom top', scrub: true } });
  gsap.fromTo('.end__sign', { opacity: 0, scale: 1.12 }, { opacity: 1, scale: 1, ease: 'power2.out', scrollTrigger: { trigger: '.end', start: 'top 85%', end: 'center 55%', scrub: true } });
}
document.querySelector('.end__top')?.addEventListener('click', () => scrollToTop());
document.querySelector('.end__year').textContent = new Date().getFullYear();

// ---------------------------------------------------------------------------------------
// Preloader → intro
// ---------------------------------------------------------------------------------------
const pre = document.querySelector('.preloader');
const preNum = pre.querySelector('.preloader__num');
const preStrip = pre.querySelector('.preloader__strip');
const shown = { v: 0 };
let target = 0;
const preTick = () => {
  shown.v += (target - shown.v) * 0.14;
  preNum.textContent = String(Math.round(shown.v * 100)).padStart(2, '0');
  preStrip.style.transform = `scaleX(${shown.v})`;
};
gsap.ticker.add(preTick);
gsap.set(letters, { yPercent: 110 });

async function boot() {
  // Only the first copy of each strip is needed before the page can start.
  const firstTiles = tileEls.filter((t) => !t.hasAttribute('aria-hidden'));
  await Promise.race([
    Promise.all([world.preload(firstTiles, (p) => { target = p * 0.9; }), document.fonts ? document.fonts.ready : null]),
    new Promise((r) => setTimeout(r, 8000)),
  ]);
  target = 1;
  await new Promise((r) => gsap.to(shown, { v: 1, duration: 0.4, onComplete: r }));
  gsap.ticker.remove(preTick);
  measureLetters();
  ScrollTrigger.refresh();
  const tl = gsap.timeline();
  tl.to(pre.querySelector('.preloader__row'), { yPercent: -100, opacity: 0, duration: 0.6, ease: 'power3.in' })
    .to(pre, { clipPath: 'inset(0% 0% 100% 0%)', duration: 1, ease: 'expo.inOut' }, '-=0.1')
    .to(letters, { yPercent: 0, duration: 1.4, stagger: 0.04, ease: 'expo.out' }, '-=0.55')
    .fromTo(hero.querySelectorAll('.hero__meta, .hero__hint'), { opacity: 0 }, { opacity: 1, duration: 1 }, '-=1');
  // Tiles develop like prints, column by column.
  if (!R) {
    tileEls.forEach((el, i) => {
      const u = world.u(el);
      if (u) tl.to(u.uReveal, { value: 1, duration: 1.4, ease: 'power2.out' }, 0.9 + (i % 7) * 0.08 + Math.floor(i / 14) * 0.15);
    });
  }
  tl.add(() => pre.remove());
}
boot();

// One render per frame for the whole page.
gsap.ticker.add((t, dt) => world.render(t, dt / 1000));

document.fonts?.ready.then(() => { measureLetters(); ScrollTrigger.refresh(); });
window.addEventListener('load', () => ScrollTrigger.refresh());
document.addEventListener('wp:restored', () => {
  // Back button from an album: undo the expanding state.
  entering = false;
  document.documentElement.classList.remove('is-expanding');
  gsap.set('.page, .site-head, .route, .chip, .cursor', { opacity: 1 });
  if (world.expanding) {
    world.expanding.uniforms.uExpand.value = 0;
    world.expanding.mesh.renderOrder = 0;
    world.expanding = null;
  }
  ScrollTrigger.refresh();
});

// Handle for debugging / performance checks from the console.
window.__wp = { world, gsap, ScrollTrigger };
