# Selection Lab

Static one-page site, implemented from the Claude Design canvas
[`Selection Lab.dc.html`](https://claude.ai/design/p/4840a715-4035-4806-b111-2ef4399d4f5a?file=Selection+Lab.dc.html).

## Run

```sh
npx --yes live-server --port=8000 --no-browser   # with hot reload
python3 -m http.server 8000                      # plain, no reload
# → http://localhost:8000
```

`live-server` hot-swaps `styles.css` in place; edits to `index.html` or
`main.js` trigger a full page reload. Any static host works — there is no
build step.

## Layout

```
index.html    markup (was the <x-dc> tree)
styles.css    all styling (was inline style / style-hover / style-active attrs)
main.js       behaviour (was the DCLogic component class)
assets/
  icons/      11 SVGs, stroked with currentColor
  team/       portraits — see "Missing assets"
_ds/noora-design-system-d69cb762-c356-4708-a19d-3f29d128b7fa/
              design-system tokens, copied verbatim from the design project
```

`_ds/` is the design system's source of truth and is copied verbatim — don't
hand-edit it. Re-pull it with DesignSync (`get_file`) if the design project's
tokens change. Everything in `styles.css` consumes those tokens via `var()`.

## How the canvas maps onto this

| Design canvas | Here |
|---|---|
| `<x-import … Button variant size>` | `.btn.btn-{primary,secondary,accent}.btn-{sm,md,lg}` |
| `<x-import … SectionLabel icon>` | `.section-label` + `<span class="icon" data-icon="…">` |
| `<sc-if value="{{ isDesktop }}">` / `isMobile` | `@media (max-width: 820px)` — same 820px breakpoint |
| `{{ menuOpen }}`, `{{ toggleMenu }}` | `#menu-toggle` / `#mobile-menu` in `main.js` |
| `{{ navNameColor }}` | `.site-header.is-scrolled .brand-name` |
| `{{ manifestoWords }}` | `main.js` splits `#manifesto` into word spans, lights them on scroll |
| `{{ bookingUrl }}` (prop default) | the `mailto:` on each "Book a call" |
| `{{ year }}` | `#year`, set from `new Date()` |
| `<image-slot>` | `figure.portrait`, falls back to a labelled placeholder |
| `data-reveal` / `data-reveal-delay` | same attributes, driven by an IntersectionObserver |

Icons are painted with `mask-image` + `background: currentColor` rather than
the canvas's `filter: invert(32%) sepia(94%) …` hack, so `color` sets them.

## Missing assets

Two binaries could not be pulled down — DesignSync's `get_file` caps reads at
256 KiB and both exceed it. Download them from the design project and drop them
in; the markup already points at these paths:

- `assets/logo-deer.jpg` — header + footer mark, and the favicon
- `assets/forest-banner.jpg` — hero still behind the Vimeo background video

Until they exist the header mark is invisible and the hero shows flat black
behind the video. Nothing else is affected.

Team portraits were empty `<image-slot>`s in the canvas, so there is nothing to
import. Add them as:

- `assets/team/tatiana-ilina.jpg`
- `assets/team/ali-ayati.jpg`

Any 4:5 image works; the placeholder disappears once the file loads.

## Notes

- The hero video is Vimeo `1219395657`, embedded in background mode. It may be
  domain-restricted — if it stays blank off the design host, `forest-banner.jpg`
  is what shows through.
- Header wordmark colour follows the canvas: white over the hero, `#0a0a0a`
  after. That makes it invisible against the dark Method and footer sections —
  faithful to the design, but worth revisiting.
- The layer grid uses the canvas's `repeat(auto-fit, minmax(min(320px,100%),1fr))`,
  which yields 4 columns on a wide desktop even though the stagger delays
  (0/.06/.12 ×2) suggest 3 were intended. Left as designed.
