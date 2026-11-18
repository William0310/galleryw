// Turns an album's block list into DOM. Purely structural — motion lives in motion.js.
import { figure, aspect, info, caption } from '../core/img.js';
import { albums, photoIds } from '../data/albums.js';
import { albumHref, linkData } from '../core/nav.js';
import { pad2, esc } from '../core/env.js';

const el = (tag, cls, html) => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (html != null) n.innerHTML = html;
  return n;
};

export function renderHero(album) {
  const i = albums.indexOf(album);
  const count = photoIds(album).length;
  const m = info(album.cover);
  const sec = el('section', 'hero');
  sec.setAttribute('aria-label', `${esc(album.name)} ${esc(album.zh)}`);
  // DOM fallback / first paint: identical crop to the GL cover (object-position = focus).
  sec.innerHTML = `
    <div class="hero__media">
      <img class="hero__fallback" alt="" aria-hidden="true" src="${m.lqip}" style="object-position:${album.focus[0] * 100}% ${album.focus[1] * 100}%">
    </div>
    <div class="hero__shade"></div>
    <div class="hero__text">
      <p class="hero__kicker"><span>Album ${pad2(i + 1)} / ${pad2(albums.length)}</span><span>${esc(album.coords)}</span></p>
      <h1 class="hero__title"><span class="hero__name">${esc(album.name)}</span><span class="hero__zh">${esc(album.zh)}</span></h1>
      <p class="hero__sub"><span class="hero__en">${esc(album.title)}</span><span class="hero__zht">${esc(album.zhTitle)}</span></p>
      <p class="hero__meta"><span>${pad2(count)} frames</span><span>${esc(album.note)}</span></p>
    </div>
    <button class="hero__view" type="button" data-open="${album.cover}"><span>View full frame</span><i>↗</i></button>
    <div class="hero__cue" aria-hidden="true"><span>Scroll</span><i></i></div>`;
  return sec;
}

const SIZES = {
  full: '100vw',
  solo: { s: '(max-width: 760px) 80vw, 34vw', m: '(max-width: 760px) 92vw, 52vw', l: '(max-width: 760px) 100vw, 72vw', xl: '(max-width: 760px) 100vw, 88vw' },
};

function blockIntro(b, album) {
  const s = el('section', 'b b-intro');
  s.innerHTML = `
    <p class="b-intro__lead" lang="${album.slug === 'japan' ? 'ja' : 'zh'}">${esc(b.zh)}</p>
    <p class="b-intro__en">${esc(b.en)}</p>
    <p class="b-intro__body">${esc(b.body)}</p>`;
  return s;
}

function blockFull(b) {
  const s = el('section', 'b b-full');
  const ar = aspect(b.id);
  s.style.setProperty('--ar', ar.toFixed(4));
  s.append(figure(b.id, { sizes: SIZES.full, className: 'ph--full' }));
  return s;
}

function blockRow(b) {
  const s = el('section', `b b-row ${b.gap === 'wide' ? 'b-row--wide' : ''}`);
  const ars = b.ids.map(aspect);
  const sum = ars.reduce((a, c) => a + c, 0);
  // On phones stack a row whose combined width would make the frames too short.
  if (sum > 1.45) s.classList.add('b-row--stack');
  s.style.setProperty('--n', b.ids.length);
  s.style.setProperty('--sum', sum.toFixed(3));
  b.ids.forEach((id, i) => {
    const share = ars[i] / sum;
    const f = figure(id, { sizes: `(max-width: 760px) ${sum > 1.45 ? 100 : Math.round(share * 100)}vw, ${Math.round(share * 92)}vw` });
    f.style.flex = `${ars[i]} 1 0`;
    s.append(f);
  });
  return s;
}

function blockPano(b) {
  const s = el('section', 'b b-pano');
  const ar = aspect(b.id);
  s.style.setProperty('--ar', ar.toFixed(4));
  const c = caption(b.id);
  const pin = el('div', 'b-pano__pin');
  const track = el('div', 'b-pano__track');
  track.append(figure(b.id, { sizes: `calc(78vh * ${ar.toFixed(3)})`, caption: false, className: 'ph--pano' }));
  const meta = el('div', 'b-pano__meta', `
    <div class="b-pano__cap"><span class="ph__t">${esc(c.t)}</span><span class="ph__e">${esc(c.e)}</span><span class="ph__loc">${esc(c.loc)}</span></div>
    <div class="b-pano__map" aria-hidden="true"><img src="${info(b.id).lqip}" alt=""><i></i></div>
    <span class="b-pano__ratio">${ar.toFixed(2)} : 1 · panorama</span>`);
  pin.append(track, meta);
  s.append(pin);
  return s;
}

function blockStrip(b) {
  const s = el('section', 'b b-strip');
  const pin = el('div', 'b-strip__pin');
  const track = el('div', 'b-strip__track');
  const head = el('div', 'b-strip__head', `<span class="b-strip__zh">${esc(b.zh)}</span><span class="b-strip__en">${esc(b.title)}</span><span class="b-strip__n">${pad2(b.ids.length)} frames →</span>`);
  track.append(head);
  b.ids.forEach((id, i) => {
    const f = figure(id, { sizes: '(max-width: 760px) 70vw, 32vw', className: 'ph--strip' });
    f.dataset.frame = pad2(i + 1);
    track.append(f);
  });
  pin.append(track);
  pin.append(el('div', 'b-strip__progress', '<i></i>'));
  s.append(pin);
  return s;
}

function blockSolo(b) {
  const s = el('section', `b b-solo b-solo--${b.align || 'center'} b-solo--${b.size || 'm'}`);
  s.append(figure(b.id, { sizes: SIZES.solo[b.size || 'm'] }));
  return s;
}

function blockChapter(b) {
  const s = el('section', 'b b-chapter');
  if (b.palette) s.dataset.palette = JSON.stringify(b.palette);
  s.innerHTML = `<span class="b-chapter__num">${esc(b.num)}</span><h2 class="b-chapter__zh">${esc(b.zh)}</h2><p class="b-chapter__en">${esc(b.en)}</p><span class="b-chapter__rule"></span>`;
  return s;
}

function blockQuote(b) {
  return el('section', 'b b-quote', `<p class="b-quote__zh">${esc(b.zh)}</p><p class="b-quote__en">${esc(b.en)}</p>`);
}

function blockMarquee(b) {
  const t = b.text.repeat(4);
  return el('section', 'b b-marquee', `<div class="b-marquee__line"><span>${t}</span><span aria-hidden="true">${t}</span></div><div class="b-marquee__line b-marquee__line--rev" aria-hidden="true"><span>${t}</span><span>${t}</span></div>`);
}

function blockCounter(b) {
  return el('section', 'b b-counter', `
    <div class="b-counter__gauge" aria-hidden="true"><i></i></div>
    <p class="b-counter__num"><span class="b-counter__val" data-to="${b.to}">0</span><span class="b-counter__unit">${b.unit}</span></p>
    <p class="b-counter__label">${esc(b.label)}</p>`);
}

function blockGrid(b) {
  const s = el('section', 'b b-grid');
  b.ids.forEach((id) => s.append(figure(id, { sizes: '(max-width: 760px) 50vw, 33vw' })));
  return s;
}

function blockSequence(b) {
  const s = el('section', 'b b-seq');
  s.style.setProperty('--n', b.ids.length);
  const pin = el('div', 'b-seq__pin');
  const stack = el('div', 'b-seq__stack');
  b.ids.forEach((id, i) => {
    const f = figure(id, { sizes: '(max-width: 760px) 90vw, 46vh', caption: false, className: 'ph--seq' });
    f.style.zIndex = String(i + 1);
    stack.append(f);
  });
  const labels = el('ol', 'b-seq__labels', b.ids.map((id, i) => {
    const c = caption(id);
    return `<li><span class="b-seq__l">${esc(b.labels[i])}</span><span class="b-seq__t">${esc(c.t)} · ${esc(c.e)}</span></li>`;
  }).join(''));
  pin.append(stack, labels);
  s.append(pin);
  return s;
}

const RENDER = {
  intro: blockIntro, full: blockFull, row: blockRow, pano: blockPano, strip: blockStrip, solo: blockSolo,
  chapter: blockChapter, quote: blockQuote, marquee: blockMarquee, counter: blockCounter, grid: blockGrid, sequence: blockSequence,
};

export function renderBlocks(album) {
  const frag = document.createDocumentFragment();
  for (const b of album.blocks) {
    const fn = RENDER[b.type];
    if (!fn) { console.warn('Unknown block', b.type); continue; }
    const node = fn(b, album);
    node.dataset.type = b.type;
    frag.append(node);
  }
  return frag;
}

export function renderNext(album) {
  const i = albums.indexOf(album);
  const next = albums[(i + 1) % albums.length];
  const s = el('section', 'next');
  s.innerHTML = `
    <a class="next__link" href="${albumHref(next.slug)}" ${linkData(next)}>
      <span class="next__kicker">Next album · ${pad2(albums.indexOf(next) + 1)}</span>
      <span class="next__name">${esc(next.name)}</span>
      <span class="next__zh">${esc(next.zh)}</span>
      <span class="next__media"></span>
    </a>`;
  const media = s.querySelector('.next__media');
  media.append(figure(next.cover, { sizes: '(max-width: 760px) 100vw, 60vw', caption: false }));
  media.firstChild.style.setProperty('--fx', `${next.focus[0] * 100}%`);
  media.firstChild.style.setProperty('--fy', `${next.focus[1] * 100}%`);
  return s;
}

export function renderFoot() {
  return el('footer', 'foot', `<a href="index.html" data-link data-en="Wphotographs" class="foot__home">Wphotographs</a><span>All photographs © ${new Date().getFullYear()} · Wphoto</span><button type="button" class="foot__top">Back to top ↑</button>`);
}
