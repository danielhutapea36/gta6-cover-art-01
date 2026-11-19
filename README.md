# Vice City Cover Maker — GTA 6 Cover Art entry (gta6-cover-art-01)

An offline web app that turns a person's photos and a caption into GTA 6-style
multi-panel poster cover art, exported as a PNG to share.

## The story

Photo-filter apps and mobile "GTA cover" templates put one fixed frame over one
photo, usually by uploading it to a server, and often with a watermark. This app
is the opposite: it runs entirely offline in desktop Chrome, the photos never
leave the machine, and the poster is built from the person's own photos — one
photo filling several panels, or a different photo in each panel, each cropped
and positioned by hand.

## What it does

- **Multi-panel posters** — three layouts: Sunset Grid (one hero panel over two),
  Neon Strip (three vertical panels) and Hero Trio (one tall hero beside three).
- **Any photo** — load photos from the machine per panel, or fill every panel
  with one photo; drag a photo inside its panel to position it, scroll to zoom,
  or use the zoom / pan sliders. Two bundled sample photos (Pier, Boulevard)
  let anyone try it with no photo at hand.
- **Colour grades** — Vice Sunset, Neon Nights and Golden Hour: a warm wash, a
  glowing sun disc, neon frame lines and a vignette, all drawn on canvas.
- **Caption lettering** — a bold uppercase caption with a sunset gradient fill
  and dark outline, plus a tracked tagline above it (e.g. "VICE CITY"), both
  editable live.
- **Export** — one click downloads the cover as a PNG in 1080×1080, 1080×1350
  or 1920×1080.

## Sources and decisions

- Built from the competition kit's starter (its `main.ts` plumbing, `serve.ts`,
  `vendor/makefun-app.ts` and the two sample photos in `app/samples/` are the
  kit's; the app itself — `app/index.html`, `app/style.css`,
  `app/src/cover.js`, `app/src/main.js`, `app/src/shots.js` — is written for
  this entry).
- The two sample photos (`app/samples/boulevard.jpg`, `app/samples/pier.jpg`)
  were made with an image model for make.fun and are free to use; they are the
  only photos in the screenshots — no real person's photo, no GTA artwork.
- **Originality:** no Rockstar Games logo, wordmark, artwork, character or
  font. All lettering is drawn on canvas with the system font stack
  (`'Arial Black', 'Helvetica Neue', system-ui, sans-serif`) — no font file is
  shipped at all, so nothing is borrowed from the game.
- **Offline:** every script, style and image the page loads is a file under
  `app/` (or a `data:` URI for the empty favicon); there are no network
  requests. Photos are read on the machine with `URL.createObjectURL` and
  never uploaded.
- **No libraries:** plain ES modules and the 2D canvas API; no vendored
  library was needed.

## Try it

```
node serve.ts            # serves app/ at http://localhost:8080
```

Pick a layout and a grade, load photos into the panels, drag to position them,
type the caption, choose a size and press Export PNG.

## Screenshots

- `1-cover.jpg` — exported wide cover (Hero Trio, Vice Sunset)
- `2-editor.jpg` — the editor with a photo loaded
- `3-cover-square.jpg` — exported square cover (Neon Strip, Neon Nights)
- `4-cover-portrait.jpg` — exported portrait cover (Hero Trio, Golden Hour)

Screenshots were taken in headless Chromium from the app served locally, using
the `?shot=` scenes in `shots.json`; the covers are the app's own drawing at
export size, scaled to the screenshot limits.
