# Foundation: the product component

Files: `site/js/lib/component.js` (ES module with no dependencies: no GSAP needed), `site/css/component.css`, QA page `site/component-lab.html` (`?ghost=1` lays the real PNGs over the recreation at 50%; `?t=.5` pins the time of day; `?still=1` stops the dynamic drift).
Load `tokens.css` first, then `component.css`.

The SPEC names its libs `lib/wallpaper.js`, `lib/screen.js` and `lib/popover.js`. The integrator can make each one a single-line re-export:
```js
// lib/screen.js
export { createScreen, SCREEN_DEFAULT } from './component.js';
// lib/wallpaper.js
export { PALETTE, PRESETS, phaseFromClock, paintWallpaper } from './component.js';
// lib/popover.js
export { createPopover, SETTINGS_DEFAULT } from './component.js';
```
Other exports: `createStore` (a fallback with the same shape as `lib/store.js`: `state` accessors, `get`, `set`, `subscribe`), `EASE` (JS easing fns), `CSS_EASE`, `phaseName(t)`.

## createScreen(el, opts) → screen
```js
const s = createScreen(el, {
  mode: 'viewport' | 'display' | 'mini' | 'preview',  // default 'display'
  store,            // optional; any {get,set,subscribe} store seeded with SCREEN_DEFAULT (else one is made)
  notch: true, interactive: false, parallax: false,
  follow: false, settings,   // follow:true + settings store → radius/corners/iconHidden/builtInOnly follow it
  clock: true,      // live clock in the menu bar (viewport/display)
  label: 'Screen preview',   // aria-label prefix; the label is kept current
});
```
- **viewport** fills its positioned parent (`position:absolute; inset:0`) and takes `--pt` from the tokens. **display** is a bezelled screen-top that can show 1–3 displays. **mini** is a 16:10 card. **preview** is the popover's 304×197 preview, with no menu text.
- Setters write the store; one subscriber writes `--band --r --fil --eb --notch-rim` on the root. The DOM is never rebuilt, so scrubbing is cheap.

| Setter | Notes |
|---|---|
| `setBand(p,{duration=700, ease='sweep'})` | 0..1. `duration:0` sets it at once (use this for scrubs). The band spreads out of the notch. Fillets follow automatically: they spring in at ≥.98 and leave first. Returns a Promise. |
| `setRadius(pt,{duration=520})` | 10/14/20 or any number. Uses the fillet overshoot ease. |
| `setFillets(v|null,{duration})` | Manual fillet scale 0..1; `null` hands control back to the band. |
| `setTime(t|'local',{duration=900})` | 0 dawn, .25 day, .5 dusk, .75 night. Takes the shortest way round the day. `'local'` follows the clock (and `?t=`). |
| `setWallpaper(id|'next',{transition:'slide'|'cut'})` | `hills dunes tide ridge`. A slide wipes in from the right under a band that does not move. |
| `setDisplays(n)` / `setBuiltInOnly(bool)` | display mode; externals slide in. Built-in-only retracts the external bands to their centres. |
| `setMenuText('auto'|'dark'|'white')`, `setNotchRim(v|null)`, `setStatusIcon('normal'|'hidden')` | |
| `pulse()`, `process(ms)`→Promise, `flash(text, ms)` | `flash` drops a mono pill from the notch and also announces the text in a polite live region. |
| `on('change'|'notchdrag'|'notchclick', fn)` | `notchdrag` gives `{p, phase:'move'|'end'}`. |
| `store`, `wallpaper`, `el`, `destroy()` | |

**Scrubbing with GSAP**: either call setters with `duration:0` inside `onUpdate`, or tween the store directly:
```js
gsap.to(hero.store.state, { band: 1, ease: 'none', scrollTrigger: { trigger: '#hero', start: 'top top', end: '40% top', scrub: .9 } });
gsap.to(hero.store.state, { radius: 20, scrollTrigger: {...} });   // time, fil, ext also tween
```
**Interactive notch**: drag down to pull the band out (with rubber resistance past 1). On release it snaps to 1 above .4 and shows the toast "Notch hidden.". A click blinks the lens and cycles the four joke toasts. For the hero rule `max(scroll, drag)`, listen to `notchdrag`.

## createPopover(el, {store, mirror, toast, appearance, version}) → popover
```js
import { settings } from './settings.js';        // or createStore({...SETTINGS_DEFAULT})
const mirror = createScreen(mirrorEl, { mode: 'display', follow: true, settings, interactive: true });
const pop = createPopover(popEl, { store: settings, mirror, appearance: 'dark', toast: t => toast(t, {anchor}) });
pop.set({ on: true });        // runs the real sequence: Processing… → shimmer → band sweeps out → "Notch hidden…" → "Notch hidden." after 4 s
pop.setAppearance('light'); pop.highlight('switch'); pop.on('change', (s, keys) => {});
```
- It writes `settings`: `on corners radius dynamic builtInOnly rotate every folder loginItem iconHidden`. The `html.icon-hidden` class and `--r-site` stay with `settings.js`.
- Every control is real and works from the keyboard: a switch button (role switch); native checkboxes; the radius control is a radiogroup with arrow keys and a roving tabindex; a native select. Coarse pointers get 44 px hit areas.
- **Dynamic** drifts the time of the preview and the mirror by one day every 36 s, only while the popover is visible and the tab is shown, and never under reduced motion.
- **Next** needs a folder and the switch on (the same rule as the Swift). **Choose Folder…** picks a sample set. **Check for Updates…** and **Quit** behave as SPEC §3.5 describes.
- `version` defaults to the JSON-LD `softwareVersion`.
- The geometry is measured from `popover-*.png`: 340 wide, 15 px radius, 54×24 switch, 16 px checkboxes, a 186×20 segmented control and 20 px buttons. Colours are sampled from the PNGs; light uses #0277FA blue, dark #117DFF. With the overlay on, it lines up within about 1 pt.

## Reduced motion
`prefers-reduced-motion: reduce` makes every setter immediate. `process` and `flash` become short fades, CSS transitions are switched off, there is no drift and no parallax, and Quit skips the shrink.

## Known limits
- In viewport mode the menu bar is drawn inside the glass. SPEC 4.1 wants it in the `.nav`, so the integrator either moves `.nt-mb`, `.nt-band`, `.nt-fil` and `.nt-notch` there, or overlays the nav exactly; the vars are set on the screen root.
- Hero bezels, corner masks and the spill are the hero section's job; they are not in this file.
