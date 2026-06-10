/* ==========================================================
   行记 — page enter/exit curtain transition
   ========================================================== */
(function () {
  'use strict';

  const curtain = document.querySelector('.page-transition');
  if (!curtain) return;

  /* ---------- entry: reveal page from behind curtain ---------- */
  if (curtain.classList.contains('is-covering')) {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => curtain.classList.remove('is-covering'));
    });
  }

  /* ---------- exit: cover before navigating to another page ---------- */
  document.addEventListener('click', (e) => {
    if (e.defaultPrevented || e.button !== 0) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

    const a = e.target.closest('a[href]');
    if (!a || a.target === '_blank' || a.hasAttribute('download')) return;

    const href = a.getAttribute('href');
    if (!href || !/^[^:#]*\.html(\?.*)?$/.test(href)) return;

    e.preventDefault();
    curtain.classList.remove('is-covering');
    curtain.classList.add('is-exiting');
    setTimeout(() => { window.location.href = href; }, 650);
  });
})();
