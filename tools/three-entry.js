// Entry for the vendored three.js subset (vendor/three.min.js). Rebuild after using new classes:
//   npx esbuild tools/three-entry.js --bundle --minify --format=esm --outfile=vendor/three.min.js
export {
  AdditiveBlending, BufferAttribute, BufferGeometry, Camera, ClampToEdgeWrapping, Color, LinearFilter, Mesh,
  NoColorSpace, PerspectiveCamera, PlaneGeometry, Points, RGBAFormat, SRGBColorSpace, Scene, ShaderMaterial,
  TextureLoader, UnsignedByteType, Vector2, Vector3, Vector4, WebGLRenderTarget, WebGLRenderer,
} from '../vendor/three.module.js';
