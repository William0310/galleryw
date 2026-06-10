# 行记 — A Travelogue in Light

A scroll-driven photographic journey built from William's landscape photography,
organized into six albums: Qinghai, Lijiang, Chongqing, Japan, Beijing, and
Shot on iPhone. The homepage shows 3–4 photographs per album with the signature
scroll scenes; each album page (`album.html?a=<slug>`) holds the full set.

## Run it

```bash
node serve.mjs
# → http://127.0.0.1:4173
```

Any static file server works (the site is plain HTML/CSS/JS, no build step) —
just make sure `.webp` and `.woff2` get correct MIME types.

## What's inside

| Piece | How it works |
|---|---|
| WebGL hero | Raw WebGL flowmap: pointer/touch velocity is splatted into a ping-pong buffer that displaces and chromatically splits the photo (`js/webgl.js`, no three.js) |
| Smooth scroll | Lenis, driven by GSAP's ticker |
| Scroll scenes | GSAP ScrollTrigger — pinned panorama pan, Lijiang zoom-reveal, Fuji clip-path aperture, scroll-reactive marquee |
| Albums | `js/albums.js` is the single manifest (photos, captions, layout hints); `album.html` renders any album from it |
| Theme | Body morphs light ⇄ dark as you enter night chapters (Chongqing, myth scroll, the end) |
| Micro-interactions | Custom cursor, magnetic menu with image previews, FLIP-style lightbox, char/word split text reveals |
| Mobile | All scenes run on touch; ripple responds to drag; layouts collapse to editorial 2-col grids; `svh` units for iOS chrome |

Libraries are vendored in `libs/` (GSAP 3.13, ScrollTrigger, Lenis 1.3) and
fonts in `fonts/` (Cormorant Garamond, Space Grotesk) — the site works fully
offline. Optimized images live in `assets/img/`; the original photographs
remain untouched in the repository root.

## Structure

```
index.html        homepage — hero, album previews, afterword, the end
album.html        album page shell (album.html?a=qinghai … ?a=iphone)
css/style.css     design system + sections
js/webgl.js       hero flowmap shader
js/main.js        homepage choreography
js/albums.js      album manifest (photos, captions, layouts)
js/album.js       album page renderer + interactions
serve.mjs         tiny static server for local preview
```
