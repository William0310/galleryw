(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;

  /* ---------- i18n ---------- */
  const ZH = {
    nav_glass: '液态玻璃', nav_pins: 'Pin Tabs', nav_search: '智能搜索', nav_profiles: 'Profile 隔离',
    download: '下载', download_mac: '下载 Mac 版', see_features: '了解特色',
    tagline: '像船长一样，巡航整个互联网。',
    lede: '用 SwiftUI 原生打造的浏览器。大块液态玻璃，灵动自然的动效。',
    glass_h: '侧边栏，<em>就是</em>整个窗口。',
    glass_p: 'Cruise 把侧边栏做成一整块液态玻璃，透出你的壁纸与网页的色彩，让浏览器融入桌面，而不是盖在桌面上。',
    glass_1: '大面积、连续的玻璃质感', glass_2: '每个标签页、面板和按钮都带弹簧动效', glass_3: 'SwiftUI 原生实现，手感与 macOS 一致',
    chip_wall: '跟随你的壁纸',
    pins_h: '只留下<em>最重要</em>的几个。',
    pins_p: '把每天都要打开的网站固定下来。它们以大图块的形式停在侧边栏顶部，一键直达，不会随其他标签页来去。',
    pins_try: '试一试：点标签页上的图钉固定它，点图块则取消固定。', pins_cap: 'Cruise 中的固定标签页',
    search_h: '一个输入框，<em>想去哪</em>都行。',
    search_p: '输入网址、问题，或是标签页的名字。Cruise 会判断你的意图，把最合适的结果放在第一位。',
    search_1: '直接跳转网站、发起搜索，或切换到已打开的标签页', search_2: '已固定的标签页优先出现', search_3: '随时按 ⌘L 开始输入',
    prof_h: '工作与生活，<em>互不打扰。</em>',
    prof_p: '每个 Profile 都有独立的标签页、固定网站、Cookie 和登录状态。一键切换，彼此完全隔离。',
    prof_1: '同一个网站可以登录不同账号', prof_2: '各自的壁纸，让你一眼知道身在何处', prof_3: '切换时不必关掉任何标签页',
    nat_eye: '为 Mac 而生', nat_h: '从第一个像素起，就是<em>原生</em>。',
    nat1_h: '纯 SwiftUI', nat1_p: '不是给网页套一层外壳。界面由你每天使用的 App 同款控件构成。',
    nat2_h: '会流动的玻璃', nat2_p: '面板会拉伸、回弹、融合。打开标签页、切换 Profile，都像在摆弄一件实物。',
    nat3_h: '网页优先', nat3_p: '一切都收进侧边栏，网页独占整个窗口，外面只有一圈干净的圆角。',
    foot: '用 SwiftUI 打造。',
    // demo strings
    d_pinned_empty: '固定的标签页会出现在这里', d_new: '新建标签页', d_hi: '晚上好', d_addr: '搜索或输入网址',
    d_iso: '独立的标签页 · Cookie · 登录', d_ph: '搜索或输入网址',
    k_site: '网站', k_search: '搜索', k_tab: '已打开的标签页', k_pin: '已固定', go: '前往 ', srch: '搜索 ', sw: '切换到 ',
    p_Personal: '个人', p_Work: '工作', p_Study: '学习'
  };
  const lang = { cur: 'en' };
  const orig = new Map();
  $$('[data-i18n]').forEach(el => orig.set(el, el.innerHTML));
  const t = k => (lang.cur === 'zh' && ZH[k]) || EN[k] || k;
  const EN = { d_pinned_empty: 'Pinned tabs appear here', d_new: 'New Tab', d_hi: 'Good evening', d_addr: 'Search or enter address', d_iso: 'Own tabs · cookies · sign-ins', k_site: 'Website', k_search: 'Search', k_tab: 'Open tab', k_pin: 'Pinned tab', go: 'Go to ', srch: 'Search the web for ', sw: 'Switch to ', p_Personal: 'Personal', p_Work: 'Work', p_Study: 'Study' };
  function setLang(l) {
    lang.cur = l;
    document.documentElement.lang = l === 'zh' ? 'zh-CN' : 'en';
    $$('[data-i18n]').forEach(el => { el.innerHTML = l === 'zh' && ZH[el.dataset.i18n] ? ZH[el.dataset.i18n] : orig.get(el); });
    $('#lang').textContent = l === 'zh' ? 'EN' : '中';
    $('#q').placeholder = t('d_ph');
    try { localStorage.setItem('cruise-lang', l); } catch (e) {}
    renderPins(); renderProfile(false); buildSeg(); renderResults($('#q').value);
  }
  $('#lang').addEventListener('click', () => setLang(lang.cur === 'zh' ? 'en' : 'zh'));

  /* ---------- Nav ---------- */
  const nav = $('#nav'), menu = $('#menu');
  menu.addEventListener('click', () => { const o = nav.classList.toggle('open'); menu.setAttribute('aria-expanded', o); });
  $$('#sheet a').forEach(a => a.addEventListener('click', () => { nav.classList.remove('open'); menu.setAttribute('aria-expanded', 'false'); }));
  addEventListener('keydown', e => { if (e.key === 'Escape') { nav.classList.remove('open'); menu.setAttribute('aria-expanded', 'false'); } });

  /* ---------- Reveal ---------- */
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px', threshold: .08 });
  $$('.reveal').forEach(el => io.observe(el));

  /* ---------- Glass sheen + tilt ---------- */
  document.addEventListener('pointermove', e => {
    const g = e.target.closest && e.target.closest('.glass');
    if (g) { const r = g.getBoundingClientRect(); g.style.setProperty('--mx', ((e.clientX - r.left) / r.width * 100) + '%'); g.style.setProperty('--my', ((e.clientY - r.top) / r.height * 100) + '%'); }
  }, { passive: true });
  if (fine && !reduce) $$('[data-tilt]').forEach(el => {
    el.addEventListener('pointermove', e => { const r = el.getBoundingClientRect(); const x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5; el.style.setProperty('--ty', (x * 10) + 'deg'); el.style.setProperty('--tx', (-y * 8) + 'deg'); });
    el.addEventListener('pointerleave', () => { el.style.setProperty('--ty', '0deg'); el.style.setProperty('--tx', '0deg'); });
  });

  /* ---------- Hero scroll progress ---------- */
  const shot = $('#heroShot'); let ticking = false;
  const upd = () => { ticking = false; const r = shot.getBoundingClientRect(); const p = Math.min(1, Math.max(0, 1 - r.top / (innerHeight * .75))); document.documentElement.style.setProperty('--hp', reduce ? 1 : p.toFixed(3)); };
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(upd); } }, { passive: true });
  addEventListener('resize', upd); upd();

  /* ---------- Shared bits ---------- */
  const G = {
    Apple: ['A', '#1d1d1f'], Google: ['G', '#4285f4'], IKEA: ['I', '#0058a3'], Wikipedia: ['W', '#555'], GitHub: ['G', '#24292f'],
    Figma: ['F', '#a259ff'], Linear: ['L', '#5e6ad2'], Notion: ['N', '#222'], Slack: ['S', '#4a154b'], Mail: ['M', '#3b82f6'],
    Arxiv: ['a', '#b31b1b'], Anki: ['A', '#3a7bd5'], Scholar: ['S', '#4b79d6']
  };
  const glyph = n => `<span class="glyph" style="background:${G[n][1]}">${G[n][0]}</span>`;
  const PIN = '<svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"><path d="M9.5 1.8l4.7 4.7-1.5.4-2.2 2.2.1 3-1 1-2.8-2.8-4 4-.7-.7 4-4L2.8 6.8l1-1 3 .1 2.2-2.2z" fill="currentColor"/></svg>';

  function flip(container, render) {
    const first = new Map($$('[data-id]', container).map(el => [el.dataset.id, el.getBoundingClientRect()]));
    render();
    if (reduce) return;
    $$('[data-id]', container).forEach(el => {
      const f = first.get(el.dataset.id); if (!f) { el.animate([{ opacity: 0, transform: 'scale(.8)' }, { opacity: 1, transform: 'none' }], { duration: 450, easing: 'cubic-bezier(.34,1.56,.64,1)' }); return; }
      const l = el.getBoundingClientRect(); const dx = f.left - l.left, dy = f.top - l.top, sx = f.width / l.width, sy = f.height / l.height;
      if (!dx && !dy && sx === 1 && sy === 1) return;
      el.animate([{ transform: `translate(${dx}px,${dy}px) scale(${sx},${sy})`, transformOrigin: '0 0' }, { transform: 'none', transformOrigin: '0 0' }], { duration: 650, easing: 'cubic-bezier(.34,1.3,.64,1)' });
    });
  }

  function mockHTML(o) {
    return `<div class="wall wall-desert${o.wall === 'desert' ? ' on' : ''}"></div><div class="wall wall-dusk${o.wall === 'dusk' ? ' on' : ''}"></div><div class="wall wall-sea${o.wall === 'sea' ? ' on' : ''}"></div>
    <aside class="mock-side"><div class="lights"><i></i><i></i><i></i><b data-name>${o.name || ''}</b></div>
    <div class="addr" data-addr>${o.addr}</div>
    <div class="pinned" data-pinned></div>
    <ul class="tabs" data-tabs></ul></aside>
    <div class="mock-page"><div class="logo">Cruise</div><div class="hi" data-hi></div><div class="mini" data-mini></div></div>`;
  }

  /* ---------- Pin Tabs demo ---------- */
  const pinMock = $('#pinMock');
  pinMock.innerHTML = mockHTML({ wall: 'desert', name: '', addr: 'google.com' });
  const pinState = { pinned: ['Apple', 'Google', 'IKEA'], tabs: ['Wikipedia', 'GitHub', 'Figma', 'Linear'], active: 'Google' };
  function renderPins() {
    $('[data-hi]', pinMock).textContent = t('d_hi');
    $('[data-mini]', pinMock).textContent = '';
    $('[data-name]', pinMock).textContent = t('p_Personal');
    flip(pinMock, () => {
      const pb = $('[data-pinned]', pinMock), tb = $('[data-tabs]', pinMock);
      pb.innerHTML = pinState.pinned.map(n => `<button class="tile flip" data-id="${n}" type="button" aria-label="Unpin ${n}">${glyph(n)}</button>`).join('');
      tb.innerHTML = pinState.tabs.map(n => `<li class="tab flip${n === pinState.active ? ' act' : ''}" data-id="${n}">${glyph(n)}<span class="t">${n}</span><button class="pin" type="button" aria-label="Pin ${n}">${PIN}</button></li>`).join('') +
        `<li class="tab new"><span class="glyph" style="background:none;color:inherit;font-size:1.1rem">+</span><span class="t">${t('d_new')}</span></li>`;
      if (!pinState.pinned.length) pb.innerHTML = `<div class="hint-empty" style="grid-column:1/-1">${t('d_pinned_empty')}</div>`;
    });
    $('[data-addr]', pinMock).textContent = pinState.active.toLowerCase() + '.com';
  }
  pinMock.addEventListener('click', e => {
    const pin = e.target.closest('.pin'), tile = e.target.closest('.tile'), tab = e.target.closest('.tab:not(.new)');
    if (pin) { const n = pin.closest('.tab').dataset.id; if (pinState.pinned.length >= 6) return; pinState.tabs = pinState.tabs.filter(x => x !== n); pinState.pinned.push(n); pinState.active = n; renderPins(); }
    else if (tile) { const n = tile.dataset.id; pinState.pinned = pinState.pinned.filter(x => x !== n); pinState.tabs.unshift(n); renderPins(); }
    else if (tab) { pinState.active = tab.dataset.id; renderPins(); }
  });
  renderPins();

  /* ---------- Smart Search demo ---------- */
  const q = $('#q'), list = $('#results');
  const known = [
    { n: 'Apple', u: 'apple.com', pin: 1 }, { n: 'Google', u: 'google.com', pin: 1 }, { n: 'IKEA', u: 'ikea.com', pin: 1 },
    { n: 'Wikipedia', u: 'wikipedia.org' }, { n: 'GitHub', u: 'github.com' }, { n: 'Figma', u: 'figma.com' }
  ];
  const ICON = {
    site: '<svg viewBox="0 0 20 20" width="16" height="16"><circle cx="10" cy="10" r="7" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M3 10h14M10 3c2.5 2.2 2.5 11.8 0 14M10 3c-2.5 2.2-2.5 11.8 0 14" fill="none" stroke="currentColor" stroke-width="1.3"/></svg>',
    search: '<svg viewBox="0 0 20 20" width="16" height="16"><circle cx="8.5" cy="8.5" r="5.2" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M12.7 12.7l4 4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
    tab: '<svg viewBox="0 0 20 20" width="16" height="16"><rect x="3" y="5" width="14" height="10" rx="2.5" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M3 8.5h14" stroke="currentColor" stroke-width="1.4"/></svg>',
    pin: PIN.replace('width="14" height="14"', 'width="15" height="15"')
  };
  const esc = s => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const mark = (s, qq) => { const i = s.toLowerCase().indexOf(qq.toLowerCase()); return !qq || i < 0 ? esc(s) : esc(s.slice(0, i)) + '<b>' + esc(s.slice(i, i + qq.length)) + '</b>' + esc(s.slice(i + qq.length)); };
  function suggest(raw) {
    const s = raw.trim(), ql = s.toLowerCase(), rows = [];
    if (!s) return known.filter(k => k.pin).map(k => ({ ic: 'pin', html: esc(k.n), kd: 'k_pin' }));
    known.filter(k => k.n.toLowerCase().includes(ql) || k.u.includes(ql)).sort((a, b) => (b.pin | 0) - (a.pin | 0)).slice(0, 2)
      .forEach(k => rows.push({ ic: k.pin ? 'pin' : 'tab', html: t('sw') + mark(k.n, s) + ' <span style="opacity:.55">· ' + esc(k.u) + '</span>', kd: k.pin ? 'k_pin' : 'k_tab' }));
    const dom = /^[\w-]+(\.[\w-]+)+(\/\S*)?$/.test(s);
    const goRow = { ic: 'site', html: t('go') + '<b>' + esc(s) + '</b>', kd: 'k_site' };
    const seRow = { ic: 'search', html: t('srch') + '“' + esc(s) + '”', kd: 'k_search' };
    if (dom && !rows.length) rows.push(goRow, seRow); else if (dom) rows.push(goRow, seRow); else rows.push(seRow);
    return rows.slice(0, 4);
  }
  function renderResults(v) {
    const rows = suggest(v);
    list.innerHTML = rows.map((r, i) => `<li role="option" style="animation-delay:${i * 45}ms"><span class="ic">${ICON[r.ic]}</span><span class="tx">${r.html}</span><span class="kd">${t(r.kd)}</span><span class="go">↵</span></li>`).join('');
  }
  q.addEventListener('input', () => { auto.on = false; renderResults(q.value); });
  q.addEventListener('focus', () => { auto.on = false; });
  const auto = { on: true };
  const samples = ['apple.com', 'wiki', 'golden gate bridge', 'git'];
  (function type(si = 0, ci = 0, dir = 1) {
    if (!auto.on || reduce) { if (reduce) renderResults('wiki'); return; }
    const s = samples[si];
    ci += dir; q.value = s.slice(0, ci); renderResults(q.value);
    let wait = dir > 0 ? 90 : 35;
    if (ci >= s.length && dir > 0) { dir = -1; wait = 1800; }
    else if (ci <= 0 && dir < 0) { dir = 1; si = (si + 1) % samples.length; wait = 400; }
    setTimeout(() => type(si, ci, dir), wait);
  })();
  renderResults('');
  addEventListener('keydown', e => { if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'l') { e.preventDefault(); $('#search').scrollIntoView({ behavior: 'smooth', block: 'center' }); q.focus(); q.select(); } });

  /* ---------- Profiles demo ---------- */
  const profMock = $('#profMock');
  const PROFILES = {
    Personal: { wall: 'desert', pinned: ['Apple', 'Google', 'IKEA'], tabs: ['Wikipedia', 'Mail'], addr: 'google.com' },
    Work: { wall: 'dusk', pinned: ['Slack', 'Linear', 'Figma'], tabs: ['GitHub', 'Notion', 'Mail'], addr: 'linear.app' },
    Study: { wall: 'sea', pinned: ['Scholar', 'Arxiv', 'Anki'], tabs: ['Wikipedia', 'Notion'], addr: 'scholar.google.com' }
  };
  let prof = 'Personal';
  profMock.innerHTML = mockHTML({ wall: 'desert', name: '', addr: '' });
  function renderProfile(animate = true) {
    const p = PROFILES[prof];
    $$('.wall', profMock).forEach(w => w.classList.toggle('on', w.classList.contains('wall-' + p.wall)));
    $('[data-name]', profMock).textContent = t('p_' + prof);
    $('[data-addr]', profMock).textContent = p.addr;
    $('[data-hi]', profMock).textContent = t('d_hi');
    $('[data-mini]', profMock).innerHTML = `<span class="badge">${t('d_iso')}</span>`;
    const pb = $('[data-pinned]', profMock), tb = $('[data-tabs]', profMock);
    pb.innerHTML = p.pinned.map(n => `<span class="tile" style="cursor:default">${glyph(n)}</span>`).join('');
    tb.innerHTML = p.tabs.map((n, i) => `<li class="tab${i === 0 ? ' act' : ''}">${glyph(n)}<span class="t">${n}</span></li>`).join('') + `<li class="tab new"><span class="glyph" style="background:none;color:inherit;font-size:1.1rem">+</span><span class="t">${t('d_new')}</span></li>`;
    if (animate && !reduce) [pb, tb].forEach(el => { el.classList.remove('swap'); void el.offsetWidth; el.classList.add('swap'); });
  }
  const seg = $('#seg');
  function buildSeg() {
    seg.innerHTML = '<span class="thumb"></span>' + Object.keys(PROFILES).map(k => `<button type="button" role="tab" aria-selected="${k === prof}" data-p="${k}">${t('p_' + k)}</button>`).join('');
    moveThumb();
  }
  function moveThumb() {
    const b = $('[aria-selected="true"]', seg), th = $('.thumb', seg); if (!b) return;
    th.style.width = b.offsetWidth + 'px'; th.style.transform = `translateX(${b.offsetLeft}px)`;
  }
  seg.addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; prof = b.dataset.p; $$('button', seg).forEach(x => x.setAttribute('aria-selected', x === b)); moveThumb(); renderProfile(); });
  addEventListener('resize', moveThumb);
  document.fonts && document.fonts.ready.then(moveThumb);
  buildSeg(); renderProfile(false);

  /* ---------- Init language ---------- */
  let saved = null; try { saved = localStorage.getItem('cruise-lang'); } catch (e) {}
  if ((saved || (navigator.language || '').toLowerCase()).startsWith('zh')) setLang('zh');
})();
