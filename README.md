# Wphotographs

A static photography site, no build step. Seven albums, each with its own look and its own WebGL hero.

```bash
node serve.mjs        # → http://localhost:4173  (needs http://, file:// won't load ES modules)
```

## Admin (editing text)

Double-click **Wphoto Admin.command** (or run `node admin/server.mjs`). It opens
http://localhost:4180/admin/ where you can edit:

- every album's names, titles, coordinates and the text on its page (introductions, quotes, chapters)
- every photo's Chinese title, English title and place
- the About page (spec sheet rows, manifesto, contact text)
- the Newsroom (new post, edit, delete)

**Save** (⌘S) writes `js/data/content.js`; the site reads it directly, so reload any page to see
the change (the admin's **Preview** pane does this for you). Every save keeps a backup in
`admin/backups/` (last 40; not committed to git). The admin only runs on your own computer —
on the public site `/admin/` can't save anything and is excluded in robots.txt.

## Layout

| Path | What |
| --- | --- |
| `index.html`, `album.html` | Home and the album template (`album.html?a=qinghai`, `lijiang`, `xinjiang`, `japan`, `beijing`, `datong`, `misc`) |
| `js/data/content.js` | **All content**: captions, album text and layout blocks, About, Newsroom. Edited by the admin; also plain JSON you can edit by hand. Move a photo between albums by moving its id in the `blocks`. |
| `js/data/albums.js`, `news.js` | Small helpers that read `content.js` |
| `about.html`, `news.html` | About page (with the Formspree contact form) and Newsroom |
| `js/data/meta.js` | Generated: sizes, blur placeholders, colours for every photo |
| `js/gl/world.js` | Home WebGL layer: every home photo is a plane revealed with its album's effect (mirror, frost, slit, ink, scroll, candle, neon) |
| `js/gl/album-hero.js` | Per-album hero shaders on album pages |
| `js/album/` | Block renderer and ScrollTrigger choreography |
| `css/album.css` | Shared blocks, then one `.t-<album>` theme each |
| `assets/img/` | Your originals (untouched) |
| `assets/photos/` | Responsive variants generated from the originals |

## Adding or changing photos

1. Put the file in `assets/img/` (webp).
2. Regenerate variants + metadata (needs Pillow: `pip install Pillow`):
   `python3 tools/process_images.py`
3. Place the id in a block in `js/data/content.js`, then give it a caption in the admin.
   The three frames each album shows on the home page are its `picks` (the first must be the
   album `cover`, so entering from the home page lands on the same frame); its home-page
   colours are `palette`.

Block types: `intro`, `full`, `row`, `pano` (pinned horizontal scroll), `strip`, `solo`, `chapter`
(optional `palette` to shift page colours), `quote`, `marquee`, `counter`, `grid`, `sequence`.

## three.js

Pages load `vendor/three.min.js`, a tree-shaken subset. If you use a new three.js class, add it to
`tools/three-entry.js` and rebuild:
`npx esbuild tools/three-entry.js --bundle --minify --format=esm --outfile=vendor/three.min.js`
