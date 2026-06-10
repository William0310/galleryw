/* ==========================================================
   行记 — WebGL hero
   Fullscreen-quad flowmap: pointer movement is splatted into a
   ping-pong velocity buffer, then used to displace + chromatically
   shift the hero photograph. Raw WebGL1, no dependencies.
   ========================================================== */

(function () {
  'use strict';

  const QUAD_VS = `
    attribute vec2 aPos;
    varying vec2 vUv;
    void main() {
      vUv = aPos * 0.5 + 0.5;
      gl_Position = vec4(aPos, 0.0, 1.0);
    }
  `;

  // Trail update pass: fade previous frame, splat pointer velocity.
  const TRAIL_FS = `
    precision highp float;
    varying vec2 vUv;
    uniform sampler2D uPrev;
    uniform vec2 uPointer;     // uv
    uniform vec2 uVelocity;    // normalized pointer velocity
    uniform float uAspect;     // canvas w/h
    uniform float uMoving;     // 1 while pointer active
    uniform float uDissipation;

    void main() {
      vec4 prev = texture2D(uPrev, vUv);
      vec2 vel = (prev.rg - 0.5) * 2.0;
      float str = prev.b;

      vel *= uDissipation;
      str *= uDissipation;

      vec2 d = vUv - uPointer;
      d.x *= uAspect;
      float dist = length(d);
      float influence = exp(-dist * dist * 90.0) * uMoving;

      vel += uVelocity * influence * 1.6;
      str += influence * min(length(uVelocity) * 9.0, 1.2);

      vel = clamp(vel, -1.0, 1.0);
      str = clamp(str, 0.0, 1.0);

      gl_FragColor = vec4(vel * 0.5 + 0.5, str, 1.0);
    }
  `;

  // Composite pass: photo displaced by the flow buffer.
  const RENDER_FS = `
    precision highp float;
    varying vec2 vUv;
    uniform sampler2D uImage;
    uniform sampler2D uFlow;
    uniform vec2 uCover;       // cover-fit scale
    uniform float uTime;
    uniform float uScrollVel;  // smoothed lenis velocity
    uniform float uReveal;     // 0..1 intro
    uniform float uParallax;   // scroll offset of hero

    void main() {
      vec4 flow = texture2D(uFlow, vUv);
      vec2 fvel = (flow.rg - 0.5) * 2.0;
      float fstr = flow.b;

      // cover-fit, slight zoom while revealing
      vec2 uv = (vUv - 0.5) * uCover * (1.06 - 0.06 * uReveal + 0.05 * abs(uScrollVel)) + 0.5;
      uv.y += uParallax * 0.18;

      // ambient breathing so the water feels alive untouched
      float amb = 0.0016 + 0.0012 * uReveal;
      uv += vec2(
        sin(uv.y * 9.0 + uTime * 0.5) + sin(uv.y * 23.0 - uTime * 0.35),
        cos(uv.x * 7.0 + uTime * 0.4)
      ) * amb;

      // pointer flow displacement
      vec2 disp = fvel * fstr * 0.075;
      // scroll velocity smears vertically
      disp.y += uScrollVel * 0.045;

      float split = fstr * 0.012 + abs(uScrollVel) * 0.006;
      vec2 dir = (length(fvel) > 0.001) ? normalize(fvel) : vec2(0.0, 1.0);

      float r = texture2D(uImage, uv + disp + dir * split).r;
      float g = texture2D(uImage, uv + disp).g;
      float b = texture2D(uImage, uv + disp - dir * split).b;
      vec3 col = vec3(r, g, b);

      // gentle highlight where the ripple lives
      col += fstr * 0.05;

      // vignette
      vec2 vq = vUv - 0.5;
      col *= 1.0 - dot(vq, vq) * 0.55;

      // intro: brightness lifts with reveal
      col *= 0.25 + 0.75 * uReveal;

      gl_FragColor = vec4(col, 1.0);
    }
  `;

  function compile(gl, type, src) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      console.error(gl.getShaderInfoLog(s));
      return null;
    }
    return s;
  }

  function program(gl, vsSrc, fsSrc) {
    const p = gl.createProgram();
    gl.attachShader(p, compile(gl, gl.VERTEX_SHADER, vsSrc));
    gl.attachShader(p, compile(gl, gl.FRAGMENT_SHADER, fsSrc));
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
      console.error(gl.getProgramInfoLog(p));
      return null;
    }
    return p;
  }

  function createTarget(gl, w, h) {
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    const fbo = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    return { tex, fbo, w, h };
  }

  window.createHeroGL = function (canvas, imgSrc) {
    const gl = canvas.getContext('webgl', { antialias: false, alpha: false, preserveDrawingBuffer: false });
    if (!gl) return Promise.resolve(null);

    const dpr = Math.min(window.devicePixelRatio || 1, window.innerWidth < 820 ? 1.5 : 2);

    const quad = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, quad);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);

    const trailProg = program(gl, QUAD_VS, TRAIL_FS);
    const renderProg = program(gl, QUAD_VS, RENDER_FS);
    if (!trailProg || !renderProg) return Promise.resolve(null);

    const tU = {
      prev: gl.getUniformLocation(trailProg, 'uPrev'),
      pointer: gl.getUniformLocation(trailProg, 'uPointer'),
      velocity: gl.getUniformLocation(trailProg, 'uVelocity'),
      aspect: gl.getUniformLocation(trailProg, 'uAspect'),
      moving: gl.getUniformLocation(trailProg, 'uMoving'),
      dissipation: gl.getUniformLocation(trailProg, 'uDissipation'),
    };
    const rU = {
      image: gl.getUniformLocation(renderProg, 'uImage'),
      flow: gl.getUniformLocation(renderProg, 'uFlow'),
      cover: gl.getUniformLocation(renderProg, 'uCover'),
      time: gl.getUniformLocation(renderProg, 'uTime'),
      scrollVel: gl.getUniformLocation(renderProg, 'uScrollVel'),
      reveal: gl.getUniformLocation(renderProg, 'uReveal'),
      parallax: gl.getUniformLocation(renderProg, 'uParallax'),
    };

    function bindAttribs(prog) {
      const loc = gl.getAttribLocation(prog, 'aPos');
      gl.bindBuffer(gl.ARRAY_BUFFER, quad);
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    }

    let imageTex = null;
    let imgW = 1, imgH = 1;
    let targets = [];
    let flip = 0;

    const state = {
      pointer: { x: 0.5, y: 0.5 },
      velocity: { x: 0, y: 0 },
      targetVel: { x: 0, y: 0 },
      moving: 0,
      scrollVel: 0,
      reveal: 0,
      parallax: 0,
      running: true,
    };

    function resize() {
      const w = Math.max(1, Math.round(canvas.clientWidth * dpr));
      const h = Math.max(1, Math.round(canvas.clientHeight * dpr));
      if (canvas.width === w && canvas.height === h) return;
      canvas.width = w; canvas.height = h;
      // half-res trail buffers
      targets = [createTarget(gl, w >> 1 || 1, h >> 1 || 1), createTarget(gl, w >> 1 || 1, h >> 1 || 1)];
    }

    function coverScale() {
      const cAsp = canvas.width / canvas.height;
      const iAsp = imgW / imgH;
      // scale uv so image covers canvas
      return cAsp > iAsp ? [1, iAsp / cAsp] : [cAsp / iAsp, 1];
    }

    // pointer tracking (mouse + touch, passive so scroll is unaffected)
    let lastX = null, lastY = null, lastT = 0, idleTimer = null;
    function onMove(cx, cy) {
      const rect = canvas.getBoundingClientRect();
      if (rect.bottom < 0 || rect.top > window.innerHeight) return;
      const x = (cx - rect.left) / rect.width;
      const y = 1 - (cy - rect.top) / rect.height;
      const now = performance.now();
      if (lastX !== null) {
        const dt = Math.max(now - lastT, 8);
        state.targetVel.x = Math.max(-1, Math.min(1, (x - lastX) * 1000 / dt * 0.9));
        state.targetVel.y = Math.max(-1, Math.min(1, (y - lastY) * 1000 / dt * 0.9));
      }
      lastX = x; lastY = y; lastT = now;
      state.pointer.x = x; state.pointer.y = y;
      state.moving = 1;
      clearTimeout(idleTimer);
      idleTimer = setTimeout(() => { state.moving = 0; lastX = null; }, 90);
    }
    window.addEventListener('mousemove', (e) => onMove(e.clientX, e.clientY), { passive: true });
    window.addEventListener('touchmove', (e) => onMove(e.touches[0].clientX, e.touches[0].clientY), { passive: true });
    window.addEventListener('touchstart', (e) => { lastX = null; onMove(e.touches[0].clientX, e.touches[0].clientY); }, { passive: true });
    window.addEventListener('resize', resize);

    let start = performance.now();
    function frame() {
      if (!state.running) { requestAnimationFrame(frame); return; }
      // skip work when hero is offscreen
      const rect = canvas.getBoundingClientRect();
      if (rect.bottom <= 0) { requestAnimationFrame(frame); return; }

      resize();
      const t = (performance.now() - start) / 1000;

      // ease velocity toward target, decay when idle
      state.velocity.x += (state.targetVel.x - state.velocity.x) * 0.18;
      state.velocity.y += (state.targetVel.y - state.velocity.y) * 0.18;
      state.targetVel.x *= 0.86;
      state.targetVel.y *= 0.86;

      // --- trail pass (ping-pong) ---
      const src = targets[flip];
      const dst = targets[1 - flip];
      gl.useProgram(trailProg);
      bindAttribs(trailProg);
      gl.bindFramebuffer(gl.FRAMEBUFFER, dst.fbo);
      gl.viewport(0, 0, dst.w, dst.h);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, src.tex);
      gl.uniform1i(tU.prev, 0);
      gl.uniform2f(tU.pointer, state.pointer.x, state.pointer.y);
      gl.uniform2f(tU.velocity, state.velocity.x, state.velocity.y);
      gl.uniform1f(tU.aspect, canvas.width / canvas.height);
      gl.uniform1f(tU.moving, state.moving);
      gl.uniform1f(tU.dissipation, 0.955);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      flip = 1 - flip;

      // --- composite pass ---
      gl.useProgram(renderProg);
      bindAttribs(renderProg);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, imageTex);
      gl.uniform1i(rU.image, 0);
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, targets[flip].tex);
      gl.uniform1i(rU.flow, 1);
      const cov = coverScale();
      gl.uniform2f(rU.cover, cov[0], cov[1]);
      gl.uniform1f(rU.time, t);
      gl.uniform1f(rU.scrollVel, state.scrollVel);
      gl.uniform1f(rU.reveal, state.reveal);
      gl.uniform1f(rU.parallax, state.parallax);
      gl.drawArrays(gl.TRIANGLES, 0, 3);

      requestAnimationFrame(frame);
    }

    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        imgW = img.naturalWidth; imgH = img.naturalHeight;
        imageTex = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, imageTex);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
        resize();
        requestAnimationFrame(frame);
        resolve(state);
      };
      img.onerror = () => resolve(null);
      img.src = imgSrc;
    });
  };
})();
