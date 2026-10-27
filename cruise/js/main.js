(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  /* ---------- Language ---------- */
  const ZH = {
    nav_glass: '液态玻璃', nav_adaptive: '自适应', nav_more: '更多',
    download: '下载', download_mac: '下载 Mac 版', learn: '了解更多',
    badge: '为 Mac 用 SwiftUI 打造',
    tagline: '像船长一样，巡航整个互联网。',
    lede: '大块液态玻璃，灵动自然的动效，还有一个会融入网页的侧边栏。',
    glass_h: '玻璃做的侧边栏。',
    glass_p: '一整块液态玻璃承载地址栏、标签页和固定标签。它透出你的壁纸与网页的色彩，让浏览器融入桌面，而不是盖在桌面上。',
    glass_1: '大面积、连续的玻璃质感', glass_2: '标签页、面板和按钮都带弹簧动效', glass_3: '原生 SwiftUI 控件',
    adaptive_h: '全屏，沉浸。',
    adaptive_p: '全屏时，侧边栏会变成网页的颜色。落日、白色首页、绿色山坡，浏览器都与网站融为一体，不再有边框。',
    ad_cap1: '落日照片', ad_cap2: '白色页面', ad_cap3: '绿色山坡',
    cz_h: '让每个网站都由你定制。',
    cz_p: '隐藏你从不使用的广告、横幅和按钮，调整网站的颜色和字体。Cruise 会为每个网站记住你的修改。',
    cz_1: '指向元素，点击即可隐藏', cz_2: '为单个网站调整颜色和字体', cz_3: '保存在你的 Mac 上，登录和支付输入框不会被隐藏',
    pins_h: '只留下最重要的几个。',
    pins_p: '把每天都要打开的网站固定下来。它们以大图块的形式停在侧边栏顶部，一键直达，不会随其他标签页来去。',
    more_eye: '还有这些', more_h: '细节，认真做好。',
    s_h: '智能搜索', s_p: '输入网址、问题，或是标签页的名字。Cruise 会判断你的意图，把最合适的结果放在第一位。',
    p_h: 'Profile 隔离', p_p: '每个 Profile 都有独立的标签页、固定网站、Cookie 和登录状态。一键切换，彼此完全隔离。',
    n_h: '原生 SwiftUI', n_p: '不是给网页套一层外壳。界面由你每天使用的 App 同款控件构成。',
    k_h: '键盘优先', k_p: '随时按 ⌘L，直接在地址栏输入。',
    foot: '用 SwiftUI 打造。'
  };
  const orig = new Map($$('[data-i18n]').map(el => [el, el.innerHTML]));
  const langBtn = $('#lang');
  function setLang(l) {
    document.documentElement.lang = l === 'zh' ? 'zh-CN' : 'en';
    $$('[data-i18n]').forEach(el => { const k = el.dataset.i18n; el.innerHTML = l === 'zh' && ZH[k] ? ZH[k] : orig.get(el); });
    langBtn.textContent = l === 'zh' ? 'English' : '中文';
    langBtn.dataset.l = l;
    try { localStorage.setItem('cruise-lang', l); } catch (e) {}
  }
  langBtn.addEventListener('click', () => setLang(langBtn.dataset.l === 'zh' ? 'en' : 'zh'));
  let saved = null; try { saved = localStorage.getItem('cruise-lang'); } catch (e) {}
  if ((saved || navigator.language || '').toLowerCase().startsWith('zh')) setLang('zh'); else langBtn.dataset.l = 'en';

  /* ---------- Reveal on scroll ---------- */
  if ('IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.documentElement.classList.add('js');
    const items = $$('.copy, .head, .visual, .trio, .grid, .get-in');
    items.forEach(el => el.classList.add('reveal'));
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -6% 0px', threshold: .05 });
    items.forEach(el => io.observe(el));
  }
})();
