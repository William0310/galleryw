/* ==========================================================
   行记 — per-album ambient soundscapes (Web Audio API)
   Everything is synthesised live — no external audio files.

   青海  faint distant wind + lake water lapping
   重庆  deep city rumble/reverb + a passing light-rail
   日本  thin summer cicadas + a distant temple bell
   北京  fine, granular willow-leaf rustle
   丽江  a howling mountain wind

   On album.html one bed plays for the open album.
   On index.html the beds cross-fade as you scroll past each chapter.
   ========================================================== */
(function () {
  'use strict';

  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;

  /* shared context — the click sound (sound.js) and the ambient beds
     share one graph and unlock together on the first user gesture */
  window.WPAudio = window.WPAudio || (function () {
    let ctx = null;
    return {
      get() { if (!ctx) ctx = new AC(); return ctx; },
      resume() { const c = this.get(); if (c.state === 'suspended') c.resume(); return c; },
    };
  })();

  const ctx = window.WPAudio.get();

  /* ---------- master bus ---------- */
  const MASTER_VOL = 0.55;
  const FADE = 1.6;            // cross-fade seconds
  const master = ctx.createGain();
  master.gain.value = 0;       // raised once unlocked
  master.connect(ctx.destination);

  /* ---------- tiny dsp helpers ---------- */
  function gain(v) { const g = ctx.createGain(); g.gain.value = v; return g; }

  function noise(seconds, type) {
    const len = Math.floor(ctx.sampleRate * seconds);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    if (type === 'brown') {
      let last = 0;
      for (let i = 0; i < len; i++) { const w = Math.random() * 2 - 1; last = (last + 0.02 * w) / 1.02; d[i] = last * 3.5; }
    } else if (type === 'pink') {
      let b0 = 0, b1 = 0, b2 = 0;
      for (let i = 0; i < len; i++) {
        const w = Math.random() * 2 - 1;
        b0 = 0.99765 * b0 + w * 0.0990460;
        b1 = 0.96300 * b1 + w * 0.2965164;
        b2 = 0.57000 * b2 + w * 1.0526913;
        d[i] = (b0 + b1 + b2 + w * 0.1848) * 0.22;
      }
    } else {
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    }
    return buf;
  }

  function loop(buf) { const s = ctx.createBufferSource(); s.buffer = buf; s.loop = true; return s; }

  /* add a slow sine wobble of ±depth onto an AudioParam around its set value */
  function lfo(param, rate, depth, type) {
    const o = ctx.createOscillator(); o.type = type || 'sine'; o.frequency.value = rate;
    const g = gain(depth);
    o.connect(g).connect(param); o.start();
    return o;
  }

  /* short synthetic room impulse for the reverberant beds */
  function impulse(seconds, decay) {
    const len = Math.floor(ctx.sampleRate * seconds);
    const buf = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = buf.getChannelData(ch);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
    }
    return buf;
  }

  /* Buffers are generated lazily on first use (which only happens after the
     first user gesture unlocks audio) — generating ~3s of pink/brown noise is
     ~400k iterations, so keeping it off the initial load lowers blocking time. */
  let _white, _pink, _brown;
  function whiteBuf() { return _white || (_white = noise(3, 'white')); }
  function pinkBuf()  { return _pink  || (_pink  = noise(3, 'pink'));  }
  function brownBuf() { return _brown || (_brown = noise(3, 'brown')); }

  /* ==========================================================
     SCENES — each returns { out, peak, _audible, schedule? }
     `out` (gain 0) is what the engine ramps for cross-fades.
     ========================================================== */

  /* 青海 — distant wind over the plateau + the lake lapping the shore */
  function qinghai() {
    const out = gain(0);

    const wind = loop(pinkBuf());
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 480; bp.Q.value = 0.7;
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 900;
    const wg = gain(0.16);
    lfo(bp.frequency, 0.05, 220);
    lfo(wg.gain, 0.03, 0.05);
    wind.connect(bp).connect(lp).connect(wg).connect(out);
    wind.start();

    const water = loop(whiteBuf());
    const wlp = ctx.createBiquadFilter(); wlp.type = 'lowpass'; wlp.frequency.value = 420; wlp.Q.value = 0.5;
    const swell = gain(0.12);
    lfo(swell.gain, 0.30, 0.09);   // a lap every ~3s
    lfo(swell.gain, 0.13, 0.03);   // longer rolling swell
    water.connect(wlp).connect(swell).connect(out);
    water.start();

    return { out, peak: 0.9, _audible: false };
  }

  /* 丽江 — a howling wind off the snow mountain */
  function lijiang() {
    const out = gain(0);

    const body = loop(pinkBuf());
    const blp = ctx.createBiquadFilter(); blp.type = 'lowpass'; blp.frequency.value = 1400;
    const bg = gain(0.18);
    lfo(bg.gain, 0.12, 0.10);          // gusting
    lfo(blp.frequency, 0.08, 500);
    body.connect(blp).connect(bg).connect(out);
    body.start();

    const howl = loop(whiteBuf());
    const hbp = ctx.createBiquadFilter(); hbp.type = 'bandpass'; hbp.frequency.value = 1100; hbp.Q.value = 6;
    const hg = gain(0.10);
    lfo(hbp.frequency, 0.09, 600);     // the whistle sweeping
    lfo(hbp.frequency, 0.21, 220);
    lfo(hg.gain, 0.16, 0.08);
    howl.connect(hbp).connect(hg).connect(out);
    howl.start();

    const hbp2 = ctx.createBiquadFilter(); hbp2.type = 'bandpass'; hbp2.frequency.value = 2200; hbp2.Q.value = 9;
    const hg2 = gain(0.04);
    lfo(hbp2.frequency, 0.13, 700);
    lfo(hg2.gain, 0.10, 0.035);
    howl.connect(hbp2).connect(hg2).connect(out);

    return { out, peak: 1.0, _audible: false };
  }

  /* 重庆 — deep city rumble & reverb, a light-rail passing now and then */
  function chongqing() {
    const out = gain(0);

    const rumble = loop(brownBuf());
    const rlp = ctx.createBiquadFilter(); rlp.type = 'lowpass'; rlp.frequency.value = 110; rlp.Q.value = 0.6;
    const rg = gain(0.5);
    lfo(rg.gain, 0.05, 0.12);
    rumble.connect(rlp).connect(rg).connect(out);
    rumble.start();

    const sub = ctx.createOscillator(); sub.type = 'sine'; sub.frequency.value = 54;
    const sg = gain(0.05);
    lfo(sub.frequency, 0.07, 1.5);
    sub.connect(sg).connect(out); sub.start();

    const hum = loop(pinkBuf());
    const hbp = ctx.createBiquadFilter(); hbp.type = 'bandpass'; hbp.frequency.value = 240; hbp.Q.value = 0.5;
    const conv = ctx.createConvolver(); conv.buffer = impulse(2.6, 3.0);
    const hg = gain(0.05);
    hum.connect(hbp).connect(hg).connect(conv).connect(out);
    hum.start();

    const scene = { out, peak: 0.9, _audible: false };

    function pass() {
      if (!scene._audible) return;
      const t0 = ctx.currentTime;
      const dur = 3.2 + Math.random() * 1.6;
      const src = loop(whiteBuf());
      const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 1.4;
      bp.frequency.setValueAtTime(340, t0);
      bp.frequency.linearRampToValueAtTime(900, t0 + dur * 0.5);   // doppler approach
      bp.frequency.linearRampToValueAtTime(300, t0 + dur);         // and recede
      const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1500;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(0.16, t0 + dur * 0.5);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      src.connect(bp).connect(lp).connect(g).connect(out);
      src.start(t0); src.stop(t0 + dur + 0.1);
    }

    scene.schedule = function next() {
      setTimeout(() => { pass(); next(); }, (11 + Math.random() * 11) * 1000);
    };
    scene.schedule();
    return scene;
  }

  /* 日本 — faint cicadas in the heat, a temple bell far off */
  function japan() {
    const out = gain(0);

    const chorus = gain(0.06);
    lfo(chorus.gain, 0.18, 0.045);   // cicada waves swelling in and out
    chorus.connect(out);

    function cicada(freq, amRate) {
      const src = loop(whiteBuf());
      const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = freq; bp.Q.value = 18;
      const am = gain(0.5);
      lfo(am.gain, amRate, 0.5);     // fast tremolo = the buzz
      const lv = gain(0.6);
      src.connect(bp).connect(am).connect(lv).connect(chorus);
      src.start();
    }
    cicada(3500, 58);
    cicada(4300, 67);
    cicada(5200, 74);

    const bellBus = gain(1.5);
    const conv = ctx.createConvolver(); conv.buffer = impulse(4.5, 2.4);
    bellBus.connect(conv).connect(out);
    bellBus.connect(gain(0.45)).connect(out);   // a little dry signal too

    const scene = { out, peak: 0.85, _audible: false };

    function bell() {
      if (!scene._audible) return;
      const t0 = ctx.currentTime + 0.02;
      const base = 98 + Math.random() * 4;     // ~G3, distant
      // 优化后的泛音列配方
const partials = [
    [1, 0.6, 7.0],      // 基音：振幅加大，衰减拉长到 7 秒，留住低沉的尾音
    [2, 0.3, 4.0],      // 二次泛音：中规中矩
    [2.76, 0.15, 2.5],  // 不谐和泛音（钟声特有的青铜感）：降低振幅，缩短时间
    [4.2, 0.05, 0.8],   // 高频泛音A：大幅降低振幅(0.05)，瞬间衰减(0.8秒)
    [6.0, 0.02, 0.3]    // 高频泛音B（敲击瞬间的金属尖锐感）：几乎不可闻，一闪而过(0.3秒)
];
      partials.forEach(([mult, amp, dec]) => {
        const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = base * mult;
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.0001, t0);
        g.gain.exponentialRampToValueAtTime(amp, t0 + 0.012);
        g.gain.exponentialRampToValueAtTime(0.0001, t0 + dec);
        o.connect(g).connect(bellBus);
        o.start(t0); o.stop(t0 + dec + 0.1);
      });
    }

    let first = true;
    scene.schedule = function next() {
      const wait = first ? 6000 : (18 + Math.random() * 5) * 1000;
      first = false;
      setTimeout(() => { bell(); next(); }, wait);
    };
    scene.schedule();
    return scene;
  }

  /* 北京 — fine willow leaves rustling at the lake's edge */
  function beijing() {
  const out = gain(0);

  // 1. 主树叶声沙沙声：改用粉红噪声（pinkBuf），听起来更温和、更自然
  const leaves = loop(pinkBuf());
  
  // 滤波器配置：用带通滤波器锁住树叶沙沙声的核心频段，Q值低一点让声音更宽广
  const bp = ctx.createBiquadFilter(); 
  bp.type = 'bandpass'; 
  bp.frequency.value = 2400; 
  bp.Q.value = 0.4; // 较低的Q值可以让声音更柔和松散

  const g = gain(0.04);

  // 【核心修改】去除之前 7Hz、11Hz 的高速颤动（那是造成蒸汽火车/砂槌声的元凶）
  // 改用超低频 LFO，模拟大自然微风吹过，树叶一波一波、连绵不绝的“呼吸感”
  lfo(g.gain, 0.15, 0.025);          // 主微风起伏（约 6.6 秒一个周期）
  lfo(g.gain, 0.07, 0.015);          // 更宏观的长周期风力变化
  lfo(g.gain, 0.45, 0.01);           // 极轻微的枝叶无规律乱颤，幅度一定要小

  // 让树叶的音色随风力也产生微妙的飘移（风大时高频多一点，风小时沉闷一点）
  lfo(bp.frequency, 0.12, 500);

  leaves.connect(bp).connect(g).connect(out);
  leaves.start();

  // 2. 辅助空气感/远方背景树浪声
  const l2 = loop(pinkBuf());
  const hp2 = ctx.createBiquadFilter(); 
  hp2.type = 'highpass'; 
  hp2.frequency.value = 1800; // 稍微放低一点截止频率，增加厚度

  const g2 = gain(0.02);
  lfo(g2.gain, 0.09, 0.015);        // 极其缓慢的背景空气流动
  lfo(g2.gain, 0.28, 0.01);

  l2.connect(hp2).connect(g2).connect(out);
  l2.start();

  return { out, peak: 0.85, _audible: false };
}

  const SCENES = { qinghai, lijiang, chongqing, japan, beijing };

  /* ==========================================================
     ENGINE — lazy build, cross-fade, mute, unlock
     ========================================================== */
  const built = {};
  let desired = null;
  let unlocked = false;
  let muted = false;
  try { muted = localStorage.getItem('wp_ambient_muted') === '1'; } catch (e) {}

  function ensure(key) {
    if (!built[key]) {
      const s = SCENES[key]();
      s.out.connect(master);
      built[key] = s;
    }
    return built[key];
  }

  function ramp(param, to, time) {
    const now = ctx.currentTime;
    const cur = param.value;
    param.cancelScheduledValues(now);
    param.setValueAtTime(cur, now);
    param.linearRampToValueAtTime(to, now + Math.max(0.02, time));
  }

  function apply() {
    if (!unlocked || muted) return;
    ramp(master.gain, MASTER_VOL, 0.8);
    Object.keys(built).forEach((k) => {
      if (k === desired) return;
      built[k]._audible = false;
      ramp(built[k].out.gain, 0, FADE);
    });
    if (desired && SCENES[desired]) {
      const s = ensure(desired);
      s._audible = true;
      ramp(s.out.gain, s.peak, FADE);
    }
  }

  function setActive(key) {
    if (key && !SCENES[key]) key = null;
    if (key === desired) return;
    desired = key;
    apply();
  }

  function setMuted(m) {
    muted = m;
    try { localStorage.setItem('wp_ambient_muted', m ? '1' : '0'); } catch (e) {}
    if (m) ramp(master.gain, 0, 0.5);
    else { window.WPAudio.resume(); apply(); }
    updateToggle();
  }

  function unlock() {
    if (unlocked) return;
    unlocked = true;
    window.WPAudio.resume();
    apply();
  }
  ['pointerdown', 'touchstart', 'keydown', 'wheel', 'scroll'].forEach((ev) =>
    window.addEventListener(ev, unlock, { passive: true }));

  window.WPAmbient = { setActive, setMuted, isMuted: () => muted };

  /* ---------- mute toggle (injected) ---------- */
  const toggle = document.createElement('button');
  toggle.className = 'sound-toggle';
  toggle.type = 'button';
  toggle.setAttribute('aria-label', 'Toggle ambient sound');
  toggle.innerHTML = '<span class="sound-toggle-bars"><i></i><i></i><i></i><i></i></span>';
  toggle.addEventListener('click', () => setMuted(!muted));
  function updateToggle() {
    toggle.classList.toggle('is-muted', muted);
    toggle.setAttribute('aria-pressed', String(!muted));
  }
  (document.body || document.documentElement).appendChild(toggle);
  updateToggle();

  /* ==========================================================
     PAGE WIRING
     ========================================================== */

  /* homepage: cross-fade beds as each chapter passes through centre */
  function initHome() {
    if (!window.ScrollTrigger || !document.getElementById('qinghai')) return;
    ['qinghai', 'lijiang', 'chongqing', 'japan', 'beijing'].forEach((key) => {
      const sec = document.getElementById(key);
      if (!sec) return;
      window.ScrollTrigger.create({
        trigger: sec, start: 'top 55%', end: 'bottom 45%',
        onToggle: (self) => {
          if (self.isActive) setActive(key);
          else if (desired === key) setActive(null);
        },
      });
    });
  }

  /* album page: play the bed for whichever album is open */
  function initAlbum() {
    if (!document.body.classList.contains('album-body')) return;
    let key = null;
    try {
      const slug = new URLSearchParams(location.search).get('a');
      if (window.ALBUMS && window.ALBUMS[slug]) key = slug;
      else if (window.ALBUM_ORDER) key = window.ALBUM_ORDER[0];
    } catch (e) {}
    setActive(SCENES[key] ? key : null);
  }

  initHome();
  initAlbum();
})();
