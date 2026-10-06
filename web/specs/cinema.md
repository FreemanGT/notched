# CINEMA: creative spec for notched.vercel.app (v2)

Lens: cinematic. The page is one continuous film shot of a screen in a dark room. The screen is the only light source, and the black band is the matte that drops over the one thing that shouldn't be in frame.
Every claim comes from `web/FACTS.md`. **Client decision (2026-10-06): every Download CTA asks for an email first (§4.7).** It replaces this spec's earlier "no forms / no email" lines; the download itself never waits on the network. Where FACTS and the Swift disagree, the Swift wins; I checked the status strings in `SettingsView.swift` and `WallpaperManager.swift` and they match FACTS.

---

## 0. Big idea: "Lights down."

**The notch is the boom mic hanging into the shot. Notched lowers the matte.**

- **Room.** The page is a pitch-black room (`#000`). The only colour anywhere is wallpaper light, and it spills onto the page the way a screen lights a dark room. Black is the hero colour: the page, the bezel, the band and the notch are all the same `#000`, so whenever the band is on, the screen's top edge fuses with the page.
- **Verb.** Category competitors make the notch grow (a Dynamic Island that pops out). We make it disappear. All motion is subtraction: the band spreads out from the notch, text inverts as the band passes under it, the notch outline dissolves, and mattes close. Nothing bounces out.
- **Camera.** Each section is a scene (`SC.01`…`SC.07`, shown in mono like a slate). Between scenes a virtual camera on the living screen dollies, pushes in, pulls back and orbits. It is a CSS 3D transform on one wrapper, so it costs almost nothing.
- **Signature moment (the sentence a juror says):** "As you scroll, the black spreads out of the notch, the menu bar text flips white letter by letter, and the site's own header turns out to be that menu bar."
- **The nav is the menu bar.** The hero screen's menu bar is the site navigation. Once you leave the hero it detaches and sticks to the top of the viewport as a black band with white text, and the notch sits invisibly inside it. The whole site lives under a hidden notch.

What we kill from the old site: the centred icon over a title, the lone toggle over a small laptop, the 4-up feature grid and the bouncing accordion.

---

## 1. Design tokens

### 1.1 Fonts (two families, self-hosted, latin subset, `font-display: swap`, preload both)
| Role | Family | npm | Axes / weights used |
|---|---|---|---|
| Display + body | **Archivo** (variable) | `@fontsource-variable/archivo` | `wght` 100–900, `wdth` 62–125. Display: wght 760, wdth 112 (title cards up to wdth 125). Squeeze-into-notch: wdth 125→62. Body: wght 420, wdth 100. UI labels: wght 560. |
| Mono (slates, readouts, chips, paths) | **Martian Mono** (variable) | `@fontsource-variable/martian-mono` | `wght` 100–800 (+ `wdth` 75–112.5 if present). Use wght 400 for readouts and 500 for slates, wdth 87.5 for long paths. |

- **wdth file.** Use the fontsource file that carries both `wdth` and `wght` (`files/archivo-latin-wdth-normal.woff2`). Check its axes with `fonttools ttLib` and `fvar`. If `wdth` is missing, subset Google Fonts' `Archivo[wdth,wght].ttf` with `pyftsubset --unicodes="U+0000-00FF,U+2013-2026,U+2190-2193,U+2318,U+2325" --flavor=woff2 --layout-features='*'`.
- Copy the woff2 files to `site/fonts/`. Budget: ≤ 200 KB total (Archivo about 110 KB, Martian Mono about 45 KB).
- **Banned here:** Anybody, Instrument Serif/Sans, Geist and Geist Mono (Claude Meter's identity). No SF Pro files.
- **Popover only.** The popover recreation uses `font-family: -apple-system, BlinkMacSystemFont, system-ui, sans-serif`. That is the visitor's own system font, not a shipped file, so on a Mac it is pixel-faithful.

### 1.2 Type scale (fluid; `clamp(min, vw, max)`)
| Token | Size | Line height / tracking | Use |
|---|---|---|---|
| `--t-title` | clamp(64px, 13vw, 220px) | 0.86 / -0.035em, wdth 118, wght 780 | Finale wordmark, title cards |
| `--t-h1` | clamp(48px, 9.2vw, 152px) | 0.9 / -0.03em, wdth 112, wght 760 | Hero |
| `--t-h2` | clamp(36px, 5.6vw, 88px) | 0.95 / -0.025em, wdth 108, wght 720 | Section heads |
| `--t-h3` | clamp(22px, 2.2vw, 32px) | 1.1 / -0.01em, wght 640 | Chapter titles |
| `--t-lede` | clamp(18px, 1.6vw, 24px) | 1.45, wght 420 | Ledes, manifesto at `--t-h2` |
| `--t-body` | 17px (16px <480px) | 1.6, wght 420 | Body |
| `--t-mono` | 12px | 1.4 / +0.06em uppercase, Martian 500 | Slates, readouts, chips |

### 1.3 Colour (hex)
```
--black:      #000000   /* page, bezel, band, notch: one black */
--ink-1:      #0A0A0B   /* raised surfaces (FAQ rows, cards) */
--ink-2:      #141416   /* hover surface */
--line:       rgba(255,255,255,.09)  /* hairlines */
--line-2:     rgba(255,255,255,.16)
--paper:      #F3F0E8   /* "projector white": all primary text, CTA fill */
--mute:       #9A9AA2   /* secondary text: 7.5:1 on #000, AA everywhere */
--dim:        #5C5C63   /* un-inked manifesto words, decorative only (not for info) */
--signal:     #6BE3D0   /* the icon's mint: focus rings, live dots, active chapter bar */
--signal-2:   #3B71FE   /* the icon's blue: the gradient partner of --signal */
/* popover (macOS-faithful, popover only) */
--pv-accent:  #0A84FF (dark) / #007AFF (light)
--pv-bg-dark: #1E1E1E  --pv-bg-light: #ECECEC
--pv-text-dark: #FFFFFF at .85 --pv-text-light: #000000 at .85
```
**Wallpaper palettes.** These are the time-of-day keyframes. `t` is 0..1 and wraps; interpolate in linear RGB with `gsap.utils.interpolate`.
| t | Name | skyTop | skyBottom | hillBack | hillFront | sun | sunY (0 top..1) | stars |
|---|---|---|---|---|---|---|---|---|
| 0.00 | dawn | #1D2858 | #F4A27E | #7A5C93 | #3C3463 | #FFD7A8 | 0.80 | 0.25 |
| 0.25 | day (the icon) | #3B71FE | #6BE3D0 | rgba(255,255,255,.28) over the sky | rgba(255,255,255,.22) | #FFFFFF | 0.18 | 0 |
| 0.50 | dusk | #2A1D5E | #FF7A4D | #8E3E6C | #4B2452 | #FFB271 | 0.84 | 0.15 |
| 0.75 | night | #02040E | #14224D | #1B2754 | #0D1430 | #E9EDFF (moon) | 0.22 | 1 |

The hills are the two paths from `AppIcon.icon/Assets/hills.svg`, which are ours. Day is exactly the app icon. That palette is the brand.

### 1.4 Shape, space, texture
- Radii: `--r-pill: 999px`, `--r-card: 22px`, `--r-popover: 11px` (measured from the 2x render: 22 px), `--r-preview: 8px`, `--r-bezel: clamp(18px, 2.2vw, 34px)` (outer bezel corners).
- Space: 4-pt base. Section padding is `clamp(96px, 14vh, 180px)` vertical. Gutters are `max(16px, 4vw)`. The content max is 1320px.
- **Grain:** a fixed full-viewport overlay, `pointer-events:none; z-index: 90; mix-blend-mode: overlay; opacity: .09`. Make it a 160 px noise PNG tile, generated once at build from an SVG `feTurbulence` (baseFrequency .9, 2 octaves) and saved as `site/assets/grain.png` (~6 KB). Jitter it at 8 fps with `steps()` via `@keyframes` translating ±3%. Static under reduced motion.
- **Vignette:** one `radial-gradient(120% 90% at 50% 40%, transparent 55%, rgba(0,0,0,.55))` on the hero only.
- **Screen spill (the room light):** behind every living screen sits a blurred copy of its wallpaper: `filter: blur(60px) saturate(1.3); opacity:.45; transform: scale(1.15)`. It sits behind the bezel, so wallpaper light washes onto the black page. It uses the same CSS vars as the wallpaper, so it is free. This is how "light from black" happens without WebGL.
- **Bezel edge light:** a 1px `inset 0 1px 0 rgba(255,255,255,.07)` rim on the bezel, plus a 1px highlight around the notch outline (`--notch-rim`, opacity driven by band progress: 1 → 0). That rim is the only reason the notch is readable against the black page. When it goes, the notch is gone.

### 1.5 Easing and duration
```
CustomEase.create('matte',   'M0,0 C0.77,0 0.18,1 1,1')     // band, mattes, wipes
CustomEase.create('cine',    'M0,0 C0.16,1 0.3,1 1,1')      // reveals, camera settles (expo-out)
CustomEase.create('dissolve','M0,0 C0.55,0 0.85,0.35 1,1')  // things leaving into black
CustomEase.create('dolly',   'M0,0 C0.45,0 0.2,1 1,1')      // camera moves in scrubbed timelines
CSS: --e-out: cubic-bezier(.16,1,.3,1); --e-inout: cubic-bezier(.65,0,.35,1); --e-matte: cubic-bezier(.77,0,.18,1)
--d-micro: 160ms  --d-ui: 240ms  --d-reveal: 900ms  --d-cine: 1400ms
Scrub: scrub: 0.8 (camera/stage), scrub: 0.4 (text inking), scrub: true (mask/clip edges that must track exactly)
```

---

## 2. Global motion system

### 2.1 Rules
- Scroll is **native**. Use GSAP ScrollTrigger on the real scroll. **No Lenis** (Mac trackpads already have inertia, and default Lenis is a known cliché). Don't ship `lenis.min.js`.
- Pin with **CSS `position: sticky`** inside tall sections, and drive the timelines with ScrollTrigger `scrub` on the parent. Use `pin: true` only where noted. This avoids pin-spacer CLS and keeps find-in-page and anchors working.
- Animate only `transform`, `opacity`, `clip-path` and CSS custom properties that feed those. Never animate layout properties.
- Each living screen pauses its ambient loops (clock tick, star twinkle, ghost cursor) when off-screen (IntersectionObserver).
- One GSAP `matchMedia` context per section with three branches: `(prefers-reduced-motion: no-preference) and (min-width: 900px)`, `(prefers-reduced-motion: no-preference) and (max-width: 899px)`, `(prefers-reduced-motion: reduce)`.
- Every scrubbed state must also be reachable without scroll. The demo popover, the chapter buttons and the reduced-motion static states all show it.

### 2.2 Shared utilities (architect provides; sections import, never re-implement)
`site/js/lib/motion.js`
```js
export const gsap = window.gsap, ScrollTrigger = window.ScrollTrigger;     // plugins registered in main.js
export const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
export const isTouch = matchMedia('(hover: none)').matches;
export function mm(fn)                       // gsap.matchMedia() with {desktop, mobile, reduced} conditions; returns ctx
export function onVisible(el, enter, leave, rootMargin='10% 0px')   // IntersectionObserver; returns disconnect()
export function split(el, {type='words', mask=true})  // SplitText wrapper, aria preserved (SplitText 3.13+ default), returns instance; revert() on resize via autoSplit
export function ink(el, st)                  // word-by-word ink: words from color var(--dim) to var(--paper), scrubbed by st (ScrollTrigger vars)
export function bandText(el)                 // dual-layer text: clones el into .band-text__lit (white) clipped by --band-l/--band-r/--band-t/--band-b vars; returns {set({l,r,t,b})}
export function slate(el, text)              // ScrambleText of a mono slate ("SC.03 — TAKE THE CONTROLS"), 0.6s, chars "0123456789—·/"
export function counter(el, values, i)       // mono readout swap: old value slides up 100% + fades, new from -100% (0.32s cine)
export const lerpPalette                     // (t) => {skyTop, skyBottom, hillBack, hillFront, sun, sunY, stars}  (from wallpaper.js)
```
`site/js/main.js`: loads the vendor scripts, registers ScrollTrigger, SplitText, CustomEase, DrawSVGPlugin and ScrambleTextPlugin, creates the four eases, mounts the global elements (menubar nav, grain, Claude Meter pill, intro), calls `initCtas(document)` from `js/lib/cta.js` (§4.7), then dynamic-`import()`s each `js/<section>.js` when its section is within 1 viewport (IntersectionObserver rootMargin `100% 0px`). It calls `ScrollTrigger.refresh()` after `document.fonts.ready`. It also syncs the version: every `[data-version]` element gets its text from the JSON-LD `softwareVersion`. The HTML ships the literal `1.0.2` for no-JS. **Flag for lead:** have `scripts/release.sh` also rewrite `data-version` text, or accept the runtime sync.

`site/js/lib/wallpaper.js`: the procedural wallpaper (SVG, no WebGL; see §3.3).
`site/js/lib/screen.js`: the living screen component (§3).
`site/js/lib/popover.js`: the operable menu-bar window (§3.5).
`site/js/lib/cta.js` + `site/js/lib/signup.js`: the download ask (§4.7). Adapt the logic of `/Users/freemansmain/Ai Projects/Claude Meter/site/js/lib/{cta,signup}.js`, not the look.

### 2.3 Vendor (`site/vendor/`, self-hosted, classic `<script defer>`)
- **From the Claude Meter build:** `gsap.min.js`, `ScrollTrigger.min.js`, `SplitText.min.js`, `CustomEase.min.js`, `DrawSVGPlugin.min.js`, `ScrambleTextPlugin.min.js`. Get them from `/Users/freemansmain/Ai Projects/Claude Meter/site/vendor/`.
- **Not used:** Flip, MorphSVG, Observer, Draggable, Inertia, Lenis. Don't copy them.
- **No WebGL library.** No WebGL at all. **Reason:** the hero needs up to 3 screens plus the popover preview plus feature stages (about 7 wallpaper instances). Seven GL contexts is a non-starter, and SVG with CSS vars renders the icon's hills art crisply at any DPR for ~0 KB. If a later critic wants shader grain on the sky, add one fullscreen canvas behind the hero only.

---

## 3. THE PRODUCT COMPONENT: `createScreen()`

A MacBook screen-top recreated in DOM, CSS and SVG. One module, many instances. It is pixel-honest to `WallpaperRenderer.swift`: the band is full width × menu-bar height, pure black, and the concave quarter-circle fillets of radius r hang under each end.

### 3.1 DOM (built by JS into a host `<div class="screen">`; server HTML ships a static fallback frame with the same classes in the "band on, day, 14 pt" state so no-JS and bots get a finished picture)
```
.screen                      (style vars: --band 0..1, --r px, --menu-ink 0..1, --notch-rim 0..1, --cam-*)
  .screen__spill             blurred wallpaper copy behind (room light)
  .screen__bezel             black frame, --r-bezel outer radius, 1px rim light
    .screen__glass           clip: rounded-top screen, overflow hidden
      svg.wp                 the wallpaper (sky rect w/ linearGradient, sun circle + radial bloom, stars <g>, hill paths x2)
      .menubar               height = --mb (24px desktop scale; = 2.9% of glass height, min 18px)
        .menubar__dark       menu items in dark ink (left: "" no logo → a drawn 10px dot ●, "Notched", "File" "Edit" "View" "Window" "Help"; right: status glyphs, Notched icon, clock)
        .menubar__lit        identical clone in white, clip-path driven by band edges (see 3.4)
      .band                  #000, height --mb, clip-path: inset(0 calc((1 - var(--band)) * (50% - var(--notch-w)/2)) 0 calc(...))  → spreads out from the notch
      .fillet.fillet--l/.r   12×12 SVG quarter-circle masks (radius-driven scale), appear only at band ≥ .98
      .notch                 #000, width 11.6% of glass (≈ notch proportion), height = --mb, bottom radii 8px/scale; camera lens dot (#0B0F1A + #23304F glint)
      .notch__rim            1px rgba(255,255,255,.12) stroke following the notch outline, opacity var(--notch-rim)
  .screen__chin? (no — we never show the hinge/keyboard; the frame is always a crop of the top of a display)
```
- External displays (`displays > 1`) are additional `.screen--ext` siblings: thin even bezel, no notch, their own band and fillets, same wallpaper and their own time offset (all equal by default).
- **No Apple logo anywhere.** The menu bar's leftmost item is a small paper dot ●, not a fruit. App menus are generic words. Status glyphs are our own simple SVGs: a battery outline, a wifi-ish arc set, and the **Notched icon** (`menubar.rectangle` shape redrawn: a 16×11 rounded rect with a filled top bar). The clock shows the visitor's local time `EEE H:mm`, ticking each minute.

### 3.2 API
```js
import { createScreen } from './lib/screen.js';
const s = createScreen(hostEl, {
  band: 0,            // 0..1  black band spread (0 = off, 1 = edge to edge)
  radius: 14,         // pt: 0 | 10 | 14 | 20 (0 = Round corners off)
  time: 'now',        // 0..1 (0 dawn, .25 day, .5 dusk, .75 night) or 'now' = visitor's local hour mapped: 6h→0, 12h→.25, 18h→.5, 0h→.75
  wallpaper: 'hills', // 'hills' | 'dunes' | 'tide' | 'ridge'  (4 procedural sets: same palette system, different path pairs; hills = icon art)
  displays: 1,        // 1..3
  builtInOnly: false, // true → external displays keep no band
  menuInk: 'auto',    // 'auto' (white where band covers, dark elsewhere: the honest behaviour) | 'dark' | 'light'
  notchRim: 1,        // 0..1
  camera: { zoom: 1, x: 0, y: 0, rx: 0, ry: 0 },  // CSS 3D camera on the wrapper
  appearance: 'auto', // only affects popover preview reuse
  interactive: false, // pointer-light parallax (desktop only)
});
s.setBand(p, {duration})        // number 0..1; duration 0 = immediate (for scrub), else tweens with 'matte'
s.setRadius(pt, {duration})     // tweens --r; fillets scale
s.setTime(t, {duration})        // palette lerp; sun arcs: x = 15%→85%, y from palette; stars fade
s.setWallpaper(id, {transition:'cut'|'slide'|'dissolve'})  // 'slide' = film-strip under a FIXED band (rotation)
s.setDisplays(n, {duration})    // externals slide in from ±110% x with 'cine', 0.9s, stagger .12
s.setBuiltInOnly(bool)          // externals' bands retract to 0 (0.6s matte)
s.setMenuInk(mode|0..1)
s.setNotchRim(v)
s.setCamera({zoom,x,y,rx,ry}, {duration})
s.pulse()                       // the 2-second watch ring from the Notched status icon (one ring, 1.1s, scale 1→6, opacity .6→0)
s.process(kind='photo'|'dynamic') // returns Promise: shows a 1px progress shimmer in the band slot for 700ms (photo) / 1400ms (dynamic); popover uses it
s.state                          // read-only snapshot
s.on('change', fn)               // emits after any setter
s.timeline()                     // a paused gsap timeline proxy whose tweens target s's CSS vars (for section scrubs)
s.destroy()
```
- **Implementation rule:** every setter writes CSS custom properties on `.screen` (`--band`, `--r`, `--sky-top`, …). It never rebuilds DOM. The SVG reads them through `style="stop-color: var(--sky-top)"`. Scrubbing a setter is therefore one `style.setProperty` per frame.
- `s.timeline()` exposes `s.vars` (a plain object). Sections do `tl.to(s.vars, {band:1, onUpdate: s.flush})` or use the setters with `duration:0` inside `onUpdate`. Provide both.

### 3.3 Wallpaper (`wallpaper.js`)
- An SVG with `viewBox 0 0 1600 1000`, `preserveAspectRatio="xMidYMid slice"`. Layers, back to front:
  1. Sky `linearGradient` (skyTop to skyBottom).
  2. Sun or moon: a circle r 46 plus a radial bloom r 260 at opacity .35.
  3. Stars: 60 deterministic 1–1.6 px dots seeded by id, opacity `--stars`. Twinkle 3 random dots at a time, 2.4 s, only while visible and not reduced.
  4. `hillBack`: hills.svg path 1, scaled to 1600 wide.
  5. `hillFront`: path 2.
- Day uses the icon's white overlays: rgba(255,255,255,.28) and .22 over the gradient.
- The other three wallpapers reuse the system with different path pairs, all drawn by us:
  - `dunes`: long low sines.
  - `tide`: one hill and a flat horizon line.
  - `ridge`: sharper peaks.
- Pointer light (`interactive`): pointer x/y moves the sun ±2% and hillBack ±0.6% and hillFront ±1.2% (parallax), with `gsap.quickTo` duration .8, cine. Desktop only, never under reduced motion.

### 3.4 Exactness details
- **Band spreads from the notch.** The band clip uses `inset(0 L 0 R)` where `L = R = (1 - band) * (50% - notchW/2)`. At `band = 0` the band is exactly the notch's footprint (invisible), and at 1 it spans edge to edge.
- **Menu ink is exact per letter.** `.menubar__lit` gets the same `clip-path` as the band, so each glyph turns white exactly where the black has reached it, mid-letter if needed. `menuInk: 'auto'` is the default and is what the app really does. When the band is off, menu text is dark on light skies and white at night (macOS adapts to wallpaper brightness). Compute this from the palette's skyTop luminance: if L < .35, the dark layer becomes white too.
- **Fillets.** They are quarter-circle "anti-corners" of radius `--r` (CSS px = pt × screen scale, where scale = glass width / 1512). They sit directly under the band's left and right ends. They scale in from 0 with `matte` 0.5 s once `band ≥ .98` and leave before the band retracts.
- **Notch.** It is pure `#000`, the same as the band. Its only visible edge is `.notch__rim`. `--notch-rim` defaults to `1 - band`, so with the band complete the notch is literally indistinguishable. That is the product truth rendered.

### 3.5 The menu-bar window (`popover.js`, `createPopover(host, screen)`)
A faithful HTML/CSS recreation of `SettingsView.swift`, measured from `site/assets/popover-light.png` and `popover-dark.png` (2x renders, 680×1182 → 340×591 pt).
- Container: 340px wide (scales with `transform: scale()` down to fit 100vw − 32px on phones), padding 20 top / 18 sides / 18 bottom, radius 11, background `--pv-bg-*` at .92 with `backdrop-filter: blur(30px) saturate(1.6)`, 0.5px border rgba(255,255,255,.12) dark / rgba(0,0,0,.1) light, shadow `0 18px 50px rgba(0,0,0,.55)`.
- **Appearance:** dark by default, because the page is dark. A real `@media (prefers-color-scheme: light)` swaps to light: the real app follows the system, and so does ours.
- Rows, in exact order with verbatim strings:
  1. Header: "Notched" (system 15px/600 = title3 semibold) on the left. On the right, a `<button role="switch" aria-checked aria-label="Hide the notch">` 38×22, accent fill when on, white knob 20 px, knob slides 16 px in 240 ms `--e-out`.
  2. Screen preview: a `createScreen` instance in mini mode (no menubar text, no spill), width 304, aspect from the host screen (16:10), radius 8, 0.5 px separator border, and the notch drawn on top (bottom radii 3).
  3. Status line (13px, secondary), `aria-live="polite"`. The strings are verbatim:
     - "Turn on to blacken the menu bar so the notch blends in."
     - "Processing wallpaper…"
     - "Processing dynamic wallpaper… this takes a few seconds."
     - "Notch hidden. New wallpapers are handled automatically."
     - "Wallpaper restored. Other Spaces get theirs back when you visit them."
  4. Divider.
  5. Checkbox "Use dynamic wallpapers" (on) with caption (11px secondary) "Keeps time- and appearance-based wallpapers changing. Takes longer to process."
  6. Checkbox "Round corners" (on) with a segmented `role="radiogroup"`: Small | Medium | Large (Medium selected). The selected pill is accent with white text. It is disabled (opacity .4) when Round corners is off.
  7. Checkbox "Built-in display only" (off).
  8. Checkbox "Rotate wallpapers" (off) with caption "macOS can't shuffle under the black bar, so Notched rotates your pictures itself." When on, a row expands (height auto via grid-template-rows 0fr→1fr, 240 ms):
     - Button "Choose Folder…". In the demo it picks a built-in sample deck, and the label becomes "Sample wallpapers". No file picker.
     - Picker `<select>`: 5 min / 15 min / 30 min / Hourly (default) / Daily.
     - "Next", disabled until a folder is chosen and the switch is on (the Swift rule).
  9. Divider.
  10. "Start at login" (on).
  11. "Hide menu bar icon" (off) with caption "Open Notched again to bring it back."
  12. Divider.
  13. Footer: button "Check for Updates…", `<span data-version>v1.0.2</span>` (tertiary), button "Quit".
- Checkboxes are real `<input type=checkbox>`: 14 px, radius 3.5, accent fill and white tick when checked. Focus-visible gives a 3px `--signal` ring, offset 2. Row height is 22 pt and the gaps (8 / 12 pt) are measured from the PNG.
- **Behaviour (demo truth, mirrors the app):**
  - **Switch on:** status → "Processing wallpaper…" (or the dynamic string if Use dynamic wallpapers is on and the wallpaper is dynamic). Then `screen.process()`, then `screen.setBand(1, {duration: .9})` (`matte`, spreading from the notch), menu ink flips, fillets drip in, rim fades, and status → "Notch hidden. New wallpapers are handled automatically."
  - **Switch off:** fillets out (.25 s), band retracts into the notch (.7 s `dissolve`), status → "Wallpaper restored. Other Spaces get theirs back when you visit them."
  - **Use dynamic wallpapers:** when on, the demo screen's time-of-day slowly cycles (one full day per 40 s, paused offscreen). When off, the time freezes.
  - **Round corners / segmented:** `setRadius(0|10|14|20)` over 0.45 s.
  - **Built-in display only:** `setBuiltInOnly`. The demo stage has a second display, so the effect is visible.
  - **Rotate wallpapers / Next:** `setWallpaper(next, {transition:'slide'})`. The band stays put while the picture slides underneath.
  - **Hide menu bar icon:** the Notched glyph in the host screen's menu bar shrinks out (scale 0, .3 s). The popover stays open (it's a demo), and the caption is visible.
  - **Start at login:** visual state only.
  - **Check for Updates…:** smooth-scrolls to `#download`. That's the latest version, and this is the honest equivalent.
  - **Quit:** the popover collapses into the menu-bar Notched icon (scale .2 → 0 toward the icon, 0.35 s). Clicking the icon in the screen's menu bar reopens it, the same as in the app's menu bar. Quitting does not change the band.
- **Ghost hand:**
  - Trigger: 4 s idle after the popover is ≥ 60 % in view, the first time only.
  - A small drawn arrow cursor (SVG, our own) travels to the switch over 0.9 s `cine`, presses it (scale .9), and the band runs. 1.2 s later it moves to "Large" and clicks it, then fades.
  - Any real pointer, keyboard or touch input cancels it permanently (sessionStorage flag).
  - Never under reduced motion.
- **Keyboard:** Tab order follows the visual order. Space toggles switch and checkboxes. Arrow keys move within the segmented group. Esc on the popover = Quit behaviour. Clicking the menu-bar icon with Enter or Space reopens it.

---

## 4. Global elements

### 4.1 Intro: "Power on" (≤ 1.1 s, never blocks)
The HTML paints the hero at full state. The intro is a CSS-class sequence on `<html class="intro">`, removed at 1.1 s or on first input, whichever comes first.
1. **0–220 ms.** The page is black. One 1px `--paper` hairline grows from the notch's x position outward to both screen edges (scaleX 0→1, `matte`). It is the top edge of the screen getting power.
2. **180–750 ms.** The wallpaper fades up from black like a projector lamp warming: `opacity 0→1` and `filter: brightness(.2)→1` on `.screen__glass`. The spill blooms in behind, 300 ms later.
3. **500–900 ms.** Menu bar items fade in left→right (stagger 25 ms). The clock's ScrambleText resolves to the real time.
4. **650–1100 ms.** H1 lines rise from masks (yPercent 105→0, `cine`, stagger .08). Lede, CTAs and chips follow (opacity and 12px y).

The intro is skipped entirely when reduced motion is on, on `sessionStorage['notched:seen']`, or when `location.hash` is set. No loader and no percent counter.

### 4.2 Nav = the menu bar
- **In the hero,** the hero screen's `.menubar` holds the real nav links:
  - Left: `● Notched` (scrolls to top), then "How it works" (`#how`), "Features" (`#features`), "Try it" (`#demo`), "FAQ" (`#faq`). These are the "app menus", in the menu bar's text style (13px Archivo 560).
  - Right: the Notched status glyph (opens a tiny dropdown with "Download for Mac" (`data-cta="mac"`) and "Source on GitHub"), and the clock.
- **On leaving the hero** (hero bottom crosses viewport top + 10vh), a fixed `.sitebar` takes over. It is a clone with the same items, full width, height 40 px, background `#000`, white text, and a centred 180×28 notch shape in `#000` hanging from the top edge (invisible, as it should be). It enters by the band spreading out from the centre: clip-path inset from 50% → 0, 0.6 s `matte`. Leaving the hero upward reverses it.
- **On the right of the sitebar:**
  - A mono scene readout `SC.03 / 07` that changes per section with `counter()`.
  - A compact "Download" pill (paper bg, black text, 30 px tall), `data-cta="mac"`. On phones/tablets its label is "Get it".
- **Mobile (<900 px):** the sitebar shows `● Notched`, the scene readout and the Download pill. The links go into a "Menu" text button that drops a black sheet from the bar (clip-path inset bottom 100%→0, 0.45 s matte) listing the links at `--t-h3`.
- A skip link "Skip to content" is the first focusable element and becomes visible on focus.

### 4.3 Claude Meter pill (cross-promo)
- Fixed bottom-right, 16 px from the edges.
- Glass: `rgba(20,20,22,.55)`, `backdrop-filter: blur(20px)`, 1px `--line-2`, radius pill, height 40.
- Content: `site/assets/claude-meter.png` at 20 px rotated −6°, then the text "Claude Meter ↗". Its title attribute and aria-label read "Claude Meter: puts your Claude usage limits right in the MacBook notch". It links to `https://claudemeter.vercel.app/?ref=notched` in a new tab with `rel="noopener"`.
- It appears after the hero (y 20 → 0, 0.6 s `cine`), and hides while the finale section is ≥ 50 % in view (the finale has its own link).
- Dismiss "×" (sessionStorage).

### 4.4 Cursor
No custom cursor and no blob. Interactivity lives *inside* the product: pointer light on wallpapers, and the hover states listed per section. Buttons get a `--signal` focus ring and a hover shift (paper → #FFFFFF, plus a 1px inner highlight).

### 4.5 Grain, colour scheme
- The grain is described in 1.4.
- The site is dark only (`color-scheme: dark`, body `#000`). Only the popover follows the OS appearance.

### 4.6 Footer (inside `download`, owned by that builder)
- Left: "Notched" in mono, `<span data-version>v1.0.2</span>`, "MIT licence"→"MIT license" (US spelling, linked to GitHub LICENSE).
- Middle: "Source on GitHub" (GitHub glyph allowed), "llms.txt".
- Right: "Not affiliated with Apple." and "© 2026 Yiftach Freeman".
- Hairline top, 13px, `--mute`.

### 4.7 The download ask: "the band drops a panel" (client decision; FACTS "Download email ask" is law)
Every `[data-cta="mac"]` (hero, sitebar pill, status dropdown, finale) is an `<a href="/download">` that `cta.js` intercepts. It opens one native modal `<dialog class="ask">` that **asks for an email**. A valid email starts the DMG at once; the network never holds the download up.

**Shape and motion (Notched's own language: the black band grows a panel out of the notch).**
- The panel is `#000`, the same black as band and page, hung from the top-centre of the viewport, where the hero notch and the sitebar notch sit. Width `min(440px, 100vw - 32px)`, padding 28 (22 on mobile), bottom radii 22, square top flush with the viewport top. Sides and bottom get a 1px `--line-2` hairline; the top edge has none, so it reads as part of the bar. Two concave **fillets** (radius 14, the product's Medium) sit where the panel meets the top edge, at each upper corner.
- Backdrop: `::backdrop { background: rgba(0,0,0,.55); backdrop-filter: blur(6px) }`. The wallpaper light behind dims like a room when the projector is paused.
- **Open (0.55 s `matte`):** the panel's `clip-path` goes from the notch footprint `inset(0 calc(50% - 90px) calc(100% - 28px) calc(50% - 90px) round 0 0 10px 10px)` to `inset(0 round 0 0 22px 22px)`. Contents fade and rise 8px, starting at 0.25 s (stagger .04). The fillets scale in last (0.2 s).
- **Close (0.4 s `dissolve`):** the reverse. The panel shrinks back into the notch, then `dialog.close()`.
- **Reduced motion:** opacity 0→1 in 160 ms, no clip.

**Views and exact copy** (US spelling; `·` separators in mono):
1. **Mac (desktop):**
   - Kicker (mono, `--mute`): `DOWNLOAD · v1.0.2` (`data-version`)
   - Title (`--t-h3`+6px, Archivo 720 wdth 108): **"Where should updates go?"**
   - Lede: "Leave your email and the download starts right away."
   - Field: label "Email", `type=email required autocomplete=email inputmode=email autocapitalize=off spellcheck=false`, placeholder `you@example.com`. Style: 52px tall, `--ink-1` fill, 1px `--line-2` border, radius 12, 17px `--paper` text. Focus: 2px `--signal` ring.
   - Button: paper pill, 52px, **"Download for Mac"**, with the drawn ↓ glyph. Meta under it (mono): `Free · macOS 14+ · Apple silicon`
   - Fine print (13px `--mute`): "Used only for Notched updates. Kept in the maker's Google Sheet, never shared or sold."
   - Errors (inline, `--paper` on a 2px `#FF6B5A` left rule, never colour alone): blank → "Add your email and the download starts." Invalid → "That email doesn't look right. Check it and try again." No download in either case.
2. **Mac done:**
   - Kicker: a 16px ring that DrawSVGs into a `--signal` check (0.5 s), then `NOTCHED · v1.0.2`
   - Title: **"On its way."**
   - Lede: "Open the disk image and drag Notched to Applications. On first launch, agree to the license, click the menu bar icon and flip the switch."
   - Fine: "Didn't start? <a href="/download" download>Download again</a>" · "<button>Use a different email</button>" (clears the stored email, shows view 1).
   - Links: "Source on GitHub" (GitHub glyph). Button **"Done"** (ghost pill) closes.
3. **Away (phones/tablets, `noMac()` as in the Claude Meter `cta.js`):** the CTA label becomes **"Get it on your Mac"** everywhere.
   - Kicker: `MAC APP · v1.0.2`
   - Title: **"Get it on your Mac."**
   - Lede: "Notched installs on a Mac, not this phone. Send yourself the link and open it there." ("tablet" on iPad/Android tablets.)
   - Field: label "Email · optional, for updates" (not required). Blank is fine; an invalid non-blank value shows the invalid error.
   - Button: **"Send the link to my Mac"**, using `navigator.share({title:'Notched', text:'Notched for Mac', url:'https://notched.vercel.app/'})`, else `navigator.clipboard.writeText(url)`. A share cancelled by the user (AbortError) is not an error.
   - Same fine print.
4. **Away done:** kicker `Link copied` / `Shared` / `Email saved`. Title **"Open it on your Mac."** Lede: "On your Mac, go to **notched.vercel.app** and download it there." Button "Send it again", plus "Done".

**Behaviour (`signup.js`):**
- Submit (Mac): `email = value.trim()`. If it fails `/^[^@\s]+@[^@\s]+\.[^@\s]+$/` → error. If it passes → in the **same click task**:
  1. `post({type:'mac', email})`
  2. Start the download: a temporary `<a href="/download" download>` `.click()`
  3. `localStorage['notched:email'] = email` (try/catch)
  4. Swap to the done view.
- `post(fields)`: `fetch(meta[name=nt-signup].content, {method:'POST', mode:'no-cors', keepalive:true, body:new URLSearchParams({...fields, name:'', platform: navigator.userAgentData?.platform || navigator.platform, ref:'notched' + (document.referrer ? ' · ' + document.referrer : ''), company: form.nt_hp.value})}).catch(()=>{})`. Never awaited.
- Honeypot: `<div class="ask__hp" aria-hidden="true" inert><label>Leave this empty <input name="nt_hp" tabindex="-1" autocomplete="off"></label></div>`, visually hidden. Never name it `company`.
- **Returning visitor** (`notched:email` present, desktop): the CTA downloads at once and opens straight to the done view. No form.
- Away submit: if a valid email was given, `post({type:'mac', email})` and store it; then share/copy; then the away-done view.
- Esc, the backdrop and "Done" close it. Focus returns to the opener. While a dialog is open the sitebar stays visible above the backdrop (z-index), so the panel visibly hangs from its notch.
- **Hero tie-in (desktop, motion allowed):** opening while the hero is in view first runs `heroScreen.setBand(1, {duration:.35})`, so the panel always drops out of a black band. On close the band returns to its scroll-scrubbed value.
- QA must check: no `fetch` before submit; the download fires even with the endpoint blocked (DevTools request blocking); 320px with no overflow and the keyboard open; tab order and focus return.

---

## 5. Sections

Section ids (= file names): `hero`, `manifesto`, `demo`, `features`, `how`, `faq`, `download`. Each builder owns `web/sections/<id>.html`, `site/css/<id>.css` and `site/js/<id>.js`, and exports `init(sectionEl)`.

### SC.01: `hero` ("Black out the notch.")
**Layout (desktop ≥900):**
- `section#hero`, height 220vh. Inside it, `.hero__stage` is sticky at top:0, 100vh tall.
- The living screen is **full-bleed and cropped**:
  - The bezel's top edge is the top of the viewport and its side edges sit 2vw outside the viewport. You see the top ~62% of a big display, with the notch top-centre touching the viewport top.
  - The wallpaper fills the stage. The spill bleeds past the bottom edge onto black.
- The copy sits **on the wallpaper**, left-aligned in the lower-left third (gutter 6vw, bottom 12vh), white text with a `0 2px 30px rgba(0,0,0,.25)` shadow for AA on day skies. A scrim: `linear-gradient(to top, rgba(0,0,0,.45), transparent 55%)` on the glass.
  - Slate (mono): `SC.01 — THE NOTCH`
  - H1 (two lines): **"Black out / the notch."**
  - Lede (max 34ch): "Notched turns your menu bar black, so the notch sinks into the bezel and your screen looks whole again."
  - CTAs:
    - [**Download for Mac**] → `<a href="/download" data-cta="mac">`, opens the email ask (§4.7). Paper pill, black text, 52 px tall, with a drawn ↓ glyph that nudges 2px on hover.
    - [Try the switch] → `#demo`. Ghost pill, 1px `--line-2`, white text.
  - Chips (mono, `--mute`, separated by ·): "Free · Open source (MIT) · macOS 14+ · Apple silicon · v1.0.2"

**Animation (scrubbed, ScrollTrigger on `#hero`, start `top top`, end `bottom bottom`, scrub .8):**
| Progress | What happens |
|---|---|
| 0 → .10 | Nothing moves; it is the held establishing shot. Pointer light is live. Text is readable. |
| .10 → .55 | `setBand(0→1)`. The black spreads out from the notch, the menu items flip white per letter as it passes, and `--notch-rim` goes 1→0. Camera: `zoom 1.12 → 1.0, y 4% → 0` (a slow dolly back, `dolly`). |
| .40 → .60 | The H1 word **"notch."** is swallowed. SplitText chars of "notch." travel toward the notch's screen position (Flip-free: compute the delta once on refresh), each with wdth 112→62, scaleY .2, opacity 0 (`dissolve`, stagger .03 from the centre). It goes into the notch, and at that moment the notch rim is gone. The H1 now reads "Black out / the" plus an empty black **notch-shaped bar** (a 0.12em-tall black rounded rect, the same black, where the word was), which is a small visual pun that stays. |
| .55 → .70 | Fillets drip in (`setRadius(0→14)`). A mono readout fades in under the screen's top-left: `MENU BAR — BLACK · TEXT — WHITE · NOTCH — ` with the last value scrambled to `GONE`. |
| .70 → 1 | Camera keeps pulling back: `zoom → .86`, `y → -6%`. The full top edge of the display with its outer bezel corners comes into view on black. The copy block fades 1→0 and moves y −40px. The spill dims to .25. This hands off to the manifesto. |

- **Hero menu bar:** on `band ≥ .98` it is the nav (4.2). The sitebar takes over at the end.
- **Mobile (<900):** a different composition, not a squeezed one.
  - Height 180vh. Sticky stage, 100svh.
  - The screen is cropped to the **notch region only**: the glass scaled ×2.4 around the notch, so you see the notch, about 30 % of the menu bar either side and the sky. The menu bar has only the clock and the Notched glyph (no app menus).
  - The copy sits below the screen crop on black (the screen takes the top 46svh), with the H1 at clamp 48px.
  - The same scrub: band spreads, "notch." swallowed. No camera pull-back beyond zoom 1.1→1.
  - CTA: on phones/tablets `cta.js` relabels the primary button **"Get it on your Mac"** and it opens the away dialog (§4.7). A mono line below reads "It's a Mac app. Send yourself the link."
- **Reduced motion:** height 100vh, no sticky.
  - The screen is shown band **on** (the finished state), radius 14, time 'now', notch gone. The H1 is fully visible as "Black out the notch." (no swallow).
  - A single **"Show the notch"** text toggle under the chips flips the band instantly. All states are still reachable.
- **Static frame test:** the frame at progress 0 and the frame at progress 1 must both look like finished posters.

### SC.02: `manifesto` ("Lights down.")
**Layout:**
- `section#manifesto`, 260vh, with a sticky 100vh stage on `#000`.
- Centre column, max 22ch at `--t-h2` (desktop) / `--t-h3`+4px (mobile). Left-aligned, offset to the 2nd grid column.
- Behind the text, a **dim, wide crop of the living screen**: a `createScreen` instance at opacity .22 with time = dusk and band on. It is the room seen in the dark, from the hero's last camera position.
- **Letterbox mattes:** two `#000` bars (top and bottom) `scaleY` from 0 to 12.5vh each. The screen behind becomes a 2.39:1 frame. The film is starting.

**Copy:** each line is its own `<p>`, inked word by word.
> Look at the top of your screen.
> There's a black notch cut into a bright menu bar.
> It's the boom mic hanging into the shot.
> Notched doesn't move the mic. It lowers the matte:
> a black strip, exactly as tall as the menu bar,
> baked into a copy of your wallpaper.
> Now the notch has nothing to stand out against.

Then the closing card, at `--t-title` scale, wdth 125, centred in the letterbox frame: **"Lights down."**

**Animation:**
- `ink()` over 0→.75 of the section (scrub .4). Words go `--dim` → `--paper`, and the current line gets a subtle +4px x settle.
- The mattes close 0→.3.
- At .78→.92 the paragraph lines fade to .0 (y −20) in `dissolve` while "Lights down." rises out of masks (chars stagger .02, `cine`).
- At .92→1 the letterbox mattes open again (scaleY → 0) and the background screen brightens .22→.6. That hands off to the demo, whose screen it is.
- **Mobile:** same, 220vh, 17px+ type, mattes 9svh.
- **Reduced motion:** no sticky. All lines are in `--paper`, no mattes, "Lights down." static below the paragraph.

### SC.03: `demo` ("Go on, flip it.")
**Layout (desktop):**
- `section#demo`, normal flow (no pin), min-height 100vh, padding standard.
- A 12-col grid:
  - Left (cols 1–8): a **complete display** (16:10, the whole glass visible with all four bezel corners), with `interactive: true`, radius 14 on, band **off** at start, time 'now', wallpaper 'hills'. A thin second **external display** sits partly off the left edge (displays: 2, the external at 40 % scale, behind and blurred 0) so "Built-in display only" has something to act on.
  - Right (cols 9–12): the popover, positioned as if dropped from the screen's menu-bar Notched icon. A 1px hairline "tether" connects the icon to the popover top: a DrawSVG line that draws in on enter.
- Head above the grid:
  - Slate: `SC.03 — TAKE THE CONTROLS`
  - H2: **"Go on, flip it."**
  - Lede: "This is Notched's real menu-bar window, rebuilt for the browser. Every control works, and the screen on the left does what your Mac would."
  - Caption under the popover (mono, `--mute`, with a small drawn hand glyph): "Psst. The switch at the top."

**Animation:**
- On enter (top 70%): the display rises y 60→0 and opacity 0→1 (`cine` 1.2 s). The popover scales .96→1 from its top-right origin, opacity 0→1 (0.5 s, 0.35 s delay). The tether draws.
- Everything else is driven by the popover's behaviour (§3.5). Idle ghost hand after 4 s.
- **Camera reacts to the controls.** On switch-on the display does a tiny 0.6 s push-in (zoom 1→1.025→1 toward the notch, `cine`). On radius change, a 0.5 s focus pull: a 2px blur on everything but the top-left corner, then back.
- **Mobile:** the display (the full screen at 100% width) goes on top. The popover sits below it as a sheet: full width minus 32px, scaled to fit, no tether. The external display is hidden, and "Built-in display only" still works with a mono note under the screen: "(No external display here. On your Mac, they get their own band.)"
- **Reduced motion:** no enter animation, no ghost, and band and radius changes apply instantly (duration 0). The status line still updates.

### SC.04: `features` ("Everything it does, nothing it doesn't.")
**Layout (desktop):**
- `section#features`. Two columns:
  - Left column (cols 1–5): six chapters, each `min-height: 85vh`, content vertically centred.
  - Right column (cols 6–12): `position: sticky; top: 10vh; height: 80vh` with a stage holding **one** living screen (with up to 3 displays), plus a mono readout plate bottom-left of the stage.
- Head (above the columns):
  - Slate: `SC.04 — COVERAGE`
  - H2: **"Everything it does. Nothing it doesn't."**
- A left rail beside the chapter text shows the active chapter: a 2px `--signal` bar that slides between items (0.5 s `cine`). Inactive chapters sit at opacity .32 and the active one at 1.
- Each chapter title is also a `<button>`. Clicking it scrolls to that chapter (`scrollIntoView({block:'center'})`) and plays its state change at 1× speed, so it works without scrubbing.
- Each chapter's ScrollTrigger (start `top center`, end `bottom center`, scrub .8) drives the shared screen. States must be **absolute**, not relative (each chapter sets every prop it cares about), so jumping works.

| # | Chapter title (h3) | Body (exact) | Stage behaviour (scrubbed across the chapter) | Readout (mono) |
|---|---|---|---|---|
| 1 | **Dynamic wallpapers keep moving.** | "Time-of-day and light/dark wallpapers keep every frame and their own schedule, so your desktop still drifts from morning to night. The first pass takes a few seconds." | `setTime(0 → .95)`: dawn → day → dusk → night. The sun arcs and sets, the moon and stars come up. The band holds at 1 the whole time and the notch never reappears. Camera: zoom 1. | A clock readout `06:00 → 21:48`, mapped from t, rendered with `counter()` every 15 min of fake time. |
| 2 | **Every display. Every Space.** | "Each screen gets its own copy at its own resolution. Other Spaces are fixed up when you visit them. Prefer just the laptop? Tick Built-in display only." | 0–.5: `setDisplays(1→3)`. The camera pulls back (zoom 1→.62) as two externals slide in from both sides, each landing with its own band spreading out from its centre (externals have no notch; they spread from the middle). .55–.9: a mini checkbox chip on the stage, "☐ Built-in display only", ticks itself (it's a real checkbox; clicking it does the same), and the externals' bands retract. At .9–1 they return. | `DISPLAYS 1 → 2 → 3` / `BUILT-IN ONLY: OFF → ON → OFF` |
| 3 | **Rounded corners, if you like.** | "Concave fillets under each end of the band, so the desktop reads like a rounded screen. Small, Medium or Large. On by default, at Medium." | The camera pushes in hard on the left end of the band (zoom 1→3.2, x/y to the fillet, `dolly`). The radius steps 0 → 10 → 14 → 20 in thirds. A dimension line is DrawSVG-drawn on the arc (a thin `--signal` quarter-arc with tick marks). | `RADIUS — 10 PT / SMALL` → `14 PT / MEDIUM` → `20 PT / LARGE` |
| 4 | **It keeps watch.** | "Notched checks your wallpaper every two seconds. Change it and the bar is back within about two." | Camera returns to zoom 1. At .2 the wallpaper **cuts** to `dunes`: the new one has *no band* (simulate: band 0, the notch rim back at 1, the notch visible, menu text dark). At .35, `pulse()` from the Notched glyph. At .45, `process()` shimmer. At .55, the band spreads again (scrub). A second cycle at .65–.9 with `tide`. | `CHECK EVERY 2 S` and a live dot that blinks once per real 2 s while the chapter is active |
| 5 | **Shuffle, under the bar.** | "macOS can't shuffle wallpapers under a black bar, so Notched rotates a folder itself: every 5 minutes, 15, 30, hourly or daily, or right now with Next. Already shuffling in System Settings? Notched takes that folder over." | A **film strip**: 4 wallpapers (hills, dunes, tide, ridge) side by side slide horizontally *beneath a fixed band* (the band and notch do not move, which is the point). The strip's x is scrubbed −0 → −300% with slight motion blur (filter blur(2px) only while velocity > threshold; skip on mobile). | `EVERY 5 MIN · 15 MIN · 30 MIN · HOURLY · DAILY`, with the active one highlighted, stepping with the strip |
| 6 | **Off means off.** | "Switch Notched off and your own wallpaper comes back. Other Spaces get theirs back the next time you visit them while Notched is running. Your original files are never edited." | `setBand(1→0)` with `dissolve`. The fillets go first, then the band retracts **into** the notch, the menu text flips back to dark, and the notch rim returns. The notch is visible again, exactly as you started. Camera: a slight push to the notch (zoom 1→1.15). | `ORIGINAL — RESTORED` |

- Small print under chapter 6 (`--mute`, 14px): "Aerial, color and other live wallpapers are drawn by macOS, so Notched leaves them alone. Placement (fill, fit, stretch or center) stays exactly as you set it."
- **Mobile:** no sticky split.
  - Each chapter is a card: a small screen crop (its own `createScreen` instance at 100% width, 16:10, lazy-created on approach and destroyed when ≥ 2 viewports away), then the title, body and readout.
  - Each card's ScrollTrigger scrubs its own screen across the card's travel through the viewport (start `top 85%`, end `bottom 40%`).
  - Chapter 2 on mobile: displays shown as 3 small screens in a row inside the card (`displays:3`, zoom .62).
  - Chapter 3: zoom 2.4.
  - Chapter 5: the film strip as above.
- **Reduced motion:** cards (as on mobile) on all widths. Each screen is shown in that chapter's *end* state.
  - The time chapter shows night with a row of four tiny static swatches (dawn, day, dusk, night).
  - The radius chapter shows 3 mini fillets side by side labelled 10 / 14 / 20 pt.
  - The rotation chapter shows the 4 wallpapers as a static strip under one band.

### SC.05: `how` ("It's just a picture.")
**Layout (desktop):**
- `section#how`, 240vh, sticky stage 100vh.
- Centre: an **exploded view** of four stacked planes in CSS 3D (perspective 1600px, `transform-style: preserve-3d`). Each plane is 16:10, 46vw wide:
  1. **Original wallpaper**: a `wallpaper.js` SVG (hills, day), with a small mono tag `ORIGINAL — UNTOUCHED`.
  2. **The copy**: the same picture with a 1px dashed `--line-2` outline and the tag `COPY — ~/Library/Application Support/Notched`.
  3. **The strip**: a black band at menu-bar height with its fillets, on a transparent plane. Tag: `BLACK STRIP — MENU-BAR HEIGHT`.
  4. **Desktop**: the composite with a menu bar (white text) and notch. Tag: `SET AS DESKTOP PICTURE`.
- Leader lines from each tag to its plane are drawn with DrawSVG.
- Left copy column (max 40ch):
  - Slate: `SC.05 — BEHIND THE SCENES`
  - H2: **"It's just a picture."**
  - Body: "No hacks, no patched system files, no window floating over your menu bar. Notched saves a copy of your wallpaper with a black strip the exact height of the menu bar, then sets that copy as your desktop picture. macOS sees a dark top edge and turns the menu bar text white. The notch is black and so is everything around it."
- A **privacy plate** below that copy: a ruled, bordered box (1px `--line`, radius `--r-card`, padding 28).
  - Mono title: `NETWORK`
  - Big: **"One request a day."**
  - Small: "A daily update check against notched.vercel.app. No analytics. No account. Your original wallpaper files are never modified."
  - Smaller (`--mute`, 14px): "This website asks for your email before the download, only to send you Notched updates. The app itself collects nothing."
  - Mono row: `Signed with Developer ID · Notarized by Apple · Sparkle updates, EdDSA-signed`

**Animation (scrub .8 over the section):**
| Progress | Camera / planes |
|---|---|
| 0 → .15 | The planes are stacked flat as one composite (the finished desktop), facing the camera. |
| .15 → .55 | The camera **orbits**: the stage goes rotateX 0→58°, rotateZ 0→−32°, scale 1→.82 (`dolly`). The planes separate in z (0, 140, 280, 420 px). Tags and leaders draw in sequence (each .08 of progress). It looks like an exploded technical drawing in a dark room, and each plane's spill lights the one above. |
| .55 → .75 | Hold. The copy column's paragraphs ink in (`ink()`). |
| .75 → 1 | Collapse: z → 0 and the camera orbits back to front (rotate 0). The four planes fuse with a single 120 ms flash of the band (the band plane's opacity 1→.6→1). The privacy plate rises in (y 40→0). |

- **Mobile:** no 3D orbit, because preserve-3d stacks are expensive and cramped. Use a vertical **stack of four planes** (each 100% width, 16:10) with tags, connected by a 1px vertical line that DrawSVGs as you scroll (scrub). Each plane fades and rises in on enter. The copy goes above, the privacy plate below.
- **Reduced motion:** the mobile layout on all widths, static.

### SC.06: `faq` ("Questions from the back row.")
**Layout:**
- `section#faq`, normal flow, max 920px. Slate `SC.06 — Q&A`, H2 **"Questions from the back row."**
- Rows are `<details>` with `<summary>`:
  - Summary at `--t-h3` 560 weight. A hairline between rows.
  - Marker: a drawn mini-band. It is a 14×3 px bar that, on open, spreads from 4px to 14px wide (as if from a notch) and goes from `--mute` to `--signal`, 0.3 s matte.
  - The answer is 17px `--mute`, max 62ch.
  - Open/close animates height using `interpolate-size: allow-keywords` plus a `::details-content` transition, with no-JS-safe fallback (instant). No bounce.
- Questions, **verbatim from the existing FAQPage JSON-LD** (keep that JSON-LD in sync, word for word):
  1. How does Notched work?
  2. How do I turn it off?
  3. Does it work with dynamic wallpapers?
  4. What about Aerials and colour wallpapers?, rendered as "colour" in both the JSON-LD and the page so they match. *(Lead: switch both to "color" if you want US spelling throughout; FACTS says pick US.)*
  5. Can it shuffle my wallpapers?
  6. Does Notched connect to the internet?
- Add two (also add to JSON-LD):
  7. **"Which Macs does it run on?"**: "Macs with Apple silicon running macOS 14 or later. It's built for MacBooks with a notch, and it also works on external displays."
  8. **"Is it really free?"**: "Yes. Notched is free and open source under the MIT license. There's no account. The site asks for an email before the download, only to send you Notched updates. The code is on GitHub."

**Animation:**
- Rows enter: a hairline draws scaleX 0→1 (origin centre, spreading like the band, 0.7 s matte, stagger .06), and the summary text rises 12px. Once, at top 85%.
- **Reduced motion:** none.

### SC.07: `download` ("Fade to black.") with footer
**Layout:**
- `section#download`, 200vh, sticky stage 100vh.
- The stage starts as a mid-sized living screen (band on, time 'now', 60vw) on black, under a slate `SC.07 — FADE TO BLACK`.

**Animation (scrub .6):**
| Progress | What happens |
|---|---|
| 0 → .45 | **The matte comes down.** The screen's band height animates from menu-bar height to the full glass height (a `scaleY` on a dedicated band clone, origin top, `matte`). The wallpaper is eaten top-down by black and the menu text rides down with the band's lower edge, then fades. Simultaneously the bezel and spill fade, so by .45 the whole viewport is uniform `#000`. The product's black has become the page. |
| .40 → .65 | The title card rises out of the black: **"NOTCHED"** at `--t-title`, wdth 125, wght 800, in `--paper`. A real **notch-shaped bite** is cut out of the top-centre of the wordmark (an SVG mask: black rounded-bottom rect, 9% of word width, 22% of cap height). Over .55→.65 the bite **fills in**: the mask rect fades and the letters under it are restored. Even the logo loses its notch. |
| .60 → .80 | CTA block fades and rises in under the wordmark. |
| .80 → 1 | Hold (the section ends naturally into the footer). |

- **CTA block (centred):**
  - Primary: **"Download for Mac"** → `<a href="/download" data-cta="mac">` (§4.7). Paper pill, 60px tall, black text. On hover, the band shimmer: a 1px white highlight that sweeps left→right once, 0.6 s.
  - Line (mono `--mute`): "Free · No account · v1.0.2 · macOS 14+ · Apple silicon"
  - Secondary links (16px, underline on hover):
    - "Source on GitHub" (GitHub glyph) → `https://github.com/FreemanGT/notched`
    - "Signed with Developer ID and notarized. When an update is ready, the menu bar icon tells you."
  - A small card below, the maker's other thing: a `claude-meter.png` 28px icon, then the text "Also by Yiftach: **Claude Meter** puts your Claude usage limits right in the MacBook notch. ↗" → `https://claudemeter.vercel.app/?ref=notched`.
- Footer follows (§4.6).
- **Mobile:** 160vh. The same matte. The wordmark at 15vw. The CTA reads "Get it on your Mac" (away dialog, §4.7).
- **Reduced motion:** no sticky and no matte. Black section, wordmark without the bite (the end state), CTA visible.

---

## 6. Copy rules (all builders)
- US spelling in our copy ("color", "license"). Product UI strings stay verbatim.
- Short sentences, a little wry, no adjectives stacked. Banned words: "seamless(ly)", "effortless", "elevate", "unleash", "game-changer", "magic(al)", "revolutionary", "beautifully", "just works", "pixel-perfect" in copy, and "Say goodbye to". No em-dash chains. No rhetorical triads.
- Numbers only from FACTS: 2 s, 10/14/20 pt, 5 min/15 min/30 min/hourly/daily, v1.0.2, macOS 14. No user counts, stars, press, testimonials or awards.
- "MacBook", "macOS" and "Mac" are descriptive only. Never draw an Apple logo, not even a silhouette. The menu bar's first item is a dot.

## 7. SEO / meta (architect, in template)
- `<title>Notched: hide the MacBook notch. Free Mac app</title>`
- Meta description: "Notched turns your menu bar black so the MacBook notch disappears into the bezel. Free and open source. Keeps dynamic wallpapers moving and works on every display and Space. macOS 14+, Apple silicon."
- `<meta name="nt-signup" content="https://script.google.com/macros/s/AKfycbyYJTV8Mm_N77moH5FPesW6b_7Khdt2XHBn9IvVHSbHGw43RxAkXjgibvvWu-QkzNuMRA/exec">` (exact, from FACTS).
- Canonical `https://notched.vercel.app/`. OG and Twitter image `/assets/og.png` 1200×630, rendered from `web/og.html`.
  - The OG composition is a full-bleed screen top on black, band on, a dusk palette, and "Black out the notch." in Archivo 780 wdth 112 with the slate `NOTCHED — FREE FOR MAC` in Martian Mono.
  - Render it with headless Chrome: `--screenshot --window-size=1200,630`.
- JSON-LD: SoftwareApplication (`softwareVersion` "1.0.2", the pattern exact for release.sh) and FAQPage (8 Qs, matching the page text).
- Keep `site/vercel.json`, `downloads/`, `llms.txt`, `robots.txt` and `sitemap.xml` untouched. Delete `style.css`, `demo.js` and `og.html` from `site/` once replaced.
- Real text in the HTML for every section. JS only enhances, so a bot or no-JS visitor reads the whole page, and the hero ships a static finished frame (band on).

## 8. Accessibility
- `prefers-reduced-motion`: the paths are specified per section. Globally that means no scrub, no sticky story stages, no ghost hand, no grain jitter, no intro, and setters with duration 0.
- Focus-visible everywhere: a 2px `--signal` ring with 3px offset. On the paper CTA use a 2px `#000` inner plus a `--signal` outer ring.
- AA contrast:
  - Hero text over wallpaper always has the scrim plus text-shadow. Verify on the day palette (#6BE3D0 bottom), which is the lightest case.
  - `--mute` on `#000` is 7.5:1.
  - `--dim` is decorative only, and ink reaches `--paper`.
- The living screens are `role="img"` with a live `aria-label` that the component updates, e.g. "Screen preview: menu bar black, notch hidden, medium corners, dusk". The popover is a real form with labels. The status line is `aria-live`.
- Chapter buttons give keyboard and switch-access users every scroll-driven state.
- No horizontal overflow at 320px: the screens are cropped inside `overflow: clip` stages, and bezels extend past the viewport only inside `clip` containers.
- The download dialog is a native modal `<dialog>`: page inert, Esc and backdrop close it, focus goes to the email field on fine pointers (title on touch), and returns to the opening button on close. Errors live in an `aria-live="assertive"` `<p>` tied to the input with `aria-describedby`; `aria-invalid` on error.
- Touch targets ≥ 44px in the sitebar, the popover rows on mobile (rows padded to 44) and the FAQ.

## 9. Performance plan
- **JS budget (gz):**
  - Vendor: gsap ~27 KB, ScrollTrigger ~17, SplitText ~7, CustomEase ~3, DrawSVG ~2, ScrambleText ~3. That is about 60 KB.
  - Our code: target ≤ 45 KB (screen + wallpaper + popover ~20, sections ~25). `signup.js` (~4 KB) is dynamic-`import()`ed on the first `pointerenter`/`focus`/`click` of any `[data-cta]`; `cta.js` (~1 KB) loads with main.
  - Total ≈ 105 KB, well under 350.
- **Fonts** ≤ 160 KB, both preloaded. Use `size-adjust` and metric overrides on the fallback (`Arial` for Archivo, `Menlo` for Martian) to kill CLS.
- **Images:**
  - Only `claude-meter.png`, the icons, `grain.png` and `og.png`.
  - The popover PNGs are reference only. Do not ship them in the page; keep them in `site/assets` for builders to measure.
- **Instances:**
  - Living screens are created lazily (IntersectionObserver, rootMargin 100%) and destroyed when ≥ 2 viewports away on mobile. At most 4 alive at once.
  - Star twinkle and the clock tick pause off-screen.
  - The spill blur is a static `filter` on an element whose size never animates. Animate its opacity only.
- **Layout and stacking:**
  - `content-visibility: auto; contain-intrinsic-size: auto 100vh` on `#faq` and the footer.
  - Sticky stages have fixed heights, which avoids CLS on enter/exit.
  - `will-change: transform` only on the camera wrapper during active scrubs (toggle with ScrollTrigger `onToggle`).
- **Scroll work:**
  - No scroll listeners: everything goes through ScrollTrigger.
  - Pointer light uses `quickTo` and runs only on `(hover:hover)`.
  - No WebGL, no video, no Lottie.
- **Targets:** LCP < 2.0 s (the hero H1 is the LCP element and is text), CLS < 0.02, 60 fps scrubs on an M1 Air, and ≥ 50 fps on a mid Android with 4× CPU throttle. If the frame budget fails on mobile, drop the spill blur first (`@media (max-width:899px) { .screen__spill { display:none } }` is the fallback switch).
- **QA:**
  - Copy `~/.claude/skills/awwwards-site/qa.mjs` into `web/` and adapt the ids to hero/manifesto/demo/features/how/faq/download.
  - Run `timeout 170 node qa.mjs --steps 8` for desktop and mobile separately, plus `--reduced` and `--overflow`.
  - Screenshots go to the scratchpad `qa/<run>/`. Look at the hero at progress 0 / .5 / 1, every features chapter, and the finale at .45.

## 10. Build notes for the architect
- Copy `~/.claude/skills/awwwards-site/build.mjs` → `web/build.mjs`. It stitches `web/index.html` (with `<!-- @section:<id> -->` markers in the order hero, manifesto, demo, features, how, faq, download) with `web/sections/<id>.html` → `site/index.html`.
- CSS load order: `tokens.css`, `base.css`, `components.css` (screen + popover + sitebar + pill), then `<id>.css` ×7, all `<link>`ed. JS: vendor `defer`, then `js/main.js` `type=module`.
- `web/node_modules` goes in `.gitignore`.
- Shared files the architect owns: `tokens.css`, `base.css`, `components.css`, `js/main.js`, `js/lib/{motion,screen,wallpaper,popover}.js`, and the template. Section builders own only their 3 files.
- **Flags for the lead:**
  1. `site/vercel.json` `/download` still points to `Notched-1.0.1.dmg` and the old JSON-LD says 1.0.1, while FACTS says 1.0.2. That is release-script territory, so don't touch it. The new page ships 1.0.2 per FACTS.
  2. `popover-*.png` shows `v1.0.1` and a shorter status line. Our recreation uses the Swift strings and v1.0.2.
  3. FAQ "colour" vs US spelling (see SC.06).
  4. No-JS visitors: `[data-cta="mac"]` is a plain `/download` link, so without JS the DMG downloads with no email ask. That's the honest progressive-enhancement fallback; say if you'd rather gate it.
