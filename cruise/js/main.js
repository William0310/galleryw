(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  /* ---------- Language ---------- */
  const ZH = {
    nav_glass: '液态玻璃', nav_adaptive: '自适应', nav_more: '更多',
    download: '下载', download_mac: '下载 Mac 版', learn: '了解更多',
    apply: '申请 Alpha 内测', apply_s: '申请',
    ap_h: 'Cruise Alpha 测试申请', ap_p: 'Cruise 目前处于早期 Alpha 测试阶段，欢迎愿意体验并提供反馈的朋友申请参与。',
    ap_kind: '你是哪种 Mac 用户？', ap_k1: '普通 Mac 用户', ap_k2: '开发者 / 高级用户', ap_k3: '设计师 / 创意工作者',
    ap_mac: '你在用什么 Mac？', ap_m1: 'Apple 芯片，macOS 26', ap_m2: 'Apple 芯片，macOS 15 或更早', ap_m3: 'Intel，macOS 26', ap_m4: 'Intel，macOS 15 或更早',
    ap_int: 'Cruise 的哪些方面吸引你？', ap_ph: '液态玻璃、原生 WebKit、垂直标签页……',
    ap_email: '邮箱 / 微信联系方式', ap_eph: 'you@example.com，或其他联系方式',
    ap_hint: '用于发送测试邀请、版本更新及重要安全通知。',
    ap_notes_h: '测试须知',
    ap_n1: 'Cruise 是实验性软件，可能存在功能缺陷、兼容性问题或未知安全漏洞。',
    ap_n2: '当前测试版本尚未经过 Apple Developer ID 签名及 Apple 公证，macOS 可能要求手动批准运行。',
    ap_n3: '建议不要将 Cruise 作为唯一或主要浏览器，也不要在测试期间使用重要账号或处理敏感数据。',
    ap_n4: '请提前备份重要数据，遇到问题可以随时停止使用并联系开发者。',
    ap_n5: 'Cruise 可能在本地存储浏览记录、Cookies 等正常浏览所需的数据，但不会向开发者发送任何信息。',
    ap_agree: '我已阅读并了解以上测试须知，遇到问题时我同意提供反馈。Cruise 本身不含恶意代码，也不收集你的数据，但我仍需自行承担使用它可能带来的数据与财产损失风险。',
    ap_send: '提交申请', ap_done_h: '谢谢你。', ap_done_p: '我们已收到你的申请，会与你联系。',
    badge: '为 Mac 用 SwiftUI 打造',
    tagline: '一款原生 Mac 浏览器，拥有液态玻璃、Spaces，以及一个可以由你定制的网页。',
    care_h: '为你的 Mac 而生，用心打造。',
    t1_h: '原生 WebKit', t1_p: '由 Apple 的浏览器引擎驱动。',
    t2_h: '隐私优先', t2_p: '你的所有数据都保存在你的 Mac 本地。隐私与安全是我们的重中之重。',
    t3_h: '独立项目', t3_p: '由一位独立开发者打造并维护。',
    t4_h: '透明的 Alpha 版本', t4_p: 'Cruise 目前处于 Alpha 测试阶段。构建版本尚未使用 Apple Developer ID 签名，也未经 Apple 公证。打开前，macOS 可能需要你手动批准该 App。',
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
    foot: '用 SwiftUI 打造。',
    soon: '即将推出', coming: '即将推出', mate_h: '认识 Mate。',
    mate_p: '一个完全在你的 Mac 上运行的免费 AI 助手。它能阅读、翻译、总结你正在看的网页，找不到按钮时还会指给你看。',
    mate_link: '了解 Mate',
    m_nav1: 'Mate 能做什么', m_nav2: '隐私与安全', m_back_btn: '返回 Cruise', m_back: '返回 Cruise',
    m_tag: '完全运行在你 Mac 上的免费网页 AI 助手。',
    m_lede: 'Mate 能阅读、翻译、总结你正在看的网页，也会用光标指引你找到那个找不到的按钮。',
    m_note: 'Mate 尚未发布，将在 Cruise 的后续更新中推出。',
    m_h1: '少读一点，多懂一点。',
    f1_h: '阅读网页', f1_p: '问它一篇长文说了什么，或者一个看不懂的页面需要你做什么。',
    f2_h: '翻译', f2_p: '不离开当前页面，把整页或一段话翻译成你读得懂的语言。',
    f3_h: '总结', f3_p: '把长页面压缩成简短版本，再决定要不要读完。',
    f4_h: '光标引导', f4_p: '找不到正确的按钮？Mate 会把光标移过去，告诉你该点哪里。',
    m_h2: '在你的 Mac 上运行，数据不外传。',
    m_p2: 'Mate 利用电脑处理器在本地运行开源模型。速度很快，不会把你读的网页发送到服务器，而且完全免费。',
    m_1: '开源模型，用你自己的处理器运行', m_2: '网页和提问内容都留在你的 Mac 上', m_3: '无需账号，无需订阅，免费',
    m_end: 'Mate 就要来了。'
  };
  const orig = new Map($$('[data-i18n]').map(el => [el, el.innerHTML]));
  const phOrig = new Map($$('[data-i18n-ph]').map(el => [el, el.placeholder]));
  const langBtn = $('#lang');
  function setLang(l) {
    document.documentElement.lang = l === 'zh' ? 'zh-CN' : 'en';
    $$('[data-i18n]').forEach(el => { const k = el.dataset.i18n; el.innerHTML = l === 'zh' && ZH[k] ? ZH[k] : orig.get(el); });
    $$('[data-i18n-ph]').forEach(el => { el.placeholder = l === 'zh' && ZH[el.dataset.i18nPh] ? ZH[el.dataset.i18nPh] : phOrig.get(el); });
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
