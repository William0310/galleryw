import { initPage, kineticHeading, gsap, ScrollTrigger, env } from './core/page.js';
import { news } from './data/news.js';

initPage();
const R = env.reduced;

kineticHeading(document.querySelector('.nw-title'), { min: 250, max: 850 });

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const LABEL = { release: 'Release', content: 'Photos', project: 'Project' };
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// Render, grouped by year.
const list = document.querySelector('.nw-list');
let year = null;
let html = '';
news.forEach((n, i) => {
  const [y, m, d] = n.date.split('-').map(Number);
  if (y !== year) {
    if (year !== null) html += '</div>';
    year = y;
    html += `<div class="nw-year" data-year="${y}"><p class="nw-year__label" aria-hidden="true">${y}</p>`;
  }
  html += `
    <article class="nw-item" data-type="${n.type}" style="--i:${i}">
      <time class="nw-item__date" datetime="${n.date}"><span>${MONTHS[m - 1]}</span><strong>${String(d).padStart(2, '0')}</strong></time>
      <div class="nw-item__body">
        <p class="nw-item__kicker"><i class="nw-dot nw-dot--${n.type}"></i>${esc(n.kicker || LABEL[n.type])}</p>
        <h2 class="nw-item__title">${esc(n.title)}</h2>
        ${n.poster ? `<figure class="nw-poster"><img src="${esc(n.poster.src)}" alt="${esc(n.poster.caption || n.title)} — theme poster" loading="lazy" decoding="async"><figcaption>Theme poster · ${esc(n.poster.caption || '')}</figcaption></figure>` : ''}
        <p class="nw-item__text">${esc(n.body)}</p>
        ${n.tags ? `<ul class="nw-tags">${n.tags.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>` : ''}
        ${n.link ? `<a class="nw-link" href="${n.link.href}" data-link data-en="${esc(n.link.label)}">${esc(n.link.label)} <i>→</i></a>` : ''}
      </div>
    </article>`;
});
html += '</div>';
list.innerHTML = html;

// Counts on the filter tabs.
const tabs = [...document.querySelectorAll('.nw-filter button')];
tabs.forEach((b) => {
  const f = b.dataset.filter;
  b.querySelector('sup').textContent = f === 'all' ? news.length : news.filter((n) => n.type === f).length;
});

// Entrance per item + the timeline spine filling with the scroll.
const items = [...list.querySelectorAll('.nw-item')];
if (!R) {
  items.forEach((it) => {
    gsap.fromTo(it, { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: it, start: 'top 92%', once: true } });
  });
  gsap.fromTo(list, { '--fill': 0 }, { '--fill': 1, ease: 'none', scrollTrigger: { trigger: list, start: 'top 70%', end: 'bottom 70%', scrub: true } });
  // Year numerals drift slower than the list.
  list.querySelectorAll('.nw-year__label').forEach((l) => {
    gsap.fromTo(l, { yPercent: -10 }, { yPercent: 30, ease: 'none', scrollTrigger: { trigger: l.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } });
  });
}

// Filtering: items fold away and the rest close ranks.
function applyFilter(f) {
  tabs.forEach((b) => b.setAttribute('aria-selected', String(b.dataset.filter === f)));
  const show = items.filter((it) => f === 'all' || it.dataset.type === f);
  const hide = items.filter((it) => !show.includes(it));
  gsap.killTweensOf(items);
  gsap.to(hide, { opacity: 0, duration: 0.25, onComplete: () => hide.forEach((it) => { it.hidden = true; }) });
  setTimeout(() => {
    show.forEach((it) => { it.hidden = false; });
    list.querySelectorAll('.nw-year').forEach((y) => { y.hidden = !y.querySelector('.nw-item:not([hidden])'); });
    gsap.fromTo(show, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.6, stagger: 0.04, ease: 'power3.out' });
    ScrollTrigger.refresh();
  }, R ? 0 : 260);
}
tabs.forEach((b) => b.addEventListener('click', () => applyFilter(b.dataset.filter)));
