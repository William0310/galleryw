// Ping-pong "flowmap": the pointer paints its velocity into a small render target that
// slowly fades. Image shaders read it to push pixels around like a finger through water.
// Velocity is stored in 8-bit channels (rg = v*0.5+0.5, b = strength) so it works on every
// mobile GPU without float render-target extensions.
import { THREE, fullscreenVert } from './common.js';

export class Flowmap {
  constructor(renderer, { size = 128, falloff = 0.22, dissipation = 0.965, alpha = 1 } = {}) {
    this.renderer = renderer;
    const opts = { type: THREE.UnsignedByteType, format: THREE.RGBAFormat, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, depthBuffer: false };
    this.a = new THREE.WebGLRenderTarget(size, size, opts);
    this.b = new THREE.WebGLRenderTarget(size, size, opts);
    this.mouse = new THREE.Vector2(-1, -1);
    this.velocity = new THREE.Vector2();
    this.aspect = 1;
    this.material = new THREE.ShaderMaterial({
      vertexShader: fullscreenVert,
      fragmentShader: /* glsl */ `
        precision highp float;
        uniform sampler2D tMap;
        uniform vec2 uMouse, uVel;
        uniform float uAspect, uFalloff, uDissipation, uAlpha;
        varying vec2 vUv;
        void main() {
          vec4 c = texture2D(tMap, vUv);
          vec3 v = vec3(c.rg * 2.0 - 1.0, c.b);
          v = mix(vec3(0.0), v, uDissipation);
          vec2 d = vUv - uMouse; d.x *= uAspect;
          vec3 stamp = vec3(clamp(uVel * vec2(1.0, -1.0), -1.0, 1.0), 1.0 - pow(1.0 - min(1.0, length(uVel)), 3.0));
          float f = smoothstep(uFalloff, 0.0, length(d)) * uAlpha;
          v = mix(v, stamp, f);
          gl_FragColor = vec4(v.rg * 0.5 + 0.5, v.b, 1.0);
        }`,
      uniforms: {
        tMap: { value: null },
        uMouse: { value: this.mouse },
        uVel: { value: this.velocity },
        uAspect: { value: 1 },
        uFalloff: { value: falloff },
        uDissipation: { value: dissipation },
        uAlpha: { value: alpha },
      },
      depthTest: false,
      depthWrite: false,
    });
    this.scene = new THREE.Scene();
    this.camera = new THREE.Camera();
    this.scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.material));
    // Start from "no flow" (0.5, 0.5, 0).
    const clear = new THREE.Color(0.5, 0.5, 0);
    const prev = renderer.getClearColor(new THREE.Color());
    const prevA = renderer.getClearAlpha();
    renderer.setClearColor(clear, 1);
    for (const t of [this.a, this.b]) { renderer.setRenderTarget(t); renderer.clear(); }
    renderer.setRenderTarget(null);
    renderer.setClearColor(prev, prevA);

    this._last = null;
  }

  get texture() { return this.a.texture; }

  // x, y in [0,1] (y up). Call on pointer move.
  move(x, y) {
    const now = performance.now();
    if (this._last) {
      const dt = Math.max(8, now - this._last.t);
      const vx = ((x - this._last.x) / dt) * 16 * 9;
      const vy = ((y - this._last.y) / dt) * 16 * 9;
      this.velocity.set(vx, -vy);
    }
    this.mouse.set(x, y);
    this._last = { x, y, t: now };
  }

  update() {
    // Velocity decays when the pointer stops.
    this.velocity.multiplyScalar(0.86);
    this.material.uniforms.uAspect.value = this.aspect;
    this.material.uniforms.tMap.value = this.a.texture;
    const r = this.renderer;
    r.setRenderTarget(this.b);
    r.render(this.scene, this.camera);
    r.setRenderTarget(null);
    [this.a, this.b] = [this.b, this.a];
  }

  dispose() { this.a.dispose(); this.b.dispose(); this.material.dispose(); }
}
