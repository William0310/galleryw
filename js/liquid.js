/* ==========================================================
   行记 — Liquid silk (homepage album buttons)
   Desktop (fine pointer): a single shared WebGL canvas painted
   into whichever ".chapter .album-link" is hovered.
   Touch (coarse pointer): the silk is resident inside every
   button (its own small canvas each), gated by
   IntersectionObserver so only on-screen buttons actually
   render — cheap, since a vertical scroller only ever shows
   one or two at a time. Tapping shows a dark ink wipe over the
   silk via .is-tapped (the original cover-effect look).
   Falls back to the CSS gradient when WebGL isn't available.
   ========================================================== */

(function () {
  'use strict';

  const coarse = window.matchMedia('(pointer: coarse)').matches;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const links = Array.prototype.slice.call(
    document.querySelectorAll('.chapter .album-link')
  );
  if (reduced || !links.length) return; // CSS fallback stays

  const VERT = `
    attribute vec2 p;
    void main() { gl_Position = vec4(p, 0.0, 1.0); }
  `;

  const FRAG = `
    precision highp float;
    uniform float uTime;
    uniform vec2  uRes;
    uniform float uDark;

    vec2 hash2(vec2 p) {
      p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
      return fract(sin(p) * 43758.5453) * 2.0 - 1.0;
    }
    float noise(vec2 p) {
      vec2 i = floor(p), f = fract(p);
      vec2 u = f * f * (3.0 - 2.0 * f);
      return mix(mix(dot(hash2(i + vec2(0.0, 0.0)), f - vec2(0.0, 0.0)),
                     dot(hash2(i + vec2(1.0, 0.0)), f - vec2(1.0, 0.0)), u.x),
                 mix(dot(hash2(i + vec2(0.0, 1.0)), f - vec2(0.0, 1.0)),
                     dot(hash2(i + vec2(1.0, 1.0)), f - vec2(1.0, 1.0)), u.x), u.y);
    }
    float fbm(vec2 p) {
      float a = 0.5, s = 0.0;
      for (int i = 0; i < 4; i++) { s += a * noise(p); p *= 2.0; a *= 0.5; }
      return s;
    }

    void main() {
      vec2 uv = gl_FragCoord.xy / uRes.xy;
      vec2 p = uv;
      p.x *= uRes.x / uRes.y;   // keep the silk square, not stretched
      p *= 2.2;
      float t = uTime * 0.16;

      // --- domain warp: flow folded into itself, like poured silk ---
      vec2 q = vec2(fbm(p + vec2(0.0, t)),
                    fbm(p + vec2(5.2, 1.3 - t)));
      vec2 r = vec2(fbm(p + 3.0 * q + vec2(1.7, 9.2) + 0.18 * t),
                    fbm(p + 3.0 * q + vec2(8.3, 2.8) - 0.14 * t));
      float f = fbm(p + 3.0 * r);
      f = f * 0.5 + 0.5;

      // --- satin sheen: a thin moving highlight riding the folds ---
      float sheen = 0.5 + 0.5 * sin(f * 7.0 + (r.x - r.y) * 3.2 + t * 1.6);
      float spec = pow(clamp(sheen, 0.0, 1.0), 7.0);

      // --- molten-orange palette (bright) ---
      vec3 cValley = vec3(0.42, 0.10, 0.07);  // warm ember, no longer near-black
      vec3 cMid    = vec3(0.92, 0.38, 0.10);  // vivid accent orange
      vec3 cHi     = vec3(1.00, 0.68, 0.28);  // bright orange
      vec3 cSpec   = vec3(1.00, 0.92, 0.68);  // warm gold sheen

      vec3 col = mix(cValley, cMid, smoothstep(0.0, 0.5, f));
      col = mix(col, cHi, smoothstep(0.40, 0.88, f));
      col += cSpec * spec * (0.40 + 0.55 * f);

      // gentle vignette keeps the cream label legible over the silk
      float vig = smoothstep(1.15, 0.20, length(uv - 0.5));
      col *= mix(0.90, 1.0, vig);
      col *= mix(1.0, 0.94, uDark);   // a touch deeper in dark chapters

      gl_FragColor = vec4(col, 1.0);
    }
  `;

  // Compiles the silk program into a given GL context. Returns the uniform
  // locations, or null (caller keeps the CSS fallback) if anything fails.
  function buildProgram(gl) {
    function compile(type, src) {
      const s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        console.error(gl.getShaderInfoLog(s));
        return null;
      }
      return s;
    }
    const prog = gl.createProgram();
    const vs = compile(gl.VERTEX_SHADER, VERT);
    const fs = compile(gl.FRAGMENT_SHADER, FRAG);
    if (!vs || !fs) return null;
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      console.error(gl.getProgramInfoLog(prog));
      return null;
    }
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const aPos = gl.getAttribLocation(prog, 'p');
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    return {
      uTime: gl.getUniformLocation(prog, 'uTime'),
      uRes: gl.getUniformLocation(prog, 'uRes'),
      uDark: gl.getUniformLocation(prog, 'uDark'),
    };
  }

  function makeCanvas() {
    const c = document.createElement('canvas');
    c.className = 'liquid-fx-canvas';
    c.setAttribute('aria-hidden', 'true');
    return c;
  }

  function makeGL(canvas) {
    return canvas.getContext('webgl', {
      antialias: false, alpha: false, depth: false,
      stencil: false, preserveDrawingBuffer: false, powerPreference: 'low-power'
    });
  }

  if (coarse) {
    // ---- Touch: silk is resident inside every button ----
    links.forEach((el) => {
      const canvas = makeCanvas();
      const gl = makeGL(canvas);
      if (!gl) return; // this button keeps the CSS fallback
      const u = buildProgram(gl);
      if (!u) return;

      el.insertBefore(canvas, el.firstChild);
      canvas.style.clipPath = 'inset(0)'; // always fully visible, no reveal animation
      document.documentElement.classList.add('liquid-fx');

      const dark = !!el.closest('[data-theme-dark]');
      gl.uniform1f(u.uDark, dark ? 1.0 : 0.0);

      let raf = 0, startT = 0, visible = false;

      function size() {
        const r = el.getBoundingClientRect();
        const w = Math.max(1, Math.round(r.width));
        const h = Math.max(1, Math.round(r.height));
        if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
        gl.viewport(0, 0, w, h);
        gl.uniform2f(u.uRes, w, h);
      }
      function frame(now) {
        if (!visible) return;
        if (!startT) startT = now;
        gl.uniform1f(u.uTime, (now - startT) * 0.001);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
        raf = requestAnimationFrame(frame);
      }

      // only render while the button is actually on screen
      const io = new IntersectionObserver((entries) => {
        visible = entries[0].isIntersecting;
        cancelAnimationFrame(raf); raf = 0;
        if (visible) { size(); startT = 0; raf = requestAnimationFrame(frame); }
      }, { threshold: 0.05 });
      io.observe(el);

      window.addEventListener('resize', () => { if (visible) size(); }, { passive: true });
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) { cancelAnimationFrame(raf); raf = 0; }
        else if (visible) { startT = 0; cancelAnimationFrame(raf); raf = requestAnimationFrame(frame); }
      });

      // tap feedback: dark ink overlay (CSS ::after, see style.css)
      el.addEventListener('touchstart', () => el.classList.add('is-tapped'), { passive: true });
      el.addEventListener('touchend', () => setTimeout(() => el.classList.remove('is-tapped'), 220), { passive: true });
      el.addEventListener('touchcancel', () => el.classList.remove('is-tapped'), { passive: true });
    });
    return;
  }

  // ---- Desktop (fine pointer): one shared canvas, painted on hover ----
  const canvas = makeCanvas();
  const gl = makeGL(canvas);
  if (!gl) return; // keep CSS fallback
  const u = buildProgram(gl);
  if (!u) return;

  document.documentElement.classList.add('liquid-fx');

  let raf = 0, startT = 0, active = null;

  function size(el) {
    const r = el.getBoundingClientRect();
    const w = Math.max(1, Math.round(r.width));
    const h = Math.max(1, Math.round(r.height));   // DPR 1 — silk is soft, no retina needed
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w; canvas.height = h;
    }
    gl.viewport(0, 0, w, h);
    gl.uniform2f(u.uRes, w, h);
  }

  function frame(now) {
    if (!active) return;
    if (!startT) startT = now;
    gl.uniform1f(u.uTime, (now - startT) * 0.001);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    raf = requestAnimationFrame(frame);
  }

  function enter(el) {
    active = el;
    el.classList.add('is-live');
    el.insertBefore(canvas, el.firstChild);
    size(el);
    const dark = document.body.classList.contains('theme-dark') ||
                 !!el.closest('[data-theme-dark]');
    gl.uniform1f(u.uDark, dark ? 1.0 : 0.0);

    // left-to-right silk reveal (undistorted, via clip-path)
    canvas.style.clipPath = 'inset(0 100% 0 0)';
    void canvas.offsetWidth;                 // commit the collapsed state
    canvas.style.clipPath = 'inset(0 0 0 0)';

    startT = 0;
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(frame);
  }

  function leave(el) {
    cancelAnimationFrame(raf);
    raf = 0;
    active = null;
    el.classList.remove('is-live');
    canvas.style.clipPath = 'inset(0 100% 0 0)';   // retract to the left
    setTimeout(() => {
      // detach only if nothing new grabbed the canvas in the meantime
      if (!active && canvas.parentNode === el) canvas.remove();
    }, 600);
  }

  links.forEach((el) => {
    el.addEventListener('mouseenter', () => enter(el));
    el.addEventListener('mouseleave', () => leave(el));
  });

  window.addEventListener('resize', () => { if (active) size(active); }, { passive: true });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { cancelAnimationFrame(raf); raf = 0; }
    else if (active) { startT = 0; cancelAnimationFrame(raf); raf = requestAnimationFrame(frame); }
  });
})();
