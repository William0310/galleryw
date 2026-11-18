import { initPage, kineticHeading, gsap, ScrollTrigger, env, split } from './core/page.js';
import content from './data/content.js';

// --- fill the page from content.js (edited in the admin app) ------------------------------
const A = content.about;
const esc = (t) => String(t ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
// Plain text with any e-mail address turned into a mailto link.
const linkify = (t) => esc(t).replace(/[\w.+-]+@[\w-]+\.[\w.-]+/g, (m) => `<a href="mailto:${m}">${m}</a>`);
document.querySelectorAll('[data-text]').forEach((el) => { el.textContent = (A[el.dataset.text] || '') + (el.dataset.suffix || ''); });
document.querySelectorAll('[data-html]').forEach((el) => { el.innerHTML = linkify(A[el.dataset.html]); });
document.querySelector('.ab-spec__list').innerHTML = (A.spec || []).map((r) =>
  `<div class="ab-row"><dt>${esc(r.label)}</dt><dd>${linkify(r.value).replace(/contact form/i, (m) => `<a href="#contact" data-scroll>${m}</a>`)}</dd></div>`).join('');
document.title = `About ${A.name} — Wphotographs`;

initPage();
const R = env.reduced;

kineticHeading(document.querySelector('.ab-name'), { min: 200, max: 900 });

// Portrait: a print sliding out of its sleeve, then a slow parallax.
const frame = document.querySelector('.ab-portrait__frame');
const img = frame.querySelector('img');
if (!R) {
  gsap.fromTo(frame, { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.6, delay: 0.3, ease: 'expo.inOut' });
  gsap.fromTo(img, { scale: 1.25 }, { scale: 1.08, duration: 2.2, delay: 0.3, ease: 'expo.out' });
  gsap.fromTo(img, { yPercent: -4 }, { yPercent: 4, ease: 'none', scrollTrigger: { trigger: '.ab-hero', start: 'top top', end: 'bottom top', scrub: true } });
}

// Spec sheet: rows print in one by one behind a scanning line.
const rows = [...document.querySelectorAll('.ab-row')];
if (!R) {
  ScrollTrigger.create({
    trigger: '.ab-spec', start: 'top 75%', once: true,
    onEnter: () => {
      gsap.timeline()
        .fromTo('.ab-spec', { '--scan': '0%' }, { '--scan': '100%', duration: 1.6, ease: 'power2.inOut' })
        .fromTo(rows, { opacity: 0, x: -16 }, { opacity: 1, x: 0, duration: 0.8, stagger: 0.12, ease: 'power3.out' }, 0.1);
    },
  });
  gsap.set(rows, { opacity: 0 });
}

// Manifesto: words light up as you read; the line stretches wider as it finishes.
const big = document.querySelector('.ab-manifesto__big');
const words = split(big);
if (!R) {
  gsap.timeline({ scrollTrigger: { trigger: '.ab-manifesto', start: 'top 70%', end: 'bottom 60%', scrub: true } })
    .fromTo(words, { opacity: 0.12 }, { opacity: 1, stagger: 0.15, ease: 'none' })
    .fromTo(big, { fontStretch: '75%' }, { fontStretch: '125%', ease: 'none', duration: words.length * 0.15 }, 0);
}

// Notice band drifts with the scroll.
if (!R) {
  gsap.fromTo('.ab-notice__track', { xPercent: 0 }, { xPercent: -50, ease: 'none', scrollTrigger: { trigger: '.ab-notice', start: 'top bottom', end: 'bottom top', scrub: true } });
}
const title = document.querySelector('#contact-title');
const tChars = split(title, { chars: true });
if (!R) gsap.fromTo(tChars, { yPercent: 110 }, { yPercent: 0, stagger: 0.03, duration: 1.1, ease: 'expo.out', scrollTrigger: { trigger: title, start: 'top 85%', once: true } });

// Contact form: posts to the same Formspree endpoint as before, without leaving the page.
const form = document.querySelector('[data-contact-form]');
const submit = form.querySelector('[data-contact-submit]');
const status = form.querySelector('[data-contact-status]');
const setState = (state, message) => {
  form.classList.toggle('is-sending', state === 'sending');
  form.classList.toggle('is-success', state === 'success');
  form.classList.toggle('is-error', state === 'error');
  submit.disabled = state === 'sending';
  status.textContent = message;
};
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!form.checkValidity()) {
    form.classList.add('was-validated');
    form.reportValidity();
    return;
  }
  setState('sending', 'Sending…');
  try {
    const res = await fetch(form.action, { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' } });
    if (!res.ok) throw new Error('Form submission failed');
    form.reset();
    form.classList.remove('was-validated');
    setState('success', 'Message sent. Thank you — expect a reply within 36 hours.');
  } catch {
    setState('error', `Could not send right now. Please email ${A.email} directly.`);
  }
});
