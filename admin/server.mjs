// Wphoto Admin — a local editor for js/data/content.js.
//   node admin/server.mjs        → opens http://localhost:4180/admin/
// Serves the whole site too, so the editor's preview shows the real pages.
// Only listens on 127.0.0.1; every save keeps a timestamped backup in admin/backups/.
import { createServer } from 'node:http';
import { readFile, writeFile, rename, mkdir, readdir, unlink, stat } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { exec } from 'node:child_process';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const CONTENT = join(ROOT, 'js/data/content.js');
const BACKUPS = join(ROOT, 'admin/backups');
const PORT = Number(process.env.PORT) || 4180;
const KEEP = 40;

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.webp': 'image/webp', '.png': 'image/png',
  '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.ico': 'image/x-icon',
};

const HEADER = '// All editable site content: captions, album text and layout, About page, Newsroom.\n'
  + '// Edit with the admin app (node admin/server.mjs) or by hand — it must stay valid JSON after\n'
  + '// "export default" (double quotes, no trailing commas).\n';

async function readContent() {
  const src = await readFile(CONTENT, 'utf8');
  // The statement starts a line; the header comment also mentions it, so match line starts only.
  const m = /^export default /m.exec(src);
  if (!m) throw new Error('content.js has no "export default" line');
  const json = src.slice(m.index + m[0].length).trim().replace(/;\s*$/, '');
  return JSON.parse(json);
}

// Minimal shape check so a broken request can never wipe the site's data.
function validate(c) {
  const err = (m) => { throw new Error(m); };
  if (!c || typeof c !== 'object') err('Content must be an object.');
  if (!c.photos || typeof c.photos !== 'object') err('Missing photos.');
  if (!Array.isArray(c.albums) || !c.albums.length) err('Missing albums.');
  for (const a of c.albums) {
    if (!a.slug || !Array.isArray(a.blocks) || !a.cover) err(`Album "${a.slug || '?'}" is incomplete.`);
  }
  if (!c.about || typeof c.about !== 'object') err('Missing about.');
  if (!Array.isArray(c.news)) err('Missing news.');
  for (const n of c.news) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(n.date || '')) err(`Post "${n.title || '?'}" needs a date (YYYY-MM-DD).`);
    if (!n.title) err('Every post needs a title.');
  }
}

const stamp = () => new Date().toISOString().replace(/[-:]/g, '').replace('T', '-').slice(0, 15);

async function saveContent(c) {
  validate(c);
  c.news.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
  await mkdir(BACKUPS, { recursive: true });
  await writeFile(join(BACKUPS, `content-${stamp()}.js`), await readFile(CONTENT, 'utf8'));
  const files = (await readdir(BACKUPS)).filter((f) => f.startsWith('content-')).sort();
  for (const f of files.slice(0, Math.max(0, files.length - KEEP))) await unlink(join(BACKUPS, f));
  const tmp = CONTENT + '.tmp';
  await writeFile(tmp, HEADER + 'export default ' + JSON.stringify(c, null, 2) + ';\n');
  await rename(tmp, CONTENT);
}

const send = (res, code, body, type = 'application/json') => {
  res.writeHead(code, { 'Content-Type': type, 'Cache-Control': 'no-store' });
  res.end(typeof body === 'string' || Buffer.isBuffer(body) ? body : JSON.stringify(body));
};

createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://x');
    if (url.pathname === '/api/content') {
      if (req.method === 'GET') return send(res, 200, await readContent());
      if (req.method === 'PUT') {
        let body = '';
        for await (const chunk of req) { body += chunk; if (body.length > 5e6) throw new Error('Too large'); }
        await saveContent(JSON.parse(body));
        return send(res, 200, { ok: true, savedAt: new Date().toISOString() });
      }
      return send(res, 405, { error: 'Method not allowed' });
    }
    if (url.pathname === '/api/backups') {
      const files = (await readdir(BACKUPS).catch(() => [])).filter((f) => f.startsWith('content-')).sort().reverse();
      return send(res, 200, files);
    }
    let path = decodeURIComponent(url.pathname);
    if (path === '/admin') { res.writeHead(302, { Location: '/admin/' }); return res.end(); }
    if (path.endsWith('/')) path += 'index.html';
    const file = normalize(join(ROOT, path));
    if (!file.startsWith(ROOT) || file.includes(`${'/'}admin${'/'}backups`)) return send(res, 403, 'Forbidden', 'text/plain');
    const s = await stat(file).catch(() => null);
    if (!s || !s.isFile()) return send(res, 404, 'Not found', 'text/plain');
    res.writeHead(200, { 'Content-Type': TYPES[extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    res.end(await readFile(file));
  } catch (e) {
    send(res, 400, { error: e.message });
  }
}).listen(PORT, '127.0.0.1', () => {
  const url = `http://localhost:${PORT}/admin/`;
  console.log(`Wphoto Admin → ${url}\nPress Ctrl+C to stop.`);
  if (!process.env.NO_OPEN) exec(`${process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'start ""' : 'xdg-open'} "${url}"`);
});
