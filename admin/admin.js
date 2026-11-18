// Wphoto Admin: edits js/data/content.js through admin/server.mjs.
import meta from '../js/data/meta.js';

const $ = (s, el = document) => el.querySelector(s);
const esc = (t) => String(t ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const thumb = (id) => {
  const m = meta[id];
  return m ? `../assets/photos/${id}-${m.sizes[0]}.webp` : '';
};

let C = null;           // the content being edited
let dirty = false;
let section = { kind: 'album', slug: null };

// ---------------------------------------------------------------------------------------
// Loading / saving
// ---------------------------------------------------------------------------------------
async function load() {
  const res = await fetch('/api/content');
  if (!res.ok) throw new Error('Could not load content — is the admin server running?');
  C = await res.json();
  section.slug = C.albums[0].slug;
  renderNav();
  render();
  setDirty(false);
  status('All changes saved');
}

async function save() {
  if (!dirty) return;
  const btn = $('[data-save]');
  btn.disabled = true;
  status('Saving…');
  try {
    const res = await fetch('/api/content', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(C) });
    const out = await res.json();
    if (!res.ok) throw new Error(out.error || 'Save failed');
    setDirty(false);
    const t = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    status(`Saved ${t}`);
    toast('Saved — the site now shows your changes.');
    reloadPreview();
    if (section.kind === 'news') render(); // posts are re-sorted by date on save
  } catch (e) {
    status('Not saved');
    toast(e.message, true);
    btn.disabled = false;
  }
}

function setDirty(v) {
  dirty = v;
  $('[data-save]').disabled = !v;
  document.body.classList.toggle('is-dirty', v);
  if (v) status('Unsaved changes');
}
const status = (t) => { $('[data-status]').textContent = t; };
let toastTimer;
function toast(msg, bad = false) {
  const el = $('[data-toast]');
  el.textContent = msg;
  el.classList.toggle('is-bad', bad);
  el.classList.add('is-on');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('is-on'), 3200);
}

window.addEventListener('keydown', (e) => {
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') { e.preventDefault(); save(); }
});
window.addEventListener('beforeunload', (e) => { if (dirty) { e.preventDefault(); e.returnValue = ''; } });
$('[data-save]').addEventListener('click', save);

// ---------------------------------------------------------------------------------------
// Field helpers: every input writes straight into C through a getter/setter pair.
// ---------------------------------------------------------------------------------------
let uid = 0;
function field({ label, get, set, area = false, hint = '', placeholder = '', type = 'text', rows = 3, wide = false }) {
  const id = `f${++uid}`;
  const wrap = document.createElement('label');
  wrap.className = `fld${wide ? ' fld--wide' : ''}`;
  wrap.htmlFor = id;
  wrap.innerHTML = `<span class="fld__label">${esc(label)}${hint ? `<em>${esc(hint)}</em>` : ''}</span>`;
  const input = document.createElement(area ? 'textarea' : 'input');
  input.id = id;
  if (!area) input.type = type;
  else input.rows = rows;
  input.placeholder = placeholder;
  input.value = get() ?? '';
  input.addEventListener('input', () => { set(input.value); setDirty(true); });
  wrap.append(input);
  return wrap;
}
const group = (title, note = '') => {
  const s = document.createElement('section');
  s.className = 'grp';
  s.innerHTML = `<header class="grp__head"><h2>${esc(title)}</h2>${note ? `<p>${esc(note)}</p>` : ''}</header><div class="grp__body"></div>`;
  return s;
};
const body = (g) => g.querySelector('.grp__body');

// ---------------------------------------------------------------------------------------
// Navigation
// ---------------------------------------------------------------------------------------
function renderNav() {
  const nav = $('.side__nav');
  nav.innerHTML = `
    <p class="side__label">Albums</p>
    ${C.albums.map((a, i) => `<button type="button" data-go="album" data-slug="${a.slug}"><span>${String(i + 1).padStart(2, '0')}</span>${esc(a.name)} <i>${esc(a.zh)}</i></button>`).join('')}
    <p class="side__label">Pages</p>
    <button type="button" data-go="about"><span>—</span>About</button>
    <button type="button" data-go="news"><span>—</span>Newsroom <i>${C.news.length}</i></button>`;
  nav.querySelectorAll('[data-go]').forEach((b) => b.addEventListener('click', () => {
    section = { kind: b.dataset.go, slug: b.dataset.slug };
    render();
    $('.main').scrollTo({ top: 0 });
  }));
  markNav();
}
function markNav() {
  document.querySelectorAll('[data-go]').forEach((b) => {
    b.classList.toggle('is-active', b.dataset.go === section.kind && (section.kind !== 'album' || b.dataset.slug === section.slug));
  });
}

function render() {
  markNav();
  const el = $('[data-body]');
  el.innerHTML = '';
  if (section.kind === 'album') renderAlbum(el, C.albums.find((a) => a.slug === section.slug));
  if (section.kind === 'about') renderAbout(el);
  if (section.kind === 'news') renderNews(el);
  setPreview(currentUrl());
}

function currentUrl() {
  if (section.kind === 'album') return `../album.html?a=${section.slug}`;
  if (section.kind === 'about') return '../about.html';
  return '../news.html';
}

// ---------------------------------------------------------------------------------------
// Album
// ---------------------------------------------------------------------------------------
const BLOCK_FIELDS = {
  intro: [['zh', '主句 · Lead (中文)', true], ['en', 'Lead (English)', true], ['body', 'Paragraph', true]],
  chapter: [['num', 'Number'], ['zh', 'Title (中文)'], ['en', 'Title (English)']],
  quote: [['zh', 'Quote (中文)'], ['en', 'Quote (English)']],
  marquee: [['text', 'Scrolling text']],
  counter: [['label', 'Caption']],
  strip: [['zh', 'Title (中文)'], ['title', 'Title (English)']],
};
const BLOCK_NAMES = { intro: 'Introduction', chapter: 'Chapter heading', quote: 'Quote', marquee: 'Scrolling words', counter: 'Counter caption', strip: 'Film strip heading', sequence: 'Sequence labels' };

function photoIdsOf(a) {
  const set = new Set([a.cover]);
  for (const b of a.blocks) { if (b.id) set.add(b.id); if (b.ids) b.ids.forEach((i) => set.add(i)); }
  return [...set];
}

function renderAlbum(el, a) {
  const i = C.albums.indexOf(a);
  $('[data-kicker]').textContent = `Album ${String(i + 1).padStart(2, '0')} / ${String(C.albums.length).padStart(2, '0')}`;
  $('[data-title]').textContent = `${a.name} ${a.zh}`;

  const g1 = group('Album', 'Names and the lines shown on the album’s opening screen and on the home page.');
  body(g1).append(
    field({ label: 'Name (English)', get: () => a.name, set: (v) => { a.name = v; } }),
    field({ label: '名称 (中文)', get: () => a.zh, set: (v) => { a.zh = v; } }),
    field({ label: 'Title (English)', get: () => a.title, set: (v) => { a.title = v; } }),
    field({ label: '标题 (中文)', get: () => a.zhTitle, set: (v) => { a.zhTitle = v; } }),
    field({ label: 'Coordinates', get: () => a.coords, set: (v) => { a.coords = v; }, placeholder: '36°N · 100°E' }),
    field({ label: 'Note', hint: 'shown beside the frame count', get: () => a.note, set: (v) => { a.note = v; } }),
  );
  el.append(g1);

  const textBlocks = a.blocks.map((b, k) => ({ b, k })).filter(({ b }) => BLOCK_FIELDS[b.type] || b.type === 'sequence');
  if (textBlocks.length) {
    const g2 = group('Text on the album page', 'In page order. Layout and photo placement stay as they are.');
    for (const { b, k } of textBlocks) {
      const card = document.createElement('div');
      card.className = 'card';
      card.innerHTML = `<p class="card__tag">${esc(BLOCK_NAMES[b.type] || b.type)} <span>block ${k + 1}</span></p>`;
      const grid = document.createElement('div');
      grid.className = 'card__grid';
      if (b.type === 'sequence') {
        (b.labels || []).forEach((_, j) => grid.append(field({ label: `Label ${j + 1}`, get: () => b.labels[j], set: (v) => { b.labels[j] = v; } })));
      } else {
        for (const [key, label, area] of BLOCK_FIELDS[b.type]) {
          grid.append(field({ label, area, wide: !!area, rows: key === 'body' ? 4 : 2, get: () => b[key], set: (v) => { b[key] = v; } }));
        }
      }
      card.append(grid);
      body(g2).append(card);
    }
    el.append(g2);
  }

  const ids = photoIdsOf(a);
  const g3 = group(`Photos · ${ids.length}`, 'Title, English title and place for every frame. Leave the place empty if it isn’t clear.');
  const grid = document.createElement('div');
  grid.className = 'photos';
  for (const id of ids) {
    const p = (C.photos[id] ||= { t: '', e: '', loc: '' });
    const card = document.createElement('div');
    card.className = 'photo';
    card.innerHTML = `<div class="photo__img"><img src="${thumb(id)}" alt="" loading="lazy"><span>${id === a.cover ? 'Cover · ' : ''}${esc(id)}</span></div>`;
    const f = document.createElement('div');
    f.className = 'photo__fields';
    f.append(
      field({ label: '标题', get: () => p.t, set: (v) => { p.t = v; } }),
      field({ label: 'English', get: () => p.e, set: (v) => { p.e = v; } }),
      field({ label: 'Place · 地点', get: () => p.loc, set: (v) => { p.loc = v; }, placeholder: 'optional' }),
    );
    card.append(f);
    grid.append(card);
  }
  body(g3).append(grid);
  el.append(g3);
}

// ---------------------------------------------------------------------------------------
// About
// ---------------------------------------------------------------------------------------
function renderAbout(el) {
  const A = C.about;
  $('[data-kicker]').textContent = 'Page';
  $('[data-title]').textContent = 'About';
  const g1 = group('Opening');
  body(g1).append(
    field({ label: 'Kicker', get: () => A.kicker, set: (v) => { A.kicker = v; } }),
    field({ label: 'Name', get: () => A.name, set: (v) => { A.name = v; } }),
    field({ label: 'Introduction', area: true, wide: true, get: () => A.lede, set: (v) => { A.lede = v; } }),
    field({ label: 'Portrait caption', get: () => A.portraitCaption, set: (v) => { A.portraitCaption = v; } }),
  );
  el.append(g1);

  const g2 = group('Spec sheet', 'Any e-mail address becomes a link; the words “contact form” jump to the form.');
  const rows = document.createElement('div');
  rows.className = 'rows';
  const drawRows = () => {
    rows.innerHTML = '';
    A.spec.forEach((r, i) => {
      const row = document.createElement('div');
      row.className = 'row';
      row.append(
        field({ label: 'Label', get: () => r.label, set: (v) => { r.label = v; } }),
        field({ label: 'Value', wide: true, get: () => r.value, set: (v) => { r.value = v; } }),
      );
      const tools = document.createElement('div');
      tools.className = 'row__tools';
      tools.innerHTML = `<button type="button" class="icon" title="Move up" ${i === 0 ? 'disabled' : ''}>↑</button><button type="button" class="icon" title="Move down" ${i === A.spec.length - 1 ? 'disabled' : ''}>↓</button><button type="button" class="icon icon--bad" title="Remove">✕</button>`;
      const [up, down, del] = tools.querySelectorAll('button');
      up.onclick = () => { A.spec.splice(i - 1, 0, A.spec.splice(i, 1)[0]); setDirty(true); drawRows(); };
      down.onclick = () => { A.spec.splice(i + 1, 0, A.spec.splice(i, 1)[0]); setDirty(true); drawRows(); };
      del.onclick = () => { if (confirm(`Remove “${r.label}”?`)) { A.spec.splice(i, 1); setDirty(true); drawRows(); } };
      row.append(tools);
      rows.append(row);
    });
  };
  drawRows();
  const add = document.createElement('button');
  add.type = 'button';
  add.className = 'btn';
  add.textContent = '+ Add row';
  add.onclick = () => { A.spec.push({ label: '', value: '' }); setDirty(true); drawRows(); rows.lastElementChild?.querySelector('input')?.focus(); };
  body(g2).append(rows, add);
  el.append(g2);

  const g3 = group('Manifesto & notice');
  body(g3).append(
    field({ label: 'Manifesto', wide: true, get: () => A.manifesto, set: (v) => { A.manifesto = v; } }),
    field({ label: 'Manifesto line', area: true, wide: true, rows: 2, get: () => A.manifestoSub, set: (v) => { A.manifestoSub = v; } }),
    field({ label: 'Scrolling notice', wide: true, get: () => A.notice, set: (v) => { A.notice = v; } }),
    field({ label: 'Notice text', area: true, wide: true, rows: 2, get: () => A.noticeCopy, set: (v) => { A.noticeCopy = v; } }),
  );
  el.append(g3);

  const g4 = group('Contact');
  body(g4).append(
    field({ label: 'E-mail', type: 'email', get: () => A.email, set: (v) => { A.email = v; } }),
    field({ label: 'Heading', get: () => A.contactTitle, set: (v) => { A.contactTitle = v; } }),
    field({ label: 'Text', area: true, wide: true, get: () => A.contactCopy, set: (v) => { A.contactCopy = v; } }),
  );
  el.append(g4);
}

// ---------------------------------------------------------------------------------------
// Newsroom
// ---------------------------------------------------------------------------------------
const TYPES = [['content', 'Photos · content update'], ['release', 'Release note'], ['project', 'Project']];
const KICKERS = { content: 'Content update', release: 'Release note', project: 'New project' };

function renderNews(el) {
  $('[data-kicker]').textContent = 'Page';
  $('[data-title]').textContent = 'Newsroom';
  const top = document.createElement('div');
  top.className = 'news-top';
  top.innerHTML = '<button type="button" class="btn btn--primary">+ New post</button><p>Posts are shown newest first. Dates use YYYY-MM-DD.</p>';
  top.querySelector('button').onclick = () => {
    const today = new Date();
    const d = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    C.news.unshift({ date: d, type: 'content', kicker: KICKERS.content, title: 'New post', body: '' });
    setDirty(true);
    renderNav();
    render();
    $('.post input[type="text"]')?.select();
  };
  el.append(top);

  C.news.forEach((n, i) => {
    const post = document.createElement('details');
    post.className = 'post';
    post.open = i < 3;
    const sum = document.createElement('summary');
    const drawSum = () => { sum.innerHTML = `<span class="post__date">${esc(n.date)}</span><span class="post__type post__type--${n.type}">${esc(n.type)}</span><span class="post__title">${esc(n.title)}</span>`; };
    drawSum();
    post.append(sum);
    const grid = document.createElement('div');
    grid.className = 'card__grid';
    const typeSel = document.createElement('label');
    typeSel.className = 'fld';
    typeSel.innerHTML = `<span class="fld__label">Type</span><select>${TYPES.map(([v, l]) => `<option value="${v}" ${n.type === v ? 'selected' : ''}>${l}</option>`).join('')}</select>`;
    typeSel.querySelector('select').onchange = (e) => {
      const old = n.type;
      n.type = e.target.value;
      if (!n.kicker || n.kicker === KICKERS[old]) { n.kicker = KICKERS[n.type]; kick.querySelector('input').value = n.kicker; }
      setDirty(true);
      drawSum();
    };
    const kick = field({ label: 'Kicker', get: () => n.kicker, set: (v) => { n.kicker = v; } });
    const tags = field({ label: 'Tags', hint: 'comma separated', wide: true, get: () => (n.tags || []).join(', '), set: (v) => { const t = v.split(',').map((s) => s.trim()).filter(Boolean); if (t.length) n.tags = t; else delete n.tags; } });
    const linkHref = field({ label: 'Link URL', hint: 'optional', placeholder: 'album.html?a=misc', get: () => n.link?.href, set: (v) => { if (v) n.link = { ...(n.link || { label: 'Read more' }), href: v }; else delete n.link; } });
    const linkLabel = field({ label: 'Link text', hint: 'optional', placeholder: 'Open the album', get: () => n.link?.label, set: (v) => { if (n.link) n.link.label = v || 'Read more'; } });
    grid.append(
      field({ label: 'Date', type: 'date', get: () => n.date, set: (v) => { n.date = v; drawSum(); } }),
      typeSel,
      kick,
      field({ label: 'Title', wide: true, get: () => n.title, set: (v) => { n.title = v; drawSum(); } }),
      field({ label: 'Text', area: true, wide: true, rows: 4, get: () => n.body, set: (v) => { n.body = v; } }),
      tags, linkHref, linkLabel,
    );
    const del = document.createElement('button');
    del.type = 'button';
    del.className = 'btn btn--bad';
    del.textContent = 'Delete post';
    del.onclick = () => {
      if (!confirm(`Delete “${n.title}”? (It is only removed when you save.)`)) return;
      C.news.splice(C.news.indexOf(n), 1);
      setDirty(true);
      renderNav();
      render();
    };
    post.append(grid, del);
    el.append(post);
  });
}

// ---------------------------------------------------------------------------------------
// Preview pane
// ---------------------------------------------------------------------------------------
const preview = $('[data-preview]');
const frame = $('[data-frame]');
let previewOn = false;
try { previewOn = localStorage.getItem('wp-admin-preview') === '1'; } catch (e) { /* ignore */ }
function setPreview(url) {
  $('[data-view]').href = url;
  $('[data-preview-url]').textContent = url.replace('../', '/');
  preview.hidden = !previewOn;
  document.body.classList.toggle('has-preview', previewOn);
  $('[data-toggle-preview]').setAttribute('aria-pressed', String(previewOn));
  if (previewOn && frame.dataset.url !== url) { frame.dataset.url = url; frame.src = url; }
}
function reloadPreview() { if (previewOn) frame.contentWindow?.location.reload(); }
$('[data-toggle-preview]').addEventListener('click', () => {
  previewOn = !previewOn;
  try { localStorage.setItem('wp-admin-preview', previewOn ? '1' : '0'); } catch (e) { /* ignore */ }
  setPreview(currentUrl());
});
$('[data-reload]').addEventListener('click', reloadPreview);
$('[data-close-preview]').addEventListener('click', () => $('[data-toggle-preview]').click());
window.addEventListener('keydown', (e) => { if (e.key === 'Escape' && previewOn && !e.target.closest('input, textarea, select')) $('[data-toggle-preview]').click(); });
document.querySelectorAll('[data-size]').forEach((b) => b.addEventListener('click', () => {
  preview.classList.toggle('is-phone', b.dataset.size === 'phone');
}));

load().catch((e) => {
  status('Offline');
  $('[data-body]').innerHTML = `<div class="empty"><h2>Can’t reach the admin server</h2><p>${esc(e.message)}</p><p>Start it with <code>node admin/server.mjs</code> (or double-click <b>Wphoto Admin.command</b>) and reload this page.</p></div>`;
});
