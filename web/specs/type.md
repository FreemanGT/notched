# Notched site spec: "REDACTED"
Lens: editorial-kinetic. Author: creative lead "type". Status: buildable. Facts law: `web/FACTS.md` (Swift wins on conflict).
Rev 2026-10-06: **every "Download for Mac" asks for an email first** (client decision, FACTS "Download email ask"). See §6.1. This overrides any "no forms / no email gate" wording elsewhere. The download itself never waits on the network.

---

## 0. Big idea (one sentence a juror can repeat)

**The black band is a redaction bar.** Notched's whole product is a strip of black that makes something disappear. On this site, the same strip works on the typography itself: it sweeps across headlines and flips letters white, it redacts the word "notch" out of the hero, it turns privacy claims into white-on-black menu bars, and finally it drops down to swallow the page. Every motion is **subtraction**: things are uncovered by the band, or swallowed into it. Nothing pops out and nothing bounces (the one exception is the corner fillet, which overshoots once, because that's the only shape the app lets you change).

Three rules every builder checks against:
1. **Black is the material.** Page, bezel, notch and band are the same `#000`. The only colour on the page is wallpaper light.
2. **The band is the only "effect".** If a moment needs drama, it gets it from the band (sweep, redact, swallow, fill), not from a new trick.
3. **Static frames must look finished.** Every section has to look like a magazine spread with motion off.

Killed on sight: centred app icon over a title, a lone toggle above a small laptop, 4-up icon cards, feature-tile marquees, custom cursor blobs, loaders, Lenis-default smoothness, the Apple logo, Apple-like wallpapers, any number not in FACTS.

---

## 1. Design tokens (`site/css/tokens.css`, architect)

### 1.1 Fonts (self-hosted, two families + system UI for the product recreation)
| Role | Family | fontsource package | File to copy | Axes / weights used |
|---|---|---|---|---|
| Display + text | **Archivo** (variable) | `@fontsource-variable/archivo` | `files/archivo-latin-wdth-normal.woff2` → `site/fonts/archivo.woff2` | `wght` 100–900 (use 400, 520, 640, 760, 900), `wdth` 62–125 (use 62, 100, 112, 125) |
| Mono (readouts, eyebrows, spec plates) | **Martian Mono** (variable) | `@fontsource-variable/martian-mono` | `files/martian-mono-latin-wdth-normal.woff2` → `site/fonts/martian-mono.woff2` | `wght` 400, 500; `wdth` 87.5 (narrow readouts) and 100 |
| Recreated macOS UI only (popover, fake menu bars) | `system-ui, -apple-system, "Segoe UI", Roboto, sans-serif` | none (no SF Pro files shipped) | — | 400, 500, 600 |

- `@font-face` with `font-display: swap`, `font-weight: 100 900; font-stretch: 62% 125%` (Archivo) and `font-stretch: 75% 112.5%` (Martian). Preload Archivo only.
- Budget ≤ 200 KB total. If the two latin files exceed it, subset with `pyftsubset --unicodes="U+0020-007E,U+00A0-00FF,U+2013,U+2014,U+2018,U+2019,U+201C,U+201D,U+2026,U+2022,U+00B7,U+2192,U+2197,U+2193,U+00D7,U+2588" --flavor=woff2 --layout-features='*'` (keeps variation tables).
- Metric-matched fallback to kill CLS: `@font-face { font-family: "Archivo Fallback"; src: local("Arial"); size-adjust: 104%; ascent-override: 88%; descent-override: 21%; }` (tune once in QA).
- Archivo is not on Claude Meter (Anybody / Instrument Serif / Geist Mono), so the identity stays separate.

### 1.2 Colour
```css
:root{
  --black:#000000;          /* band, bezel, notch, page. THE colour */
  --ink-1:#0B0B0C;          /* raised surface on black (cards, FAQ rows hover) */
  --ink-2:#161618;          /* hairline-filled controls on black */
  --line:rgba(255,255,255,.12);
  --line-strong:rgba(255,255,255,.24);
  --paper:#F2F0EB;          /* text on black; background of the paper sections */
  --paper-2:#E6E3DC;        /* paper hairlines / pressed */
  --mute:#8D8D93;           /* secondary on black (≈6.4:1) */
  --mute-paper:#5C5C61;     /* secondary on paper (≈5.9:1) */
  --signal:#3DFF8B;         /* camera-LED green: live dots, LED pulse, focus ring on black. Tiny doses only */
  --focus-paper:#0B57D0;    /* focus ring on paper */
  /* macOS recreation (popover & fake menu bars) */
  --mac-blue:#0A84FF; --mac-blue-light:#007AFF;
  --pop-dark-bg:rgba(30,30,30,.94); --pop-dark-text:rgba(255,255,255,.88); --pop-dark-2:rgba(235,235,245,.60); --pop-dark-3:rgba(235,235,245,.30); --pop-dark-ctl:rgba(255,255,255,.10);
  --pop-light-bg:rgba(246,246,246,.94); --pop-light-text:rgba(0,0,0,.85); --pop-light-2:rgba(60,60,67,.60); --pop-light-3:rgba(60,60,67,.30); --pop-light-ctl:rgba(0,0,0,.06);
}
```
The site is **black-first and does not flip with `prefers-color-scheme`** (one art-directed scheme: black → paper → black). Only the popover recreation follows `prefers-color-scheme` (light/dark), and the visitor can switch it in `#tryit`. `body{background:#000}` explicit.

### 1.3 Wallpaper palette (procedural, original). One table in `lib/wallpaper.js`, four phase stops:
| Phase (t) | sky top | sky mid | horizon | sun/glow | stars |
|---|---|---|---|---|---|
| dawn (0.00) | `#1C2556` | `#8B6CB2` | `#F6A88A` | `#FFD7A1` at (30%, 78%) | 0.15 |
| day (0.33) | `#3B71FE` | `#76A9FF` | `#6BE3D0` | `#FFFFFF` at (70%, 22%), soft | 0 |
| dusk (0.66) | `#24204C` | `#C05479` | `#FF9C5B` | `#FFB36B` at (78%, 80%) | 0.1 |
| night (1.00) | `#04050E` | `#0D1536` | `#1E2C5A` | `#9FB4FF` at (22%, 18%), small moon | 1 |

Day is the app icon's own gradient (`#3B71FE → #6BE3D0`). Hills are the icon's `hills.svg` paths (white at 0.28 and 0.22 opacity). Other presets for the rotation demo (`ridge`, `dunes`, `tide`) are new, original 2–3-path silhouettes in the same 1024 viewBox, drawn by the architect.

### 1.4 Type scale
| Token | Value | Use |
|---|---|---|
| `--fs-mega` | `clamp(4.5rem, 21vw, 22rem)`; lh .8; ls -.055em; wght 900; wdth 125 | footer/download wordmark |
| `--fs-h1` | `clamp(3.4rem, 11vw, 11.5rem)`; lh .84; ls -.045em; wght 820; wdth 112 | hero |
| `--fs-figure` | `clamp(6rem, 24vw, 21rem)`; lh .78; ls -.04em; wght 900; wdth 62 | chapter figures (tall condensed numerals) |
| `--fs-h2` | `clamp(2.6rem, 6.6vw, 6.75rem)`; lh .9; ls -.035em; wght 760; wdth 100 | section heads |
| `--fs-statement` | `clamp(2.4rem, 9vw, 9.5rem)`; lh .92; ls -.04em; wght 900; wdth 100 | privacy lines, ticker giants (ticker uses wdth 125) |
| `--fs-manifesto` | `clamp(1.75rem, 3.7vw, 3.6rem)`; lh 1.06; ls -.02em; wght 600 | manifesto |
| `--fs-lede` | `clamp(1.125rem, 1.55vw, 1.5rem)`; lh 1.4; wght 440 | ledes |
| `--fs-body` | `1.0625rem`; lh 1.55; wght 400 | body |
| `--fs-mono` | `.75rem`; lh 1.3; ls .08em; uppercase; Martian 500 wdth 87.5 | eyebrows, spec plates, readouts |
| `--fs-mono-s` | `.6875rem` | captions |

Body text on black is never below wght 400; nothing under 40px uses wght < 500 on black.

### 1.5 Space, grid, radii
- Grid: 12 columns, `--gutter: clamp(16px, 2vw, 32px)`, side margin `--margin: clamp(16px, 4vw, 64px)`, max content 1600px (full-bleed allowed). Mobile: 4 columns, 16px margins.
- Space scale (px): 4 8 12 16 24 32 48 64 96 128 192; section padding block `clamp(96px, 14vh, 192px)`.
- Radii are the product's radii: `--r-s:10px; --r-m:14px; --r-l:20px; --r-pill:999px; --r-pop:15px` (popover window). Cards on black use `--r-l`.
- Menu bar height: `--mb-h: 37px` (≥768px), `44px` (<768px, touch target). Notch drawing: `185pt × 32pt` on a `1512pt` wide screen, bottom radii 9pt, 3pt outer top shoulders.

### 1.6 Motion tokens (CSS + registered CustomEases in `lib/motion.js`)
| Name | Curve | Use |
|---|---|---|
| `sweep` | `cubic-bezier(.76,0,.24,1)` | the band moving (sweeps, fills, redactions) |
| `settle` | `cubic-bezier(.16,1,.3,1)` | things uncovered/arriving |
| `swallow` | `cubic-bezier(.7,0,.84,0)` | things disappearing into black (accelerate in) |
| `fillet` | CustomEase `"M0,0 C0.25,0 0.3,1.16 0.55,1.06 0.75,0.98 1,1"` | corner radius changes only (one overshoot) |
| `knob` | CustomEase `"M0,0 C0.3,0 0.2,1.12 0.6,1.02 0.8,1 1,1"` | popover switch knob only |

Durations: `--t-xs 120ms` (colour), `--t-s 240ms`, `--t-m 480ms`, `--t-band 700ms`, `--t-l 900ms`, intro total ≤ 1200ms. Scrub smoothing `scrub: 0.6` (hero), `0.8` (stages), `true` (ink).

### 1.7 Texture
- **Grain**: `body::after` fixed full-viewport, `background: url(/assets/grain.png)` (128×128 monochrome noise PNG, ≤ 6 KB, generated once by the architect), `opacity:.045`, normal blend, `pointer-events:none`, `z-index: 90`. Steps through 4 positions at 8 fps (`steps(4)` keyframes on `background-position`); static under reduced motion. Because band, bezel and page all carry the same grain, they still fuse.
- **Bezel edge**: `box-shadow: inset 0 1px 0 rgba(255,255,255,.07), inset 0 0 0 1px rgba(255,255,255,.03)` on the bezel only. That edge is the only clue that the black has a physical edge, and it fades as the band takes the notch.
- No gradients on UI chrome, no glassmorphism outside the fake macOS menu bar.

---

## 2. Global motion system and shared utilities (architect owns `site/js/main.js`, `site/js/lib/*`)

### 2.1 Libraries (self-hosted in `site/vendor/`, copied from `/Users/freemansmain/Ai Projects/Claude Meter/site/vendor/`)
`gsap.min.js`, `ScrollTrigger.min.js`, `SplitText.min.js`, `CustomEase.min.js`, `ScrambleTextPlugin.min.js`. **Not shipped:** Lenis (native trackpad inertia is the right feel for a Mac audience, and Lenis costs latency), Draggable/Inertia, WebGL (the CSS/SVG wallpaper is cheaper, works at every instance size and is its own fallback). Loaded as classic `<script defer>` before `js/main.js` (`type="module"`), which reads `window.gsap`.

### 2.2 Section module contract
- `site/js/<id>.js` exports `export default function init(root, ctx) { … return cleanup? }`.
- `ctx = { gsap, ScrollTrigger, SplitText, mm, reduced, desk, stores, lib }` where `mm = gsap.matchMedia()`, `reduced` is a live boolean getter, `desk = matchMedia('(min-width: 900px)')`, `stores.hero` is the hero store, `lib` is the namespace below.
- `main.js`: register plugins and eases, `ScrollTrigger.config({ ignoreMobileResize: true })`, mount nav + hero store, then `await Promise.race([document.fonts.ready, sleep(600)])`, then `init()` every section in DOM order inside `try/catch` (one broken section must not kill the page), then `ScrollTrigger.refresh()`.
- CSS: every section stylesheet is scoped under `#<id>`. Sections never style `html`, `body`, `.nav` or another section.

### 2.3 `lib/*` utilities (exact signatures)
| File | Export | Behaviour |
|---|---|---|
| `motion.js` | `reduced()`, `onReducedChange(fn)`, `EASE` | Registers `sweep/settle/swallow/fillet/knob`. |
| `store.js` | `createStore(initial)` → `{ state, get(), set(patch), subscribe(fn) → unsub }` | `state` exposes **accessor properties**, so `gsap.to(store.state, { band: 1, scrollTrigger: {…} })` tweens it directly. Writes are batched to one `requestAnimationFrame` notify. |
| `screen.js` | `mountScreen(el, opts)` | The living hero (§3). |
| `popover.js` | `mountPopover(el, { store, appearance })` | The real menu-bar window (§3.4). |
| `wallpaper.js` | `PALETTE`, `PRESETS`, `phaseFromClock(date) → t`, `paintWallpaper(el, { preset })` | Builds the wallpaper DOM (§3.3). |
| `split.js` | `splitChars(el)`, `splitWords(el)`, `splitLines(el)` | SplitText with `mask: 'lines'|'chars'`, `autoSplit: true` + `onSplit` re-creation; aria handled by SplitText. Returns the SplitText instance. |
| `bandtext.js` | `bandText(el, { origin: 'center'|'left'|'right' })` → `{ set(p) }` | **The signature typographic tool.** Clones `el`'s inner content into an `aria-hidden` overlay `.bt-on` (paper text) that sits on a black `.bt-bar`. Both get `clip-path: inset(0 R 0 L)` computed from `p` (0→1) and origin. Under the bar the letters read white-on-black, outside it they're the base colour. Per-letter flipping comes for free from the clip. Used by: nav, hero menu bars, privacy lines, CTA hover, footer wordmark. |
| `ink.js` | `inkWords(el, { start='top 80%', end='bottom 55%' })` | Words go from `opacity:.16` to `1` scrubbed, staggered across the range. Reduced: all at 1. |
| `marquee.js` | `marquee(el, { speed=60 /*px/s*/, dir=-1, velocity=true, skew=false })` → `{ pause(), play(), kill() }` | Duplicates the track until it's ≥2× viewport, loops `x` on `gsap.ticker`. `velocity`: adds `ScrollTrigger.getVelocity()/40` (clamped ±600 px/s) with a 0.3 s decay. `skew`: `skewX` up to ±7° from velocity. Pauses via IntersectionObserver when offscreen. Reduced: static, no duplicate visible. |
| `roll.js` | `roll(el, value, { duration=.5 })` | Digit roller: each char in a `1em` mask, old moves `yPercent:-100`, new comes in from 100, with `filter: blur(2px)` mid-flight (blur only on ≤ 6 chars). Reduced: text swap. |
| `clock.js` | `onClock(fn)` | One `setTimeout` aligned to the minute and a shared `Date`. Formats `"Tue 14:32"` with `Intl.DateTimeFormat(undefined, { weekday:'short', hour:'2-digit', minute:'2-digit' })`. Client-only, set before first paint of those nodes (they start empty, fixed width, so no CLS). |
| `visible.js` | `whenVisible(el, onIn, onOut, rootMargin='10%')` | IO helper; every loop (marquee, LED pulse, dynamic wallpaper drift, ghost) must use it. |
| `ghost.js` | `ghost(target, { idle=4000, onClick })` | SVG arrow cursor (drawn, 18px, black with white 1.5px stroke). If the section is in view and no `pointerdown/keydown/wheel-inside` happens for `idle` ms, it glides from off-panel to `target` (`settle`, 900ms), presses (scale .85, 120ms), calls `onClick`, fades. It runs **once per page load** and is cancelled forever by the first real input. Never under reduced motion. |
| `version.js` | `fillVersion()` | Reads `"softwareVersion"` from the SoftwareApplication JSON-LD and writes `v{x}` into every `[data-version]`. |
| `cta.js` | `initCtas(root) → unbind`, `noMac()`, `DMG='/download'` | Binds every `[data-cta="mac"]` in `root`: on click `preventDefault()` and `import('./signup.js').then(m => m.openSignup(el))` (first intent also prefetches the module on `pointerenter`/`focus`). `noMac()` = iPhone/iPad/Android UA, or iPadOS (`/Macintosh/` + `maxTouchPoints > 1`), or `(hover:none) and (pointer:coarse)`. When `noMac()`, it rewrites every CTA label to **"Get it on your Mac"**. Adapted from `Claude Meter/site/js/cta.js` (logic only). |
| `signup.js` | `openSignup(opener)` | The email dialog (§6.1). Lazy-loaded, ≤ 6 KB gz. Adapted from `Claude Meter/site/js/lib/signup.js` (logic only, new look, no Lenis hooks). |

### 2.4 Global choreography rules
- Native scroll. Pins: hero ≤ +120%, how ≤ +100%. Everything else uses `position: sticky` + ScrollTrigger progress (never traps the wheel; anchors and find-in-page keep working).
- Only `transform`, `opacity` and `clip-path` animate. `font-variation-settings` animates only on ≤ 8 chars at a time (the hero redaction, figure swaps).
- `will-change` is set in `onToggle` (active) and removed on leave.
- Pin CLS guard: every pinned section has an explicit height, and `pinSpacing` stays on. QA checks layout shift around pin enter and exit.
- `gsap.matchMedia()` conditions: `{ desk: '(min-width: 900px) and (prefers-reduced-motion: no-preference)', mob: '(max-width: 899px) and (prefers-reduced-motion: no-preference)', reduce: '(prefers-reduced-motion: reduce)', hover: '(hover: hover) and (pointer: fine)' }`. Every section implements all three of desk, mob and reduce.

---

## 3. Shared PRODUCT COMPONENT API (architect builds; sections consume)

### 3.1 State (one shape, many stores)
```js
const DEFAULT = {
  enabled: false,      // the app's switch (popover). Mirrors: band target 1/0 when not scrubbed
  band: 0,             // 0..1 black band progress; grows from the notch centre outward to both edges
  corners: true,       // "Round corners"
  radius: 14,          // pt, numeric 0..20 (presets 10/14/20). Tweenable for scrubs
  time: 0.33,          // 0 dawn · .33 day · .66 dusk · 1 night (values >1 wrap)
  dynamic: true,       // "Use dynamic wallpapers": time drifts on its own (1 day / 36 s) while visible
  preset: 'hills',     // 'hills' | 'ridge' | 'dunes' | 'tide'
  displays: 1,         // 1..3 rendered screens (built-in + externals)
  builtInOnly: false,  // externals keep (false) or lose (true) their band
  menuText: 'auto',    // 'auto' (per-letter: white under band, else by wallpaper luminance) | 'dark' | 'white'
  status: 'idle',      // 'idle' | 'processing' | 'processing-dynamic' | 'hidden' | 'restored'
  iconHidden: false,   // "Hide menu bar icon"
  loginItem: true,     // "Start at login"
  rotate: false, rotateEvery: 3600, rotateFolder: '',   // rotation row
  appearance: 'dark',  // popover appearance ('dark'|'light'); default from prefers-color-scheme
};
```
Hero uses `stores.hero` (created in main.js with `time = phaseFromClock(new Date())`). `#tryit` and `#features` create their **own** stores, so scrubs never fight clicks.

### 3.2 `mountScreen(el, opts)`
```js
const screen = mountScreen(el, {
  store,                         // required
  variant: 'hero' | 'laptop' | 'mini' | 'preview',
  //  hero    – full-bleed: viewport is the screen; 12px side bezel, notch hangs from the top edge
  //  laptop  – a framed screen-top (bezel 2.2% of width, 16:10 crop of the top 62%), externals laid out around it
  //  mini    – 16:10 small card for mobile chapters / how-it-works
  //  preview – the popover's in-window screen preview (8px radius, separator border, no bezel)
  interactive: false,            // true: clicking the notch toggles store.enabled; hover tooltip
  pointerParallax: false,        // hero only, (hover) devices
});
// convenience setters (all just store.set):
screen.setBand(p); screen.setRadius(pt); screen.setTime(t); screen.setWallpaper(id);
screen.setDisplays(n); screen.setMenuText(mode); screen.setBuiltInOnly(b);
screen.flash(text, ms=1800);     // toast pill above the notch ("Corners · 14 pt"), mono, black pill, white text
screen.el; screen.destroy();
```
**Behaviour of `enabled` (when a section is not scrubbing `band` directly):** `enabled: true` → `status:'processing'` (or `'processing-dynamic'` when `dynamic`) for 650 ms (1400 ms dynamic) → band tweens 0→1 over `--t-band` with `sweep` → `status:'hidden'`. `enabled:false` → band 1→0 (retracts *into* the notch, `swallow`, 600 ms) → `status:'restored'`. Sections that scrub `band` set `enabled` themselves.

### 3.3 DOM and rendering (no canvas, all compositor-friendly)
```
.screen[data-variant]                 --pt: (display width px / 1512)
  .display.is-builtin                 (+ .display.is-ext × (displays-1), no notch)
    .wp                               paintWallpaper(): 4 stacked phase layers
      .wp-phase[data-p=dawn|day|dusk|night]   linear-gradient(top→mid→horizon); only OPACITY changes with time
      .wp-sun                         radial glow, positioned with transform (no repaint)
      .wp-stars                       inline SVG, 40 tiny circles, opacity = palette stars
      .wp-hills                       inline SVG from hills.svg / preset paths; preserveAspectRatio="none"; two layers parallax-able
    .mb                               fake menu bar, height calc(37 * var(--pt)), min 22px
      .mb-base                        translucent: rgba(255,255,255,.22)+backdrop-filter blur(24px) saturate(1.4); text dark or light by wallpaper luminance
        left: bold "Desktop", then "File  Edit  View  Go  Window  Help" (generic, no logos)
        right: Notched status icon (drawn menubar.rectangle glyph: 16×12 rounded rect + top bar), battery outline (generic), clock "Tue 14:32"
      .mb-band  (= bandText overlay)  black bar + white copy of the same items, clip-path inset(0 calc((1-band)*50%))
    .fillet.l / .fillet.r             SVG concave quarter-circles hanging under band ends, size = radius*--pt, scale(0→1) when band ≥ .96 (fillet ease, 420ms); hidden when !corners
    .notch                            #000, 185×32 pt, bottom radii 9pt, top shoulders; camera lens (2 circles from menu.svg: #1B2233 + #3E4C70) + LED dot
    .seam                             1px rgba(255,255,255,.06) notch outline + bezel edge; opacity = 1 - band  ← "the notch dissolving"
  .bezel                              frame per variant
  .toast                              screen.flash()
```
- Time → opacities: for `t` between two phases, `a = smoothstep`. Sun moves along an arc (`x = 20%→80%`, `y = 80%→20%→80%`) via transform.
- `dynamic: true` + visible → `time += dt/36s`, paused offscreen and under reduced motion.
- Changing `preset`: the new hills layer comes in under the band by `clip-path: inset(0 0 0 100%)→0` (L→R, 700 ms sweep). The band never moves while wallpapers change. That's the rotation point.
- `menuText:'auto'`: the base text colour is `#0b0b0c` when the current phase luminance is > .45 (day/dawn), otherwise `rgba(255,255,255,.92)`; the band overlay is always white.
- Pointer parallax (hero, hover devices): hills back ±6px, front ±14px, sun ±20px on x; `quickTo` duration .8, `settle`.
- `interactive`: clicking the notch toggles `enabled`. When band = 1, hovering the notch shows tooltip **"Nothing to see here. That's the point."** (mono, black pill, 1.2 s delay).
- Accessibility: `.screen` is `role="img"` with `aria-label="A MacBook screen top. The menu bar turns black and the notch disappears into it."` Everything inside is `aria-hidden`. Status changes are announced by the popover's live region, not by the screen.

### 3.4 `mountPopover(el, { store })`: pixel-faithful recreation of `SettingsView.swift`
Match `site/assets/popover-dark.png` / `popover-light.png` (2×). The reference PNG shows "v1.0.1"; render the version from `[data-version]` (FACTS: v1.0.2).
- Window: width **340px**, padding `20px 18px 18px`, vertical gap **10px**, radius `--r-pop`, bg `--pop-*-bg` + `backdrop-filter: blur(30px) saturate(1.6)`, border `0.5px solid rgba(0,0,0,.6)` + inner `inset 0 0 0 1px rgba(255,255,255,.10)` (dark), shadow `0 24px 80px rgba(0,0,0,.55), 0 2px 8px rgba(0,0,0,.4)`. Font `system-ui` 13px.
- Rows, top to bottom (exact strings):
  1. `"Notched"` (15px, 600) … switch (`<button role="switch" aria-checked aria-label="Hide the notch">`, 38×22, track `--mac-blue` on / `--pop-*-ctl` off, white 20px knob, `knob` ease 260 ms).
  2. Screen preview: `mountScreen(..., { variant:'preview', store })`, 304px wide, height `304/1.54 ≈ 197px`, radius 8, 1px separator border, notch drawn on top.
  3. Status line (12px, secondary, `aria-live="polite"`), with a 10px spinner while processing:
     - idle/off: **"Turn on to blacken the menu bar so the notch blends in."**
     - processing: **"Processing wallpaper…"** · processing-dynamic: **"Processing dynamic wallpaper… this takes a few seconds."**
     - hidden: **"Notch hidden. New wallpapers are handled automatically."** (right after processing) → after 4 s settles to the resting **"Notch hidden."** (`SettingsView.statusLine` when the manager status is empty; that's what `popover-*.png` shows)
     - restored: **"Wallpaper restored. Other Spaces get theirs back when you visit them."**
  4. Divider (1px `rgba(255,255,255,.10)` / `rgba(0,0,0,.10)`).
  5. ☑ **"Use dynamic wallpapers"** + caption (11px, secondary, 20px indent) **"Keeps time- and appearance-based wallpapers changing. Takes longer to process."**
  6. ☑ **"Round corners"** … segmented **Small | Medium | Large** (`role="radiogroup"`, three `role="radio"` buttons, arrow-key roving; selected = `--mac-blue` pill, white text; whole control `disabled` + 40% opacity when Round corners is off, exactly like `.disabled(!corners)`). Maps to radius 10/14/20; the change tweens radius with the `fillet` ease and calls `screen.flash('Corners · 14 pt')` on the mirror.
  7. ☐ **"Built-in display only"**
  8. ☐ **"Rotate wallpapers"** + caption **"macOS can't shuffle under the black bar, so Notched rotates your pictures itself."** When checked, the row appears (height auto-animate 240 ms, 20px indent): button **"Choose Folder…"** (in the demo it becomes **"Pictures"** after a click; it's a demo, no file dialog) · native `<select>` **5 min / 15 min / 30 min / Hourly / Daily** (default Hourly) · **"Next"** (disabled until a folder is chosen and the switch is on, as in the Swift). Next → `preset` cycles to the next preset.
  9. Divider. ☑ **"Start at login"** (default checked, cosmetic). ☐ **"Hide menu bar icon"** + caption **"Open Notched again to bring it back."** (hides the status glyph in the mirror's menu bar).
  10. Divider. **"Check for Updates…"** (small bordered button) … `v1.0.2` (`[data-version]`, tertiary) … **"Quit"**.
     - Check for Updates… → inline note under the footer for 3 s: **"In the app, this checks for a new version. You're looking at the latest: v1.0.2."**
     - Quit → the popover closes (scale .96 + fade, 200 ms, origin top-right) and the mirror's status icon pulses (LED-green ring); clicking the icon, or a **"Reopen"** text button that appears in its place, reopens it.
- Checkbox: 14×14, radius 3.5, on = `--mac-blue` with white check (SVG), off = `--pop-*-ctl` + 0.5px border. All are real `<input type="checkbox">` with `<label>`, styled with `appearance:none`. Focus: macOS-like `0 0 0 3px rgba(10,132,255,.5)` ring.
- Keyboard: Tab order follows the visual order; Space toggles; arrows move the segmented control.

---

## 4. Global elements (architect)

### 4.1 Nav = a menu bar (`.nav`, fixed, `--mb-h` tall)
- **It is the hero screen's menu bar.** At the top of the hero it renders as the fake macOS bar (translucent, dark or light text by phase) with the **notch hanging in its centre** (clamp(120px, 12.2vw, 210px) × (mb-h − 5px)). It reads `stores.hero.band` and uses `bandText` with origin `'center'`, so the band grows out of the notch and flips each nav letter white as it passes. After the hero (`ScrollTrigger` on `#hero` end) the band is forced to 1: the nav is black on a black page, and the notch is still there, invisible. That's the product working on the site itself.
- Left: drawn status glyph + **"Notched"** (Archivo 640, 14px) · **"How it works"** · **"Features"** · **"FAQ"** (13px, anchors). Right: `--signal` 6px live dot + clock (Martian 12px) · version chip `v1.0.2` (mono, 1px `--line` border, pill) · **"Download"** compact pill (paper bg, black text, 28px tall), `href="/download" data-cta="mac"` → opens the email dialog (§6.1), which grows out of this very notch.
- On paper sections (`#privacy`, `#faq`) the nav stays black. It's a menu bar, and paper sections show the band sitting over them.
- Mobile (<768): glyph + "Notched" left, notch centre (96px wide), "Download" right (hides clock, links, chip). `#features` gets no nav pill; the chapter cards are enough.
- Skip link "Skip to content" as the first focusable element.

### 4.2 Intro (≤ 1.2 s, no loader; first paint is already the finished hero)
| t (ms) | What |
|---|---|
| 0 | Wallpaper painted in CSS at the visitor's real local phase (`phaseFromClock`, set by an inline `<script>` in `<head>` writing `--t0` on `<html>`, so no flash). Band 0. H1 text present (no-JS = readable). |
| 0–360 | Camera LED in the notch blinks `--signal` twice (opacity 0→1→0→1→0, 90 ms each). |
| 120–950 | H1 chars rise inside line masks: `yPercent 105→0`, stagger .022, 800 ms `settle`. |
| 500–1100 | Nav items fade/slide `y 6→0` (stagger .03, 500 ms). The clock appears via ScrambleText (chars `"0123456789:"`, 500 ms). The spec plate rolls in. |
| 700–1200 | Lede, CTAs and spec plate: opacity 0→1, `y 12→0`, 500 ms `settle`. |
Reduced: no intro motion at all; everything is visible at paint.

### 4.3 Grain: §1.7. **Cursor:** none (native). The only cursor art is the ghost in `#tryit`.

### 4.4 Cross-promo pill (fixed bottom-right, desktop ≥ 900px)
Appears once the hero has scrolled 80% (`y 16→0`, 400 ms). Black pill, `--line` border, 44px tall: `claude-meter.png` 24px + **"Claude Meter ↗"** + mono caption **"Also by me"**. Links to `https://claudemeter.vercel.app/?ref=notched` (`target="_blank" rel="noopener"`). A small × dismisses it (`localStorage` in try/catch). Hidden while `#download` is in view (the footer carries it). Mobile: not fixed, it lives in the footer only.

### 4.5 Footer (inside `#download`, architect owns `.footer` markup/CSS)
Two hairline-topped rows on black:
- Row 1 (mono 11px, mute): **"Notched v1.0.2 · MIT licence · Signed and notarized by Apple · Updates via Sparkle"** · links: **"Source on GitHub"** (GitHub glyph, the only third-party mark) · **"llms.txt"**.
- Row 2: **"Also by me: Claude Meter puts your Claude usage limits right in the MacBook notch. ↗"** (link) … right side **"Not affiliated with Apple. © 2026 Yiftach Freeman"**.

---

## 5. Sections (ids in DOM order; each owned by one builder: `web/sections/<id>.html`, `site/css/<id>.css`, `site/js/<id>.js`)

### 5.1 `#hero`: "Black out the ███████."
**Layout (desk).** 100vh full-bleed, `mountScreen({ variant:'hero', store: stores.hero, interactive:true, pointerParallax:true })` as the background. The nav is its menu bar. Content sits bottom-left over the wallpaper in columns 1–9, padding-bottom 7vh:
- Eyebrow (mono): **"A free menu bar app for MacBooks with a notch"**
- H1 (`--fs-h1`, paper on night/dusk, `#0b0b0c` on dawn/day; colour follows `menuText` auto luminance): **"Black out"** / **"the notch."** The word **"notch"** is wrapped in `<span class="redact">`.
- Lede (cols 1–6, `--fs-lede`): **"Notched bakes a black band into a copy of your wallpaper. The menu bar goes black, its text turns white, and the notch sinks into the bezel."**
- CTA row: primary **"Download for Mac"** (§6, `data-cta="mac"` → email dialog §6.1; reads **"Get it on your Mac"** on phones/tablets); secondary text link **"Try the switch ↓"** → `#tryit`. Under it, mono: **"Free · Open source · macOS 14+ · Apple silicon"**.
- Spec plate, bottom-right (mono 11px, live from the store, right-aligned, 3 lines): `BAND 000%` / `CORNERS 14 PT · DUSK` / `LOCAL TUE 14:32`. Numbers update with `roll()`.
- Hidden caption (revealed in phase C) under the H1, mono: **"Gone. Well, it's still there. You just can't see it."**

**Scroll (desk).** Pin `#hero`, `end: '+=120%'`, `scrub: 0.6`, one timeline:
| progress | animation |
|---|---|
| 0 → .50 | `stores.hero.state.band` 0 → 1 (`sweep`). The band grows out of the notch to both edges; nav letters flip white as it passes; the `.seam` fades, so the notch dissolves. |
| .44 → .60 | `radius` 0 → 14 (`fillet`); the fillets curl in under the band ends. |
| .10 → .80 | `time` += .12 (the light drifts). |
| .55 → .85 | **The redaction.** The chars of "notch" squeeze `wdth 112 → 62`, lift `y -0.06em` and fade (`swallow`, stagger .03 from the edges inward). A black `.redact::after` bar (height .78em, offset .08em) grows `scaleX 0 → 1` from the left (`sweep`). The line now reads **"the ███████."** |
| .80 → .95 | Caption reveals by `clip-path inset(0 100% 0 0) → 0` (`sweep`). |
| .90 → 1 | Lede and CTAs `y 0 → -24px`, opacity .3 (handing off to `#ticker`). |
Clicking the notch (interactive) smooth-scrolls to the pin's end (`window.scrollTo({ top: st.end, behavior: 'smooth' })`), so a click gives the same result as scrolling.

**Mobile (<900).** Same screen with `variant:'hero'`, cropped: `--pt` computed from a 3× zoom on the centre 33% of the menu bar, so the notch and its neighbours fill the width and the menu items still read (`"Edit View"` … status glyph, clock). H1 at 15vw, CTA full-width 52px tall. Pin `+=70%`, same timeline compressed. No parallax.

**Reduced.** No pin. Render the end state on paint except the redaction: band 1, radius 14, H1 intact (no bar), caption visible. Clicking the notch toggles band 0/1 instantly.

### 5.2 `#ticker`: live data + manifesto (the editorial-kinetic set piece)
**Layout.** Black, full-bleed.
1. **Readout ticker** (one `--mb-h`-tall row, hairlines top and bottom, mono 12px, `--mute` with values in paper). `marquee(speed:40, dir:-1, velocity:true)`. Content (live via the hero store and `onClock`):
   `LOCAL TUE 14:32 — PHASE DUSK — BAND 100% — CORNERS 14 PT — CHECKS EVERY 2 S — ROTATES 5 MIN → DAILY — MACOS 14+ — APPLE SILICON — v1.0.2 — MIT — NO ANALYTICS — NO ACCOUNT — ` (the `--signal` dot precedes LOCAL).
2. **Giant marquee** directly below: Archivo 900, wdth 125, `clamp(5rem, 18vw, 17rem)`, paper: **"HIDE THE NOTCH ● KEEP YOUR WALLPAPER ● "** `marquee(speed:90, dir:-1, velocity:true, skew:true)`. **A notch hangs into this row from the readout ticker above:** a black notch shape (width 14vw, height 62% of the row, bottom radii 2vw, 1px `--line-strong` outline), centred, *above* the letters (z-index), so every letter passing under it disappears. Section scroll .35 → .6: the outline fades to 0 and the notch shape retracts upward (`scaleY 1 → 0`, origin top, `swallow`). From then on the letters run uninterrupted.
3. **Manifesto**, cols 2–10, `--fs-manifesto`, `inkWords()` per paragraph, 0.9em gap between paragraphs:
   - **"There's a notch in the middle of your menu bar."**
   - **"macOS lays the menus out around it. Your eyes still find it."**
   - **"Paint the bar black and the edge goes away. Black bar, black bezel, one shape."**
   - **"Your wallpaper stays yours. Notched only ever touches a copy."**
   - **"Flip the switch. Go on."** ← a link to `#tryit`. A 2px paper underline draws L→R (`scaleX`, `sweep`, 600 ms) when the line finishes inking.

**Mobile.** The giant row at 24vw with the notch at 22vw wide. Manifesto 1.6rem, cols full.
**Reduced.** Both marquees become static single lines (overflow hidden, ellipsis); the notch shape is not rendered; manifesto at full opacity.

### 5.3 `#tryit`: "One switch. A few boxes."
**Layout (desk).** Cols 1–4: eyebrow **"THE WHOLE APP"**, H2 **"One switch. A few boxes."**, body **"This is Notched's menu bar window, rebuilt for the browser. Every control works, and the screen next to it does what your Mac would. Nothing here touches your Mac."**, then a tiny mono segmented **"DARK | LIGHT"** for the popover appearance (default from `prefers-color-scheme`). Cols 5–12: `mountScreen({ variant:'laptop', store: tryStore, interactive:true })` with `displays: 2` (an external monitor half-cropped by the right page edge). The popover (`mountPopover`) is positioned **like a real popover, hanging under the mirror's Notched status icon** (top = menu bar bottom + 6px, right edge aligned to the icon + 18px). It overlaps the mirror's wallpaper and extends below the screen. A 12px popover arrow-less gap; the status icon gets the "highlighted" capsule (`rgba(255,255,255,.2)`, radius 4) while open.
**Wiring.** Every control writes `tryStore` (§3.4). "Built-in display only" retracts the external's band (`swallow`, 600 ms) and brings back its translucent bar. Dynamic on → the mirror drifts through the day while visible.
**Entrance.** ScrollTrigger `top 70%`: the mirror screen is uncovered by `clip-path inset(0 0 100% 0) → 0` (top-down, like a band dropping, 900 ms `sweep`); then the popover opens: `scale .96 → 1`, opacity 0 → 1, origin top right, 220 ms `settle`.
**Ghost.** `ghost(switchEl, { idle: 4000 })` flips the switch once.
**Mobile.** Mirror first (variant `laptop`, notch-crop zoom 2×, no external), popover below at full width; if the viewport is < 372px, scale the popover with `transform: scale((100vw - 32px)/340)` and a height compensator (no overflow at 320px). Ghost off on touch.
**Reduced.** No entrance, no ghost, state changes are instant (band switches without a sweep, radius jumps).

### 5.4 `#features`: six chapters, one stage
**Layout (desk).** Two columns. Left (cols 1–5): six `<article class="chapter">` blocks, each `min-height: 90vh`, vertically centred content. Right (cols 6–12): a **sticky stage** (`top: calc(var(--mb-h) + 6vh)`, height 76vh) holding `mountScreen({ variant:'laptop', store: featStore })` with a slight `perspective(1600px) rotateX(6deg)`, a spec plate under it (mono, live) and a vertical **chapter index** at the far left of the stage (mono 11px: `01 CORNERS / 02 DYNAMIC / 03 DISPLAYS / 04 ROTATION / 05 WATCHING / 06 UNDO`; active = paper with a 16px black-on-paper band chip behind it, inactive = `--mute` (not 30% grey); clicking scrolls to that chapter).
Each chapter: mono number + mood word, then the **figure** (`--fs-figure`, paper, wdth 62), then the H3 (`--fs-h2` at 0.55×, wght 700), then body (`--fs-body`, mute, max 34ch).

| # | Mood | Figure (kinetic) | H3 | Body (exact) | Stage (one master timeline, labels per chapter, scrubbed by `ScrollTrigger({ trigger: list, start:'top top', end:'bottom bottom', scrub:.8 })`) |
|---|---|---|---|---|---|
| 01 | CORNERS | `14` rolls 10 → 14 → 20 (`roll()`, in step with the stage); "pt" in mono beside it | **Corners, if you want them.** | **A small curve under each end of the band, so the desktop reads as a rounded screen. Small, Medium or Large: 10, 14 or 20 points. Medium out of the box.** | The stage starts with band 1. The camera zooms into the left fillet (stage inner `scale 3.2`, transform-origin at the left band end). `radius` tweens 10 → 14 → 20 (`fillet`), and each step fires `flash('Corners · 10 pt')` etc. Zoom back out at the end. |
| 02 | DYNAMIC | live clock figure `06:12` scrubbing to `21:40` (time mapped from `time`) | **Dynamic wallpapers keep moving.** | **Time-of-day and light/dark wallpapers keep every frame and their schedule. The bar stays black while the day goes by. The first pass takes a few seconds.** | Chapter start: `flash('Processing dynamic wallpaper… this takes a few seconds.', 1600)`. Then `time` 0 → 1 across the chapter: dawn → day → dusk → night, stars arrive, the band never changes. |
| 03 | DISPLAYS | **"Every."** (word figure, wdth 62) | **Every display. Every Space.** | **Each screen gets its own copy at its own resolution. Plug in a monitor and it gets a band too, or keep it to the built-in display. Other Spaces are fixed up when you visit them.** | The camera pulls back (`scale 1 → .62`); external displays slide in from the right, then the left (`displays` 1 → 3, `x ±40% → 0`, `settle`). Their bands draw from the centre outward with a 0.15 stagger. At .75 of the chapter a "Built-in display only" chip (mono, checkbox drawn) ticks on and the externals' bands retract (`swallow`). |
| 04 | ROTATION | interval word cycles **5 min → 15 min → 30 min → Hourly → Daily** (ScrambleText, 400 ms each) | **It shuffles for you.** | **macOS can't shuffle wallpapers under the black bar, so Notched rotates a folder itself: every 5, 15 or 30 minutes, hourly or daily. Or hit Next. A shuffle folder you set in System Settings is taken over automatically.** | `preset` steps hills → ridge → dunes → tide. Each new wallpaper wipes in L→R *under* the band; the band and fillets stay perfectly still (the point). The spec plate shows `PRESET 2/4`. |
| 05 | WATCHING | `2 s` (figure), the "2" counts down 2 → 1 → 0 with `roll()` | **Change your wallpaper. Wait two seconds.** | **Notched checks in the background every two seconds. Pick a new picture and the band is redone within about two seconds. Nothing to click.** | A new wallpaper swaps in with **no band**: band snaps to 0, the notch reappears and the menu text goes dark (the problem, briefly). A 2 s ring (SVG circle, DrawSVG-free: `stroke-dashoffset`) runs around the status glyph, then the band sweeps back from the notch (`sweep`, 500 ms). |
| 06 | UNDO | **"Off."** | **Off means off.** | **Switch it off and your original wallpaper comes back. Other Spaces get theirs back the next time you visit them while Notched is running. Aerial, colour and other live wallpapers are left alone.** | The band retracts into the notch (`swallow`), the seam returns, and `flash('Wallpaper restored. Other Spaces get theirs back when you visit them.', 2200)`. |

Figure swaps between chapters: the outgoing figure is swallowed upward (`yPercent -100` inside a mask, `swallow`, 350 ms) and the incoming one is uncovered from below (`settle`, 500 ms). Triggered by each chapter's `onToggle` (`start: 'top 55%'`).

**Mobile.** No sticky stage. Each chapter is a card: figure (20vw) → H3 → body → its own `mountScreen({ variant:'mini' })` with its own store, whose chapter timeline **plays once** when the card is 50% in view (IO), plus a mono **"↺ Replay"** button. The index becomes a horizontal chip row at the section top (scrollable, `overflow-x:auto` contained inside its own box).
**Reduced.** Desktop keeps the sticky layout but the stage jumps to each chapter's end state on `onToggle` (no scrub). Figures show final values. Mobile mini stages show end states, no Replay.

### 5.5 `#how`: "A copy, a strip of black, done."
**Layout (desk).** Pinned `+=100%`, `scrub:.8`. Left cols 1–4: eyebrow **"HOW IT WORKS"**, H2 **"A copy, a strip of black, done."**, three numbered steps (mono numbers, Archivo 600 titles, body mute); the active step inks as the timeline passes it. Right cols 5–12: an isometric stack (`perspective(2000px) rotateX(58deg) rotateZ(-38deg)`, `transform-style: preserve-3d`) of three 16:10 plates built with `paintWallpaper()`:
1. **"Copy."** **"Your wallpaper file is never edited. Notched writes a copy to `~/Library/Application Support/Notched`."** → plate A (the original, labelled mono `ORIGINAL · UNTOUCHED`) lifts a duplicate plate B (`translateZ 0 → 90px`).
2. **"Bake."** **"A black band the exact height of your menu bar goes across the top, at your screen's own resolution. Corners if you want them."** → plate C (just the band + fillets, transparent elsewhere) descends from `translateZ 260px` onto B and fuses (`sweep`). The label reads `+ BLACK BAND · MENU-BAR HEIGHT`.
3. **"Set."** **"The copy becomes your desktop picture, placed the way you had it: fill, fit, stretch or center."** → the stack un-rotates to flat front view (`rotateX/Z → 0`, `settle`), B+C fill a bezel frame with a notch; the band and the notch fuse (seam fades). Label `DESKTOP PICTURE`.
Footnote under the steps (mono 11px, mute): **"Signed with Developer ID and notarized by Apple. Updates via Sparkle, signed with EdDSA."**
**Mobile.** No pin. Three stacked rows, each with a small flat diagram that animates once in view (duplicate offset; band drops; frame wraps).
**Reduced.** No pin. The static exploded isometric diagram with all three labels visible.

### 5.6 `#privacy`: paper section, "No account. No analytics. One request a day."
**Transition in.** The black section above ends in a **band with fillets**: a full-width black strip at the top of `#privacy` (height `--mb-h`) whose two concave fillets hang into the paper. Their radius is scrubbed `0 → clamp(40px, 8vw, 120px)` as the section enters (`fillet` ease on the scrub's mapped progress). A mono label tucked into the left fillet: **"R = LARGE"**.
**Layout.** Paper background, `--black` text. Eyebrow **"PRIVACY"**. Three full-width statements (`--fs-statement`, wght 900, wdth 100, ls -.04em), each on its own line, left-aligned at col 1, separated by 1px `--paper-2` hairlines:
- **"No account."**
- **"No analytics."**
- **"One request a day."**
Each line uses `bandText(el, { origin:'left' })`. ScrollTrigger per line (`start:'top 75%'`, `end:'top 45%'`, scrub) sets `p 0 → 1`: a black band sweeps across the line and the letters flip to paper as it passes. The final state is three white-on-black bars on paper (three menu bars). Below, cols 1–7, `--fs-lede`:
**"The app makes one network request: a daily update check against `notched.vercel.app/downloads/appcast.xml`. Your original wallpaper files are never modified. This website has no analytics and no tracking. It asks for one thing, an email when you download, and uses it only to tell you about Notched updates."**
Then **"Read the source on GitHub ↗"** (underlined link).
**Mobile.** Statements at 13vw, so each stays on one line at 320px ("One request a day." gets `wdth 75` on <420px). The fillet max is 40px.
**Reduced.** Lines render as final black bars, no sweep.

### 5.7 `#faq`: "Questions, plainly." (paper)
**Layout.** Cols 1–4 H2 **"Questions, plainly."** (sticky at top 20vh on desk). Cols 5–12: `<details>` rows with 1px hairlines; summary Archivo 600 `clamp(1.25rem, 1.8vw, 1.6rem)`; a `+` mark made of two 2px bars that rotates into `−` (240 ms `settle`). Opening: the answer height animates (`::details-content` + `interpolate-size: allow-keywords` where supported, JS height tween fallback), and a 4px black band slides in at the row's left edge (`scaleY 0 → 1`, origin top, `sweep`), the menu-bar motif again.
Q/A (exact; JSON-LD FAQPage must match, architect updates it):
1. **How does Notched work?** — Notched saves a copy of your wallpaper with a black strip the height of the menu bar and sets the copy as your desktop picture. The menu bar turns black and the notch blends into it. Your original file is never touched.
2. **How do I turn it off?** — Flip the switch off and your own wallpaper comes back. If you use several Spaces, each one gets its wallpaper back the next time you visit it while Notched is running.
3. **Does it work with dynamic wallpapers?** — Yes. Time-of-day and light or dark wallpapers keep all their frames and their schedule, so they keep changing. The first pass takes a few seconds.
4. **What about Aerials and colour wallpapers?** — Those are drawn live by macOS, so Notched leaves them as they are. Pick a photo or a dynamic wallpaper to hide the notch.
5. **Can it shuffle my wallpapers?** — macOS can't shuffle under the black bar, so Notched does it for you: pick a folder and an interval. If you already had a shuffle folder set, Notched takes it over.
6. **Does Notched connect to the internet?** — Only to check for updates, once a day. No analytics and no account.
7. **What do I need?** — A Mac with Apple silicon running macOS 14 or later. It's built for MacBooks with a notch and also works on external displays.
8. **Why does the download ask for my email?** — So the maker can tell you about Notched updates. That's all it's used for: it goes into the maker's Google Sheet and is never shared or sold. The app itself collects nothing.
Entrance: rows rise `y 24 → 0`, opacity, stagger .06, 600 ms `settle` (once). **Reduced:** no motion; details open instantly.

### 5.8 `#download`: the band takes the page
**Transition in (the finale).** At the top of `#download` sits a black strip of `--mb-h` on paper. Scrub (`start:'top bottom'`, `end:'top top'`): the strip's `scaleY` goes `1 → (100vh / mb-h)` with transform-origin top (`sweep` mapped). Its two fillets ride its bottom corners and grow from 14 → 20 px-equivalents. The page turns fully black: the product's black, which is also where the page started.
**Layout.** 100vh min, black, centred grid:
- Mono eyebrow: **"DOWNLOAD"**.
- Wordmark **"Notched"** (`--fs-mega`, paper, wdth 125, wght 900), with a **black notch shape overlaid centred on its top edge** (width 16% of the wordmark, height 34% of cap height, bottom radii .12em). Since the page is black, the notch reads as a bite out of the letters. Scrub (`start: 'top 40%'`, `end: 'top top'`): the notch's height `scaleY 1 → 0` (origin top, `swallow`). **The notch closes and the wordmark is whole.**
- H2 below (`--fs-h2` at .6×, wght 640): **"Your menu bar, minus the notch."**
- Primary CTA **"Download for Mac"** (large, 64px, `data-cta="mac"` → §6.1) + mono line **"Free · v1.0.2 · macOS 14 or later · Apple silicon · notarized by Apple"** + secondary link **"Source on GitHub"**.
- Footer (§4.5) at the bottom.
**Mobile.** Wordmark 22vw. On phones/tablets (`noMac()`) every primary CTA reads **"Get it on your Mac"** and opens the away view of the dialog (§6.1): optional email + **"Send the link to my Mac"**. No "Download anyway" button. This applies here, in the hero and in the nav.
**Reduced.** The page is black from the start of the section (no growth); the notch on the wordmark is already closed.

---

## 6. Primary CTA component (`.cta`, architect, used by hero/download/nav)
Paper pill on black (black pill on paper), Archivo 640 17px (`.cta--lg` 20px/64px), height 56px, padding 0 28px, gap 10px. Icon: a drawn 16px arrow-into-tray SVG (never an Apple glyph). Hover (`hover` media): `bandText(label, { origin:'left' })` with a black bar sweeping in over 420 ms (`sweep`), turning the pill black with paper text; on leave it exits to the right. Active: `scale .97`. Focus-visible: 2px `--signal` outline, 3px offset (paper sections: `--focus-paper`). Markup is always `<a class="cta" href="/download" data-cta="mac">` (no `download` attribute; the Vercel redirect handles it). With JS, `initCtas()` intercepts the click and opens §6.1. Without JS the link downloads directly (graceful fallback, nothing breaks).

### 6.1 The email ask: "the band drops" (`lib/signup.js`, architect; FACTS "Download email ask" is law)
**Shape and motion (Notched's language, not Claude Meter's island).** One native `<dialog class="su">` opened with `showModal()` (page inert, Esc and backdrop click close, focus returns to the opener). The panel is **a black band hanging from the nav's menu bar**: it's attached to the bottom of `.nav` at the notch's centre, `min(440px, 100vw - 32px)` wide, `--r-l` bottom radii, and it has **concave fillets at its two top corners** where it meets the menu bar (the product's own shape, radius 14px; same SVG as `.fillet`). Panel background `#000`, a 1px `--line` outline on sides and bottom only, so it reads as the menu bar grown downward. Backdrop: `rgba(0,0,0,.72)`, no blur.
- **Open (420 ms):** the nav's notch is the seed. The panel starts clipped to the notch rect (`clip-path: inset(0 calc(50% - notchW/2) calc(100% - notchH) round 0 0 9px 9px)`) and opens to `inset(0 round 0 0 20px 20px)` with `sweep`. The fillets scale `0 → 1` with `fillet` ease in the last 160 ms. Content rises inside line masks (`y 12 → 0`, opacity, stagger .04, 360 ms `settle`, 120 ms delay). Backdrop fades 240 ms. If the hero band is < 1 when it opens, the nav band snaps to 1 first (120 ms) so the panel always hangs from black.
- **Close (320 ms):** reverse into the notch with `swallow`, then backdrop out. If it was closed by a `#hash` link inside, scroll there after close.
- **View swap** (form → done): old content fades (120 ms); the panel height tweens old → new (`settle`, 400 ms; measured, WAAPI); new content rises.
- **Reduced:** opens/closes with a 120 ms opacity fade only; no clip, no fillets animating, no rising.

**Layout inside the panel** (padding 28px 28px 24px; Archivo for type, Martian for kickers/meta; paper text on black):
- Header row: drawn status glyph + **"Notched"** (Archivo 640 13px) left, a 32px `×` close button (`aria-label="Close"`) right.
- Kicker (mono, mute) · title (Archivo 760, 32px, ls -.03em; one word gets the redaction treatment: it sits on a paper bar with black letters, i.e. `bandText` final state inverted) · lede (`--fs-body`, mute) · field · error line · CTA (`.cta.cta--lg`, full width) · fine print (mono 11px, mute) · requirements (mono 11px).
- Field: label above (mono 11px, uppercase), `<input type="email" name="email" required autocomplete="email" inputmode="email" autocapitalize="off" spellcheck="false" placeholder="you@example.com">`, 52px tall, `--ink-2` bg, 1px `--line-strong` border, radius `--r-s`, 17px text (no iOS zoom). Focus: border paper + 2px `--signal` outer ring. Invalid: `aria-invalid="true"`, border `#FF6B6B`, error text `#FF8A8A` (≥ 4.5:1 on black). `autofocus` only on fine pointers (no keyboard popping over the panel on touch).
- Honeypot: `<div class="su-hp" aria-hidden="true" inert><label>Leave this empty <input name="nt_hp" type="text" tabindex="-1" autocomplete="off"></label></div>`, visually hidden off-canvas. Never name it "company".
- Error region `<p class="su-err" id="su-err" aria-live="assertive">` always present; input gets `aria-describedby="su-err"`.

**Views (exact copy).** `{v}` = version from JSON-LD.
1. `mac` (Mac visitor, no saved email)
   - Kicker **"DOWNLOAD · v{v} · FREE"** · Title **"Where should ██████ go?"** with "updates" as the inverted-redaction word (text "Where should updates go?") · Lede **"Leave your email and the download starts right away."**
   - Label **"Email"** · CTA **"Download for Mac"** with meta **"Notched.dmg · v{v}"**
   - Fine print: **"Used only for Notched updates. Kept in the maker's Google Sheet, never shared or sold."** (the second sentence links to `#privacy`, closing the dialog first)
   - Requirements: **"macOS 14 or later · Apple silicon · notarized by Apple"**
   - Errors: blank → **"Add your email and the download starts."** · fails regex → **"That email doesn't look right. Check it and try again."** No download in either case; focus stays in the field. Typing clears the error.
2. `macDone`
   - Kicker: a 16px ring that fills then becomes a check (stroke-dashoffset, 900 ms; reduced: static check) + **"Notched.dmg · v{v}"** · Title **"On its way."** · Lede **"Open the DMG and move Notched to your Applications folder. Open it, agree to the licence, then flip the switch in your menu bar."**
   - Fine print: **"Didn't start?"** + link **"Download again"** (`href="/download"`).
   - Small text button **"Not you? Use another email"** (returns to `mac` with the field cleared and the saved email forgotten) · **"Done"** button (closes).
3. `macAway` (`noMac()` true)
   - Kicker **"MAC APP · v{v}"** · Title **"Get it on your Mac."** · Lede **"Notched runs on a Mac, not this {phone|tablet}. Send yourself the link and download it there."**
   - Label **"Email · optional, for updates"** (no `required`) · CTA **"Send the link to my Mac"** with meta **"notched.vercel.app"** and an up-arrow glyph.
   - Same fine print and requirements. Non-empty but invalid email → the regex error, nothing sent.
4. `macAwayDone`
   - Kicker: check + **"Link copied"** | **"Email saved"** | **"Mac app · v{v}"** (by what happened) · Title **"Open it on your Mac."** · Lede **"On your Mac, go to notched.vercel.app and download it there."** (prefixed with **"Paste the link into a message or a note to yourself. "** when it was copied) · secondary button **"Send it again"** · **"Done"**.

**Behaviour (order matters; mirror the Claude Meter logic):**
- `mac` submit: trim; regex `/^[^@\s]+@[^@\s]+\.[^@\s]+$/`. If valid: (1) start the download **synchronously in the submit handler** (so Safari keeps the user gesture): create `<a href="/download">`, `.click()`, remove; (2) fire-and-forget POST; (3) save `{ email }` to `localStorage['nt-signup']` (try/catch); (4) render `macDone`. A rejected or hanging fetch never surfaces and never blocks.
- POST: `fetch(document.querySelector('meta[name="nt-signup"]').content, { method:'POST', mode:'no-cors', keepalive:true, body:new URLSearchParams({ type:'mac', email, name:'', platform: navigator.userAgentData?.platform || navigator.platform, ref: 'notched' + (document.referrer ? ' · ' + document.referrer : ''), company: form.elements.nt_hp.value }) }).catch(() => {})`. `company` carries the honeypot value (the sheet's field name); the input is `nt_hp`.
- **Returning visitor** (saved email): clicking any Mac CTA starts the download at once (same synchronous anchor click inside the CTA's click handler, no POST) and opens the dialog directly in `macDone`. One click.
- `macAway` submit: validate if non-empty. If an email was given, POST it (same fields, `type:'mac'`) and save it. Then `navigator.share({ title:'Notched', text:'Notched: hide the MacBook notch. Download it on your Mac.', url: canonical })` when available. `AbortError` (share sheet dismissed) → stay on the form, no error. No `share` or it throws otherwise → `navigator.clipboard.writeText(canonical)` → `how:'copied'`; if that fails too → `how:'none'` (done view says "On your Mac, go to notched.vercel.app…", button reads "Send the link to my Mac"). The saved email pre-fills next time.
- Tab is wrapped inside the dialog (native modals let Tab escape to browser chrome). Return submits. `aria-labelledby="su-title"`, `aria-describedby="su-lede"`; on each view render, focus the title (`tabindex="-1"`) except the first `mac` render on fine pointers, which focuses the field.
- While open: `ScrollTrigger` keeps running (no Lenis to stop); `html { overflow: hidden }` + `scrollbar-gutter: stable` on `html` so nothing shifts.
- Never shown automatically. Only a click on a `[data-cta="mac"]` opens it.

**Mobile (< 768).** Same panel, `width: calc(100vw - 32px)`, hangs from the mobile nav's 96px notch. Max height `calc(100dvh - var(--mb-h) - 16px)`, internal scroll if needed. CTA 56px. No overflow at 320px (the CTA meta line wraps under the label).

---

## 7. SEO, meta, OG
- `<title>`: **Notched: hide the MacBook notch (free for Mac)** · description: **A free, open-source menu bar app that blacks out the macOS menu bar so the MacBook notch disappears into the bezel. macOS 14+, Apple silicon.**
- Canonical `https://notched.vercel.app/`; OG/Twitter large image `/assets/og.png` 1200×630 rendered from `web/og.html` with headless Chrome: black canvas, a band with notch across the top 48px, H1 **"Black out the ███████."** in Archivo 900 (redaction bar drawn), a strip of night-phase hills at the bottom, mono footer **"NOTCHED · FREE · MACOS 14+ · NOTCHED.VERCEL.APP"**.
- JSON-LD: keep SoftwareApplication (with `"softwareVersion":"…"` pattern exactly) + FAQPage (8 Qs above).
- `<head>` carries `<meta name="nt-signup" content="https://script.google.com/macros/s/AKfycbyYJTV8Mm_N77moH5FPesW6b_7Khdt2XHBn9IvVHSbHGw43RxAkXjgibvvWu-QkzNuMRA/exec">` (exact, from FACTS). `site/llms.txt` is untouched; if the lead wants it, one line "The download page asks for an email, used only for update notices" can be added there by the lead.
- **Version single source:** `build.mjs` reads the `"softwareVersion":"x.y.z"` value from the *existing* `site/index.html` (the release script rewrites it there) and injects it into the template's JSON-LD and all `[data-version]` fallbacks, so a release bump survives a rebuild. `version.js` re-fills at runtime. Note: this worktree's `site/llms.txt`, `site/downloads/` and the `/download` redirect still say 1.0.1 while FACTS says 1.0.2. Don't hand-edit these; the lead reconciles them with `main` before deploy.
- `site/vercel.json`: keep the existing redirects and headers; add `{"source":"/fonts/(.*)","headers":[{"key":"Cache-Control","value":"public, max-age=31536000, immutable"}]}` and the same for `/vendor/(.*)`; `/css` and `/js` get `public, max-age=3600, must-revalidate`.
- No-JS: every section's text is in the HTML; the hero shows the CSS wallpaper with band 0, and FAQ `<details>` work natively.

---

## 8. Accessibility
- Full reduced-motion path per section (above). No autoplay loops under reduced motion; every state is still reachable through the popover.
- The popover is fully keyboard-operable with visible focus; status line `aria-live="polite"`. Decorative screens are `role="img"` with one label; marquees are `aria-hidden` with an sr-only static copy.
- Contrast: paper/black 18:1, mute/black 6.4:1, mute-paper/paper 5.9:1. Hero H1 colour flips with phase luminance (QA screenshots at dawn, day, dusk and night via `?t=0|.33|.66|1` override param, which `phaseFromClock` honours).
- Targets ≥ 44px on touch. No horizontal overflow at 320px (`html{overflow-x:clip}` is a last resort; QA `--overflow` must pass without it).
- The redaction is visual only: "notch" stays in the accessible name of the H1 (same for "updates" in the dialog title).
- Email dialog: native `<dialog>` modal, labelled/described, Tab wrapped, Esc closes, focus returns to the opener, errors announced via `aria-live="assertive"`, inputs ≥ 17px, targets ≥ 44px. QA opens it on desktop and at 320px, tabs through it, submits blank/invalid/valid (stub the endpoint in QA by overriding the meta to `about:blank` so nothing reaches the sheet) and checks that the `/download` request fires on valid submit before any POST resolves.

---

## 9. Performance plan
- **JS budget:** vendor ≈ 60 KB gz (gsap 28 + ScrollTrigger 17 + SplitText 7 + CustomEase 2.5 + ScrambleText 3), site code ≤ 70 KB gz, total ≤ 130 KB gz (budget 350). No WebGL, no Lenis.
- **Fonts:** 2 variable files ≤ 200 KB; Archivo preloaded; fallback metrics set.
- **Signup:** `signup.js` is not in the initial graph; `cta.js` (≤ 1.5 KB) prefetches it on the first CTA hover/focus and imports it on click. Opening the dialog costs no layout outside the dialog.
- **Images:** only `claude-meter.png`, `icon-*.png` (favicons), `og.png` and `grain.png`. Every wallpaper is CSS/SVG.
- **Rendering:** wallpaper time changes animate opacity across 4 pre-painted layers (no gradient repaint); sun and hills animate by transform; band and text flips use `clip-path: inset()` (composited in Chromium/Safari). `backdrop-filter` only on fake menu bars and the popover (small areas), switched off on `.mob` hero below 900px (solid `rgba(255,255,255,.55)` instead).
- **Loops:** all loops (marquees, dynamic drift, LED, grain steps) pause offscreen through `whenVisible` and on `visibilitychange`.
- `content-visibility: auto; contain-intrinsic-size: auto 900px` on `#how`, `#privacy`, `#faq` (not on pinned or sticky sections).
- **Targets:** LCP < 2.0 s (the H1 is the LCP text), CLS < .02 including pin enter/exit, 60 fps on the hero scrub on an M1 Air, ≥ 50 fps on a mid Android at 4× throttle; no long task > 120 ms after load.
- **QA** (`web/qa.mjs` adapted from `~/.claude/skills/awwwards-site/qa.mjs`): viewports 1440×900, 1280×800, 390×844, 320×640; `--reduced`, `--overflow`; frame bursts inside the hero pin, the features list and the download fill; phase overrides `?t=0,.33,.66,1`; a popover pixel check (screenshot at DPR 2, side by side with `popover-dark.png` / `popover-light.png`).

---

## 10. Build/ownership map
| Owner | Files |
|---|---|
| Architect / integrator | `web/index.html` (template, `<!-- @section:<id> -->` markers, nav, footer, JSON-LD, head inline phase script), `web/build.mjs`, `web/qa.mjs`, `web/og.html`, `site/css/tokens.css`, `site/css/base.css` (nav, cta, footer, grain, pill, utilities), `site/js/main.js`, `site/js/lib/*` (incl. `cta.js`, `signup.js` and the `.su` dialog CSS in `base.css`), `site/vendor/*`, `site/fonts/*`, `site/assets/grain.png`, `site/vercel.json` additions, `.gitignore` (`web/node_modules`). Deletes `site/style.css`, `site/demo.js`, `site/og.html` once replaced. |
| Builder per section | `web/sections/{hero,ticker,tryit,features,how,privacy,faq,download}.html`, `site/css/<id>.css`, `site/js/<id>.js` |
Untouched: `site/downloads/*`, `site/llms.txt` (except via release script), `site/robots.txt`, `site/sitemap.xml`, existing `vercel.json` rules. Nobody deploys.
