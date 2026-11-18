// Fixed header + full-screen album index menu (shared by every page).
import { albums, photoIds } from '../data/albums.js';
import { pick } from './img.js';
import { gsap, lockScroll } from './scroll.js';
import { env, pad2, esc } from './env.js';

export const albumHref = (slug) => `album.html?a=${slug}`;

export function linkData(album) {
  return `data-link data-zh="${esc(album.zh)}" data-en="${esc(album.name)}" data-color="${album.accent}"`;
}

export function initNav({ current = null } = {}) {
  const head = document.createElement('header');
  head.className = 'site-head';
  head.innerHTML = `
    <a class="brand" href="index.html" data-link data-zh="" data-en="Wphotographs" aria-label="Wphotographs — home">
      <span class="brand__full">Wphotographs</span><span class="brand__short">Wphoto</span>
    </a>
    <div class="site-head__crumb">${current ? `<span>${pad2(albums.indexOf(current) + 1)}</span> ${esc(current.name)} <i>${esc(current.zh)}</i>` : ''}</div>
    <button class="menu-btn" type="button" aria-expanded="false" aria-controls="site-menu">
      <span class="menu-btn__label"><span>Albums</span><span>Close</span></span><span class="menu-btn__icon"><i></i><i></i></span>
    </button>`;

  const menu = document.createElement('div');
  menu.className = 'menu';
  menu.id = 'site-menu';
  menu.setAttribute('aria-hidden', 'true');
  menu.innerHTML = `
    <div class="menu__bg"></div>
    <div class="menu__inner">
      <nav class="menu__nav" aria-label="Albums">
        <ol>${albums.map((a, i) => `
          <li><a href="${albumHref(a.slug)}" ${linkData(a)} data-slug="${a.slug}" class="${a === current ? 'is-current' : ''}">
            <span class="menu__n">${pad2(i + 1)}</span>
            <span class="menu__name">${esc(a.short && env.narrow ? a.short : a.name)}</span>
            <span class="menu__zh">${esc(a.zh)}</span>
            <span class="menu__count">${photoIds(a).length}</span>
          </a></li>`).join('')}
        </ol>
      </nav>
      <div class="menu__preview" aria-hidden="true">${albums.map((a) => `<img data-slug="${a.slug}" alt="" loading="lazy" src="${pick(a.cover, 960)}">`).join('')}</div>
      <div class="menu__foot">
        <nav class="menu__pages" aria-label="Pages">
          <a href="index.html" data-link data-en="Wphotographs">Home</a>
          <a href="about.html" data-link data-en="About">About</a>
          <a href="news.html" data-link data-en="Newsroom">Newsroom</a>
        </nav>
        <span>Wphotographs © ${new Date().getFullYear()}</span>
      </div>
    </div>`;

  document.body.prepend(menu);
  document.body.prepend(head);

  const btn = head.querySelector('.menu-btn');
  const items = menu.querySelectorAll('.menu__nav li');
  const bg = menu.querySelector('.menu__bg');
  const previews = [...menu.querySelectorAll('.menu__preview img')];
  let open = false;
  let tl;

  const setOpen = (v) => {
    if (open === v) return;
    open = v;
    btn.setAttribute('aria-expanded', String(v));
    menu.setAttribute('aria-hidden', String(!v));
    document.documentElement.classList.toggle('menu-open', v);
    lockScroll(v);
    tl && tl.kill();
    if (v) {
      menu.classList.add('is-open');
      tl = gsap.timeline()
        .fromTo(bg, { clipPath: 'inset(0 0 100% 0)' }, { clipPath: 'inset(0 0 0% 0)', duration: 0.8, ease: 'expo.inOut' })
        .fromTo(items, { yPercent: 120, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.8, stagger: 0.05, ease: 'expo.out' }, '-=0.35')
        .fromTo(menu.querySelector('.menu__foot'), { opacity: 0 }, { opacity: 1, duration: 0.5 }, '-=0.6');
      items[0]?.querySelector('a')?.focus({ preventScroll: true });
    } else {
      tl = gsap.timeline({ onComplete: () => menu.classList.remove('is-open') })
        .to(items, { yPercent: -60, opacity: 0, duration: 0.35, stagger: 0.02, ease: 'power2.in' })
        .to(bg, { clipPath: 'inset(100% 0 0% 0)', duration: 0.6, ease: 'expo.inOut' }, '-=0.15');
      btn.focus({ preventScroll: true });
    }
  };

  btn.addEventListener('click', () => setOpen(!open));
  window.addEventListener('keydown', (e) => { if (e.key === 'Escape' && open) setOpen(false); });

  // Hover preview (pointer devices only).
  if (!env.touch) {
    menu.querySelectorAll('.menu__nav a').forEach((a) => {
      a.addEventListener('pointerenter', () => {
        previews.forEach((img) => img.classList.toggle('is-active', img.dataset.slug === a.dataset.slug));
      });
    });
    menu.querySelector('.menu__nav').addEventListener('pointerleave', () => previews.forEach((img) => img.classList.remove('is-active')));
  }

  // Hide header while scrolling down, show on scroll up.
  let lastY = window.scrollY;
  let hidden = false;
  const onScroll = () => {
    const y = window.scrollY;
    const down = y > lastY + 4;
    const up = y < lastY - 4;
    if (down && y > 160 && !hidden) { hidden = true; head.classList.add('is-hidden'); }
    else if ((up || y < 160) && hidden) { hidden = false; head.classList.remove('is-hidden'); }
    if (Math.abs(y - lastY) > 4) lastY = y;
  };
  window.addEventListener('scroll', onScroll, { passive: true });

  return { head, menu, close: () => setOpen(false) };
}
