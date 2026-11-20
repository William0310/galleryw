// Album hero: one full-screen image with a shader chosen to match the place.
//   mirror – Qinghai: the salt flat is a mirror; the pointer drops ripples into it
//   snow   – Lijiang: snowfall (GPU particles) blown by the pointer, slight parallax
//   rays   – Xinjiang: volumetric light from the sun, cinema letterbox, film grain
//   mist   – Japan: drifting fbm mist the pointer wipes away; ink-bleed reveal from paper
//   gold   – Beijing: gilded paint glints, warm light leak following the pointer
//   candle – Datong: a dark hall lit by a flickering hand-held light; brightens on scroll
//   neon   – Chongqing: RGB-split glitch bursts and scanlines
import { THREE, createRenderer, loadTexture, glsl, fullscreenVert } from './common.js';
import { Flowmap } from './flowmap.js';
import { env, damp } from '../core/env.js';
import { gsap } from '../core/scroll.js';
import { heroPx } from '../core/img.js';

const head = /* glsl */ `
  precision highp float;
  uniform sampler2D tMap, tFlow;
  uniform vec2 uRes, uFocus, uMouse;
  uniform float uAr, uTime, uScroll, uIntro, uAspect, uGrain, uFadeAmt;
  uniform vec3 uFade;
  varying vec2 vUv;
  ${glsl.cover}
  ${glsl.noise}
  ${glsl.luma}
  vec2 cuv(vec2 uv) { return coverUv(uv, uRes, uAr, uFocus); }
  vec3 img(vec2 uv) { return texture2D(tMap, cuv(uv)).rgb; }
  vec2 flowAt(vec2 uv) { vec3 f = texture2D(tFlow, uv).rgb; return (f.rg * 2.0 - 1.0) * f.b * smoothstep(0.02, 0.12, f.b); }
  // Screen position (0..1) of a point given in image uv.
  vec2 imgToScreen(vec2 p) {
    float sa = uRes.x / uRes.y;
    vec2 s = sa > uAr ? vec2(1.0, uAr / sa) : vec2(sa / uAr, 1.0);
    return (p - (1.0 - s) * uFocus) / s;
  }
`;

const tail = /* glsl */ `
  void main() {
    vec2 suv = vUv;
    vec2 uv = (suv - 0.5) * (1.0 - uScroll * 0.08) + 0.5;
    vec3 col = fx(uv, suv);
    col = mix(col, uFade, clamp(uScroll * uFadeAmt, 0.0, 1.0));
    col += (hash(suv * uRes + fract(uTime * 7.0) * 91.0) - 0.5) * uGrain;
    gl_FragColor = vec4(col, 1.0);
  }
`;

const FX = {
  mirror: {
    grain: 0.03, fade: [0.04, 0.045, 0.055], fadeAmt: 0.6,
    uniforms: () => ({ uRip: { value: Array.from({ length: 6 }, () => new THREE.Vector4(0, 0, -99, 0)) } }),
    frag: /* glsl */ `
      uniform vec4 uRip[6];
      vec3 fx(vec2 uv, vec2 suv) {
        vec2 disp = vec2(0.0);
        float crest = 0.0;
        for (int i = 0; i < 6; i++) {
          vec4 r = uRip[i];
          float age = uTime - r.z;
          if (age < 0.0 || age > 5.0) continue;
          vec2 d = suv - r.xy; d.x *= uAspect;
          float dist = length(d);
          float front = age * 0.32;
          float env = exp(-abs(dist - front) * 12.0) * exp(-age * 0.8) * r.w;
          float w = sin((dist - front) * 64.0) * env;
          disp += normalize(d + 1e-5) * w * 0.012;
          crest += max(w, 0.0);
        }
        vec2 ic = cuv(uv);
        float water = smoothstep(0.5, 0.4, ic.y);
        disp.x += sin(ic.y * 220.0 + uTime * 1.3 + fbm(ic * 9.0 + uTime * 0.1) * 6.0) * 0.0011 * water;
        vec3 col = img(uv + disp);
        col += crest * 0.12 * vec3(0.9, 0.95, 1.0);
        return col;
      }`,
  },
  snow: {
    grain: 0.02, fade: [0.93, 0.95, 0.97], fadeAmt: 0.5,
    frag: /* glsl */ `
      vec3 fx(vec2 uv, vec2 suv) {
        vec2 par = (uMouse - 0.5) * 0.014;
        vec3 col = img(uv + par);
        col = mix(col, col * vec3(0.96, 1.0, 1.06), 0.5 * uIntro);
        return col;
      }`,
  },
  rays: {
    grain: 0.05, fade: [0.07, 0.06, 0.05], fadeAmt: 0.7,
    uniforms: () => ({ uSun: { value: new THREE.Vector2(0.53, 0.7) } }),
    frag: /* glsl */ `
      uniform vec2 uSun;
      #ifndef RAY_STEPS
      #define RAY_STEPS 24
      #endif
      vec3 fx(vec2 uv, vec2 suv) {
        vec3 col = img(uv);
        vec2 L = imgToScreen(uSun) + (uMouse - 0.5) * 0.08;
        vec2 delta = (suv - L) * (0.55 / float(RAY_STEPS));
        vec2 p = uv;
        float decay = 1.0;
        vec3 acc = vec3(0.0);
        for (int i = 0; i < RAY_STEPS; i++) {
          p -= delta;
          vec3 s = img(p);
          float b = smoothstep(0.7, 0.98, luma(s));
          acc += s * b * decay;
          decay *= 0.94;
        }
        col += acc * (0.6 / float(RAY_STEPS)) * vec3(1.0, 0.86, 0.66) * uIntro;
        // warm filmic grade
        col = mix(col, smoothstep(0.0, 1.0, col) * vec3(1.05, 0.98, 0.9), 0.5 * uIntro);
        // letterbox: bars slide in from the edges to scope ratio; retract on scroll
        float target = uRes.x > uRes.y ? 2.39 : 0.82;
        float band = clamp((1.0 - (uRes.x / target) / uRes.y) * 0.5, 0.0, 0.5);
        band = band * smoothstep(0.0, 1.0, uIntro) * (1.0 - smoothstep(0.0, 0.5, uScroll));
        float bars = step(suv.y, band) + step(1.0 - band, suv.y);
        col = mix(col, vec3(0.0), clamp(bars, 0.0, 1.0));
        return col;
      }`,
  },
  mist: {
    grain: 0.025, fade: [0.953, 0.941, 0.91], fadeAmt: 0.75, flow: { falloff: 0.3, dissipation: 0.985 },
    frag: /* glsl */ `
      const vec3 PAPER = vec3(0.953, 0.941, 0.91);
      vec3 fx(vec2 uv, vec2 suv) {
        vec2 f = flowAt(suv);
        vec3 col = img(uv - f * 0.015);
        vec2 q = vec2(suv.x * uAspect, suv.y);
        float m1 = fbm(q * 1.4 + vec2(uTime * 0.022, uTime * 0.004));
        float m2 = fbm(q * 3.1 - vec2(uTime * 0.035, -uTime * 0.01));
        float mist = smoothstep(0.38, 0.82, m1 * 0.65 + m2 * 0.35);
        mist *= 0.55 + 0.45 * smoothstep(0.9, 0.2, suv.y);
        float clear = texture2D(tFlow, suv).b;
        mist *= 1.0 - smoothstep(0.0, 0.45, clear);
        mist *= smoothstep(0.0, 1.0, uIntro);
        col = mix(col, PAPER, mist * 0.55);
        float g = luma(col);
        return mix(col, mix(vec3(g), col, 0.86), uIntro);
      }`,
  },
  gold: {
    grain: 0.03, fade: [0.125, 0.07, 0.055], fadeAmt: 0.7, flow: { falloff: 0.18, dissipation: 0.95 },
    frag: /* glsl */ `
      vec3 fx(vec2 uv, vec2 suv) {
        vec2 f = flowAt(suv);
        vec2 ic = cuv(uv - f * 0.03);
        ic.x += sin(ic.y * 120.0 + uTime * 2.0) * 0.0005;
        vec3 col = texture2D(tMap, ic).rgb;
        // glints only where the paint is gilded (warm, saturated, bright-ish)
        float gild = smoothstep(0.12, 0.3, col.r - col.b) * smoothstep(0.35, 0.65, col.r);
        vec2 cell = floor(suv * uRes / 5.0);
        float tw = pow(hash(cell + floor(uTime * 5.0)), 40.0) * gild;
        col += tw * vec3(1.0, 0.88, 0.55) * 2.0;
        // warm light leak that follows the pointer
        vec2 d = (suv - uMouse) * vec2(uAspect, 1.0);
        col += vec3(1.0, 0.55, 0.22) * 0.2 * exp(-dot(d, d) * 2.5);
        col = mix(col, col * vec3(1.08, 0.98, 0.84), 0.55);
        // reveal: a golden sweep from left to right
        float x = uIntro * 1.4 - 0.2;
        float edge = smoothstep(0.08, 0.0, abs(suv.x + fbm(suv * 4.0) * 0.15 - x)) * (1.0 - step(0.999, uIntro));
        col += edge * vec3(0.95, 0.72, 0.3) * 0.7;
        return col;
      }`,
  },
  candle: {
    grain: 0.045, fade: [0.04, 0.035, 0.03], fadeAmt: 0.0,
    uniforms: () => ({ uLight: { value: new THREE.Vector2(0.5, 0.55) }, uRadius: { value: 6.0 } }),
    frag: /* glsl */ `
      uniform vec2 uLight;
      uniform float uRadius;
      vec3 fx(vec2 uv, vec2 suv) {
        vec3 col = img(uv);
        vec2 d = (suv - uLight) * vec2(uAspect, 1.0);
        float flick = 0.82 + 0.18 * vnoise(vec2(uTime * 6.0, 1.7)) + 0.05 * sin(uTime * 23.0);
        float light = exp(-dot(d, d) * uRadius) * flick * uIntro;
        float amb = 0.06 + smoothstep(0.0, 0.8, uScroll) * 0.7;
        vec3 warm = vec3(1.0, 0.78, 0.5);
        vec3 lit = col * (amb + light * 2.7 * warm) + warm * light * 0.025;
        return lit;
      }`,
  },
  drift: {
    // General-purpose: film grain, a slow breathing push-in, soft vignette and a faint
    // warm light that follows the pointer — nothing tied to one kind of photograph.
    grain: 0.045, fade: [0.08, 0.08, 0.09], fadeAmt: 0.65,
    frag: /* glsl */ `
      vec3 fx(vec2 uv, vec2 suv) {
        float z = 1.0 - 0.025 * (0.5 + 0.5 * sin(uTime * 0.12)) * uIntro;
        vec2 par = (uMouse - 0.5) * 0.012 * uIntro;
        vec3 col = img((uv - 0.5) * z + 0.5 + par);
        float v = smoothstep(1.25, 0.35, length((suv - 0.5) * vec2(uAspect, 1.0) * 0.9));
        col *= mix(1.0, mix(0.72, 1.0, v), uIntro);
        vec2 d = (suv - uMouse) * vec2(uAspect, 1.0);
        col += vec3(1.0, 0.8, 0.6) * 0.06 * exp(-dot(d, d) * 3.0) * uIntro;
        return col;
      }`,
  },
  neon: {
    grain: 0.05, fade: [0.02, 0.027, 0.043], fadeAmt: 0.65,
    uniforms: () => ({ uGlitch: { value: 0 } }),
    frag: /* glsl */ `
      uniform float uGlitch;
      vec3 fx(vec2 uv, vec2 suv) {
        float t = floor(uTime * 14.0);
        float row = floor(suv.y * 34.0);
        float on = step(0.72, hash(vec2(row * 1.7, t)));
        float gli = max(uGlitch, (1.0 - uIntro) * 0.8);
        float shift = (hash(vec2(row, t)) - 0.5) * 0.1 * gli * on;
        vec2 u = uv + vec2(shift, 0.0);
        float ca = 0.002 + gli * 0.018 + length(uMouse - 0.5) * 0.002;
        vec3 col = vec3(img(u + vec2(ca, 0.0)).r, img(u).g, img(u - vec2(ca, 0.0)).b);
        col *= 0.93 + 0.07 * sin(suv.y * uRes.y * 1.4 + uTime * 8.0);
        col += vec3(0.0, 0.05, 0.08) * uGlitch * on;
        return col;
      }`,
  },
};

export class AlbumHero {
  constructor(container, album) {
    this.container = container;
    this.album = album;
    this.def = FX[album.fx] || FX.mirror;
    this.visible = true;
    this.mouse = new THREE.Vector2(0.5, 0.5);
    this.target = new THREE.Vector2(0.5, 0.5);
    this.lastMove = -10;
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'gl-canvas';
    container.prepend(this.canvas);
    this.renderer = createRenderer(this.canvas, { heavy: true });
    if (!this.renderer) return;

    const d = this.def;
    this.flow = d.flow ? new Flowmap(this.renderer, { size: 128, ...d.flow }) : null;
    this.uniforms = {
      tMap: { value: null }, tFlow: { value: this.flow ? this.flow.texture : null },
      uRes: { value: new THREE.Vector2(1, 1) }, uFocus: { value: new THREE.Vector2(album.focus[0], 1 - album.focus[1]) },
      uMouse: { value: this.mouse }, uAr: { value: 1.5 }, uTime: { value: 0 }, uScroll: { value: 0 }, uIntro: { value: 0 },
      uAspect: { value: 1 }, uGrain: { value: d.grain }, uFadeAmt: { value: d.fadeAmt }, uFade: { value: new THREE.Vector3(...d.fade) },
      ...(d.uniforms ? d.uniforms() : {}),
    };
    const defines = {};
    if (album.fx === 'rays') defines.RAY_STEPS = env.touch || env.lowPower ? 14 : 24;
    this.material = new THREE.ShaderMaterial({ vertexShader: fullscreenVert, fragmentShader: head + d.frag + tail, uniforms: this.uniforms, defines, depthTest: false });
    this.scene = new THREE.Scene();
    this.scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.material));
    this.camera = new THREE.Camera();

    if (album.fx === 'snow') this.initSnow();
    if (album.fx === 'mirror') this.ripIndex = 0;

    container.addEventListener('pointermove', (e) => this.onPointer(e, false), { passive: true });
    container.addEventListener('pointerdown', (e) => this.onPointer(e, true), { passive: true });

    this.resize();
    window.addEventListener('resize', () => this.resize());
    new IntersectionObserver(([e]) => { this.visible = e.isIntersecting; }).observe(container);
  }

  get ok() { return !!this.renderer; }

  async load() {
    if (!this.ok) return;
    const tex = await loadTexture(this.album.cover, heroPx(), this.renderer);
    this.uniforms.tMap.value = tex;
    this.uniforms.uAr.value = tex.userData.aspect;
  }

  // instant: arriving from the home page's expanding cover, so skip the reveal and
  // continue seamlessly from the exact frame that was already on screen.
  intro(delay = 0, instant = false) {
    if (!this.ok) return;
    if (instant) this.uniforms.uIntro.value = 1;
    else gsap.to(this.uniforms.uIntro, { value: 1, duration: env.reduced ? 0.01 : 2.6, delay, ease: 'power2.out' });
    if (this.album.fx === 'mirror') {
      // Drop a first ripple into the lake so the effect announces itself.
      gsap.delayedCall(delay + 0.6, () => this.ripple(0.5, 0.32, 1));
      gsap.delayedCall(delay + 1.4, () => this.ripple(0.68, 0.22, 0.7));
    }
    if (this.album.fx === 'neon') this.scheduleGlitch(delay + 1.2);
  }

  setScroll(v) { if (this.ok) this.uniforms.uScroll.value = v; }

  onPointer(e, down) {
    const r = this.canvas.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const y = 1 - (e.clientY - r.top) / r.height;
    this.target.set(x, y);
    this.lastMove = this.uniforms.uTime.value;
    if (this.flow) this.flow.move(x, y);
    const fx = this.album.fx;
    if (fx === 'mirror') {
      const now = this.uniforms.uTime.value;
      if (down) this.ripple(x, y, 1);
      else if (now - (this.lastRip || 0) > 0.16) { this.lastRip = now; this.ripple(x, y, 0.35); }
    }
    if (fx === 'neon') {
      const dx = Math.abs(x - this.mouse.x) + Math.abs(y - this.mouse.y);
      if (dx > 0.05 || down) this.kick(down ? 1 : 0.5);
    }
    if (fx === 'snow' && this.snow) {
      this.snow.wind = (x - this.mouse.x) * 30;
    }
  }

  ripple(x, y, s) {
    const r = this.uniforms.uRip.value[this.ripIndex];
    r.set(x, y, this.uniforms.uTime.value, s);
    this.ripIndex = (this.ripIndex + 1) % this.uniforms.uRip.value.length;
  }

  kick(amount) {
    const g = this.uniforms.uGlitch;
    gsap.killTweensOf(g);
    gsap.timeline().to(g, { value: amount, duration: 0.06 }).to(g, { value: 0, duration: 0.5, ease: 'power2.out' });
  }

  scheduleGlitch(delay) {
    gsap.delayedCall(delay, () => {
      if (this.visible) this.kick(0.6 + Math.random() * 0.4);
      this.scheduleGlitch(2.5 + Math.random() * 3.5);
    });
  }

  initSnow() {
    const count = env.touch || env.lowPower ? 450 : 900;
    const g = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    const rnd = new Float32Array(count * 4);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = Math.random() * 2 - 1;
      pos[i * 3 + 1] = Math.random() * 2 - 1;
      pos[i * 3 + 2] = Math.random(); // depth 0 (far) .. 1 (near)
      rnd[i * 4] = Math.random(); rnd[i * 4 + 1] = Math.random(); rnd[i * 4 + 2] = Math.random(); rnd[i * 4 + 3] = Math.random();
    }
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('aRnd', new THREE.BufferAttribute(rnd, 4));
    const uniforms = { uTime: { value: 0 }, uWind: { value: 0 }, uDpr: { value: this.renderer.getPixelRatio() }, uIntro: this.uniforms.uIntro, uScroll: this.uniforms.uScroll, uH: { value: 800 } };
    const mat = new THREE.ShaderMaterial({
      uniforms,
      transparent: true,
      depthTest: false,
      blending: THREE.AdditiveBlending,
      vertexShader: /* glsl */ `
        attribute vec4 aRnd;
        uniform float uTime, uWind, uDpr, uIntro, uH, uScroll;
        varying float vA;
        void main() {
          float z = position.z;
          float speed = 0.05 + z * 0.12 + aRnd.x * 0.04;
          float y = mod(position.y + 1.0 - uTime * speed, 2.0) - 1.0;
          float x = position.x + sin(uTime * (0.4 + aRnd.y) + aRnd.z * 6.28) * 0.03 * (0.5 + z) + uWind * (0.3 + z) * 0.02;
          x = mod(x + 1.0, 2.0) - 1.0;
          gl_Position = vec4(x, y, 0.0, 1.0);
          gl_PointSize = (1.2 + z * z * 5.5 + aRnd.w * 1.2) * uDpr * (uH / 900.0 + 0.4);
          vA = (0.25 + z * 0.55) * uIntro * (1.0 - uScroll);
        }`,
      fragmentShader: /* glsl */ `
        precision mediump float;
        varying float vA;
        void main() {
          float d = length(gl_PointCoord - 0.5);
          float a = smoothstep(0.5, 0.0, d) * vA;
          gl_FragColor = vec4(vec3(a), a);
        }`,
    });
    const points = new THREE.Points(g, mat);
    points.frustumCulled = false;
    this.scene.add(points);
    this.snow = { mat, uniforms, wind: 0 };
  }

  resize() {
    if (!this.ok) return;
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    this.renderer.setSize(w, h, false);
    this.uniforms.uRes.value.set(w, h);
    this.uniforms.uAspect.value = w / h;
    if (this.flow) this.flow.aspect = w / h;
    if (this.snow) this.snow.uniforms.uH.value = h;
    if (this.album.fx === 'candle') this.uniforms.uRadius.value = env.narrow ? 9.0 : 14.0;
  }

  render(time, dt) {
    if (!this.ok || !this.visible || document.hidden || !this.uniforms.tMap.value) return;
    const u = this.uniforms;
    u.uTime.value = time;
    // Idle / touch: let the "light" wander on its own so the image is never static.
    const idle = time - this.lastMove > (env.touch ? 1.5 : 3);
    if (idle) this.target.set(0.5 + Math.sin(time * 0.37) * 0.28, 0.52 + Math.sin(time * 0.53 + 1.3) * 0.18);
    this.mouse.x = damp(this.mouse.x, this.target.x, idle ? 1.2 : 5, dt);
    this.mouse.y = damp(this.mouse.y, this.target.y, idle ? 1.2 : 5, dt);
    if (this.album.fx === 'candle') u.uLight.value.copy(this.mouse);
    if (this.flow) { this.flow.update(); u.tFlow.value = this.flow.texture; }
    if (this.snow) {
      const s = this.snow.uniforms;
      s.uTime.value = time;
      this.snow.wind *= 0.96;
      s.uWind.value = damp(s.uWind.value, this.snow.wind + Math.sin(time * 0.3) * 0.6, 2, dt);
    }
    this.renderer.render(this.scene, this.camera);
  }
}
