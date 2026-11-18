// Cache-busting for GitHub Pages (which lets browsers cache files for ~10 minutes).
// Run before every push:   node tools/bump-version.mjs
// It stamps one version (date + time) onto every page's CSS, scripts and — through each
// page's import map — every JS module the pages import, plus the Newsroom poster images.
import { readFile, writeFile, readdir } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const PAGES = ['index.html', 'album.html', 'about.html', 'news.html'];
const d = new Date();
const V = process.argv[2] || `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}-${String(d.getHours()).padStart(2, '0')}${String(d.getMinutes()).padStart(2, '0')}`;

async function walk(dir) {
  const out = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) out.push(...await walk(p));
    else if (e.name.endsWith('.js')) out.push(p);
  }
  return out;
}

// Import map: every module URL → the same URL with ?v=. Import maps also match the
// resolved URLs of relative imports inside modules, so nested imports get versioned too.
const modules = (await walk(join(ROOT, 'js'))).map((f) => './' + relative(ROOT, f));
const imports = { three: `./vendor/three.min.js?v=${V}` };
for (const m of modules) imports[m] = `${m}?v=${V}`;
const importmap = `<script type="importmap">${JSON.stringify({ imports })}</script>`;

const stamp = (url) => `${url.replace(/\?v=[^"']*/, '')}?v=${V}`;
for (const page of PAGES) {
  let html = await readFile(join(ROOT, page), 'utf8');
  if (html.includes('<script type="importmap">')) html = html.replace(/<script type="importmap">[\s\S]*?<\/script>/, importmap);
  else html = html.replace(/(\s*)<script src="vendor\//, `$1${importmap}$1<script src="vendor/`);
  html = html.replace(/(<link rel="stylesheet" href=")([^"]+)(")/g, (_, a, u, b) => a + stamp(u) + b);
  html = html.replace(/(<script (?:type="module" )?src=")([^"]+)(")/g, (_, a, u, b) => a + stamp(u) + b);
  if (!html.includes('<script type="importmap">')) throw new Error(`${page} has no import map`);
  await writeFile(join(ROOT, page), html);
}

// Poster images referenced from content.js.
const cpath = join(ROOT, 'js/data/content.js');
let content = await readFile(cpath, 'utf8');
content = content.replace(/("src": "assets\/posters\/[^"?]+)(\?v=[^"]*)?"/g, `$1?v=${V}"`);
await writeFile(cpath, content);

console.log(`Version ${V}: ${PAGES.length} pages, ${modules.length} modules, posters stamped.`);
