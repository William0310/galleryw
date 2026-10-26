/* Cruise background: a slow contour-line sea in WebGL2 with a liquid glass lens that follows the pointer. */
(() => {
  const root = document.documentElement;
  const canvas = document.getElementById('gl');
  const gl = canvas && canvas.getContext('webgl2', { antialias: false, alpha: false, powerPreference: 'low-power' });
  if (!gl) { root.classList.add('no-gl'); return; }

  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const dark = matchMedia('(prefers-color-scheme: dark)');

  const VS = `#version 300 es
  void main(){ vec2 p = vec2((gl_VertexID << 1) & 2, gl_VertexID & 2); gl_Position = vec4(p * 2. - 1., 0., 1.); }`;

  const FS = `#version 300 es
  precision highp float;
  out vec4 o;
  uniform vec2 uRes; uniform float uT, uR, uOn, uY, uDark, uLineA;
  uniform vec3 uC0, uC1, uC2, uLine;
  uniform vec2 uL[3];

  float h(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
  float nz(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3. - 2.*f);
    return mix(mix(h(i), h(i + vec2(1,0)), f.x), mix(h(i + vec2(0,1)), h(i + 1.), f.x), f.y); }
  float fbm(vec2 p){ float a = .5, s = 0.; for(int i = 0; i < 4; i++){ s += a * nz(p); p = p * 2.03 + vec2(17.1, 9.7); a *= .5; } return s; }
  float fld(vec2 p){ float t = uT * .06;
    vec2 q = vec2(fbm(p + vec2(0., t)), fbm(p + vec2(5.2, 1.3 - t)));
    return fbm(p + 2. * q + vec2(t * .5, 0.)); }
  vec2 toP(vec2 px){ return px / uRes.y * 1.3 + vec2(0., uY * .5); }

  vec3 shade(vec2 p, float n, float fw){
    vec3 c = mix(uC0, uC1, smoothstep(.3, .7, n));
    float m = fbm(p * .6 + vec2(3.1, uT * .03));
    c = mix(c, uC2, smoothstep(.45, .75, m) * .9);
    float d = abs(fract(n * 16. + .5) - .5);
    float l = 1. - smoothstep(fw * .5, fw * 1.4 + .0005, d);
    l *= 1. - smoothstep(.25, .5, fw);
    return mix(c, uLine, l * uLineA);
  }
  float smin(float a, float b, float k){ float x = max(k - abs(a - b), 0.) / k; return min(a, b) - x * x * k * .25; }
  float sdf(vec2 px){
    float a = length(px - uL[0]) - uR;
    float b = length(px - uL[1]) - uR * .72;
    float c = length(px - uL[2]) - uR * .5;
    return smin(smin(a, b, uR * .8), c, uR * .8);
  }

  void main(){
    vec2 px = gl_FragCoord.xy;
    vec2 p0 = toP(px);
    float n0 = fld(p0);
    float fw = fwidth(n0 * 16.);
    vec3 col = shade(p0, n0, fw);

    float d = sdf(px);
    col *= 1. - exp(-max(d, 0.) / (uR * .3)) * .10 * uOn * (1. - uDark * .3);

    if (d < 1.5 && uOn > 0.){
      vec2 e = vec2(1.5, 0.);
      vec2 g = vec2(sdf(px + e.xy) - sdf(px - e.xy), sdf(px + e.yx) - sdf(px - e.yx));
      vec2 nr = g / (length(g) + 1e-4);
      float edge = 1. - clamp(-d / (uR * .6), 0., 1.);
      float e2 = pow(edge, 2.2);
      vec2 disp = nr * e2 * uR * .6;
      vec3 rgb;
      for (int i = 0; i < 3; i++){
        float s = .9 + float(i) * .1;
        vec2 q = px + disp * s;
        q = mix(q, px - (px - uL[0]) * .12, .5 * (1. - edge));
        vec2 pp = toP(q);
        vec3 cc = shade(pp, fld(pp), fw);
        if (i == 0) rgb.r = cc.r; else if (i == 1) rgb.g = cc.g; else rgb.b = cc.b;
      }
      rgb = mix(rgb, vec3(1.), (.10 + .14 * edge) * (1. - .65 * uDark));
      float sp = pow(clamp(dot(nr, normalize(vec2(-.5, .85))), 0., 1.), 2.5) * smoothstep(0., .6, edge);
      float sp2 = pow(clamp(dot(nr, normalize(vec2(.5, -.85))), 0., 1.), 3.) * e2;
      rgb += sp * .55 + sp2 * .28;
      col = mix(col, rgb, smoothstep(1.5, -1.5, d) * uOn);
    }
    col += (h(px + uT) - .5) * .015;
    o = vec4(col, 1.);
  }`;

  function compile(type, src) {
    const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
    return s;
  }
  let prog;
  try {
    prog = gl.createProgram();
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, VS));
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FS));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
  } catch (err) { console.warn('Cruise GL disabled:', err); root.classList.add('no-gl'); return; }
  gl.useProgram(prog);
  const U = n => gl.getUniformLocation(prog, n);
  const u = { res: U('uRes'), t: U('uT'), r: U('uR'), on: U('uOn'), y: U('uY'), dark: U('uDark'), lineA: U('uLineA'), c0: U('uC0'), c1: U('uC1'), c2: U('uC2'), line: U('uLine'), l: U('uL') };

  // Palettes per section: [base, mid, accent]. Light first, dark second.
  const hex = s => [1, 3, 5].map(i => parseInt(s.slice(i, i + 2), 16) / 255);
  const P = {
    light: {
      top:      ['#fdf3ee', '#ffcdb8', '#c4c9ff'],
      glass:    ['#f3f3ff', '#cdd5ff', '#ffd2c3'],
      pins:     ['#fff2e8', '#ffc4a8', '#f4a8bb'],
      search:   ['#edf2ff', '#b6cbff', '#dac7ff'],
      profiles: ['#f4efff', '#cbbaff', '#ffcdd8'],
      native:   ['#eef2fb', '#bec9f5', '#fbd3bf'],
      cta:      ['#e8e7ff', '#a1a3f4', '#ffc6b1']
    },
    dark: {
      top:      ['#09091c', '#1d1c5e', '#5c2b4d'],
      glass:    ['#080a1f', '#1a2468', '#4b2a55'],
      pins:     ['#0d0a1a', '#4a1f45', '#7a3340'],
      search:   ['#070b1f', '#142a6b', '#3b2b6e'],
      profiles: ['#0a081c', '#33206e', '#6a2c4e'],
      native:   ['#080b1c', '#1c2562', '#5a3047'],
      cta:      ['#0a0a24', '#2c2d8f', '#7a3a4a']
    }
  };
  const ids = ['top', 'glass', 'pins', 'search', 'profiles', 'native', 'cta'];
  let tops = [], docH = 1;
  const measure = () => { tops = ids.map(id => { const el = document.getElementById(id); return el ? el.getBoundingClientRect().top + scrollY : 0; }); docH = document.documentElement.scrollHeight; };

  let W = 1, H = 1, S = 1;
  function resize() {
    const dpr = Math.min(devicePixelRatio || 1, 1.5);
    const small = innerWidth < 760;
    S = dpr * (small ? .7 : .85);
    W = innerWidth; H = canvas.clientHeight || innerHeight;
    canvas.width = Math.round(W * S); canvas.height = Math.round(H * S);
    gl.viewport(0, 0, canvas.width, canvas.height);
    measure();
  }
  let rt; addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(resize, 120); });
  addEventListener('load', measure);

  // Lens physics (CSS px, y down)
  const target = { x: innerWidth * .5, y: innerHeight * .4 };
  const L = [{ x: target.x, y: target.y }, { x: target.x, y: target.y }, { x: target.x, y: target.y }];
  let lastMove = -1e9, on = 0;
  addEventListener('pointermove', e => { target.x = e.clientX; target.y = e.clientY; lastMove = performance.now(); }, { passive: true });
  addEventListener('pointerdown', e => { target.x = e.clientX; target.y = e.clientY; lastMove = performance.now(); }, { passive: true });

  const cur = [0, 0, 0, 0, 0, 0, 0, 0, 0], tmp = [0, 0, 0];
  function palette(y) {
    const set = P[dark.matches ? 'dark' : 'light'];
    const pos = y + innerHeight * .5;
    let i = 0; while (i < ids.length - 1 && tops[i + 1] <= pos) i++;
    const j = Math.min(i + 1, ids.length - 1);
    const span = Math.max(1, (tops[j] || docH) - tops[i]);
    let f = i === j ? 0 : Math.min(1, Math.max(0, (pos - tops[i]) / span));
    f = f * f * (3 - 2 * f);
    for (let k = 0; k < 3; k++) {
      const a = hex(set[ids[i]][k]), b = hex(set[ids[j]][k]);
      for (let c = 0; c < 3; c++) cur[k * 3 + c] = a[c] + (b[c] - a[c]) * f;
    }
  }

  let t0 = performance.now(), prev = t0;
  function frame(now) {
    const dt = Math.min(.05, (now - prev) / 1000); prev = now;
    const t = reduce.matches ? 12 : (now - t0) / 1000;
    const idle = reduce.matches || now - lastMove > 3200;
    const tx = idle ? W * .5 + Math.cos(t * .42) * W * .28 : target.x;
    const ty = idle ? H * .42 + Math.sin(t * .57) * H * .18 : target.y;
    const ks = [10, 6.5, 4.8];
    let px = tx, py = ty;
    for (let i = 0; i < 3; i++) {
      const k = 1 - Math.exp(-dt * ks[i]);
      L[i].x += (px - L[i].x) * k; L[i].y += (py - L[i].y) * k;
      px = L[i].x; py = L[i].y;
    }
    on = Math.min(1, on + dt * .8);

    palette(scrollY);
    gl.uniform2f(u.res, canvas.width, canvas.height);
    gl.uniform1f(u.t, t);
    gl.uniform1f(u.r, Math.min(96, Math.max(52, Math.min(W, H) * .11)) * S);
    gl.uniform1f(u.on, on);
    gl.uniform1f(u.y, scrollY / Math.max(1, H));
    const dk = dark.matches ? 1 : 0;
    gl.uniform1f(u.dark, dk);
    gl.uniform1f(u.lineA, dk ? .13 : .12);
    gl.uniform3f(u.line, dk ? .8 : .22, dk ? .8 : .22, dk ? 1 : .6);
    gl.uniform3f(u.c0, cur[0], cur[1], cur[2]);
    gl.uniform3f(u.c1, cur[3], cur[4], cur[5]);
    gl.uniform3f(u.c2, cur[6], cur[7], cur[8]);
    gl.uniform2fv(u.l, new Float32Array(L.flatMap(p => [p.x * S, (H - p.y) * S])));
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    requestAnimationFrame(frame);
  }

  resize();
  requestAnimationFrame(frame);
})();
