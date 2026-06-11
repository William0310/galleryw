/* ==========================================================
   行记 — button click sound (Web Audio API)
   ========================================================== */
(function () {
  'use strict';

  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) return;

  let ctx = null;
  function getCtx() {
    // share the ambient engine's context when present, so both unlock together
    if (window.WPAudio) return window.WPAudio.resume();
    if (!ctx) ctx = new Ctx();
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function playClick() {
    const ac = getCtx();
    const now = ac.currentTime;

    /* low woody thump */
    const osc = ac.createOscillator();
    const oscGain = ac.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(300, now);
    osc.frequency.exponentialRampToValueAtTime(50, now + 0.05);
    oscGain.gain.setValueAtTime(0.0001, now);
    oscGain.gain.exponentialRampToValueAtTime(0.35, now + 0.004);
    oscGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.065);
    osc.connect(oscGain).connect(ac.destination);
    osc.start(now);
    osc.stop(now + 0.07);

    /* short knock transient */
    const noiseDur = 0.03;
    const buffer = ac.createBuffer(1, Math.ceil(ac.sampleRate * noiseDur), ac.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;

    const noise = ac.createBufferSource();
    noise.buffer = buffer;
    const noiseFilter = ac.createBiquadFilter();
    noiseFilter.type = 'lowpass';
    noiseFilter.frequency.setValueAtTime(600, now);
    const noiseGain = ac.createGain();
    noiseGain.gain.setValueAtTime(0.0001, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.18, now + 0.002);
    noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.035);

    noise.connect(noiseFilter).connect(noiseGain).connect(ac.destination);
    noise.start(now);
    noise.stop(now + noiseDur);
  }

  const SELECTOR = 'button, [role="button"], .album-link, .menu-list a, .album-home, .end-news, .album-back, .brand';

  document.addEventListener('click', (e) => {
    const btn = e.target.closest(SELECTOR);
    if (!btn || btn.disabled) return;
    playClick();
  });
})();
