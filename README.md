# Skeye homepage

Static homepage (no build step). Open `index.html`, or serve the folder:

```bash
python3 -m http.server 8750
```

## Structure

```
index.html          page markup
css/styles.css      all styles (design tokens at the top)
js/globe.js         hero: dotted globe, zoom-out intro, cross-fade, background change
js/earth.js         hero: photoreal Earth (three.js), driven by globe.js
assets/             site logos, ESA logo
assets/img/         industry card images
assets/brand/       standalone SVGs: dotted globe (globe-dots-*) and logo mark (globe-logo-*)
```

## Notes

- **Colours:** Blue `#0038A8`, hover `#0049DB`, charcoal `#333334`, slate `#6C6E72`, light `#EDF0F0`.
- **Hero:** solid brand blue (`--blue`, `#0038A8`) behind the globe. The background stays the same blue when the photoreal Earth fades in.
- **Fonts:** Geist for body, nav and buttons; Outfit for `h1`/`h2`. Both load from Google Fonts. To revert everything to Outfit, set `--font-body: var(--font-display)` at the top of `css/styles.css`.
- **External resources:** the Earth in the hero loads three.js and its textures from unpkg at runtime (about 0.9 MB). If they fail to load, the dotted globe simply stays. For production, copy them into the project and update the URLs in `js/earth.js`. The video section embeds YouTube (`youtube-nocookie.com`).
- **Reduced motion:** with `prefers-reduced-motion`, the hero shows the static dotted globe.
