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

  /* ---------- bfcache restore (mobile back button) ----------
     When leaving a page we set .is-exiting (curtain covers the screen) and
     navigate. The browser may freeze that page in the back/forward cache with
     the curtain still covering. On a back-button restore the scripts do NOT
     re-run, so the curtain would stay up and hide all content behind a blank
     panel. pageshow(persisted) is the one event that fires in that case —
     clear the curtain (and any leftover preloader) so the page is usable. */
  window.addEventListener('pageshow', (e) => {
    if (!e.persisted) return;
    curtain.classList.remove('is-exiting', 'is-covering');
    const pre = document.getElementById('preloader');
    if (pre) pre.style.display = 'none';
  });

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
