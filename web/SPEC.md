# Notched site: master spec ("Pull the black down")

Owner: executive creative director (final say). Bar: Awwwards Site of the Day.
Law: `web/FACTS.md` (Swift wins over FACTS; flag, never invent). Every number on the page comes from FACTS.
**Client decision 2026-10-06 (wins over every older line anywhere):** every Download for Mac CTA asks for an email first (section 4.7). The download never waits on the network. It is the one form on the site. There are no analytics.

Inputs judged: `web/specs/cinema.md` ("Lights down"), `web/specs/play.md` ("Pull the black down"), `web/specs/type.md` ("REDACTED"), the five reference teardowns and `trends.md` in the scratchpad `research/`.

---

## A. Scores and rationale

Each criterion is scored out of 10.

| Spec | Originality | Product story clarity | Conversion | 60 fps feasibility | Fit to client refs | Total /50 |
|---|---|---|---|---|---|---|
| **PLAY** | 9 | 8 | 8 | 6 | 9 | **40** |
| CINEMA | 7 | 8 | 7 | 8 | 7 | 37 |
| TYPE | 7 | 8 | 7 | 8 | 7 | 37 |

**Why PLAY is the base.**
- **It has the one idea a juror will repeat:** the site has Notched installed on itself. You pull the black out of the notch, the black menu bar stays as the nav, and the popover you operate changes the website you are on. Pick Large and the site's own corners grow. Tick "Hide menu bar icon" and the site's own icon goes away.
- **It fits the references best.** Hoy and Monocle invite you to touch ("shake to activate"), Alcove and Monocle put the product in your hand, and Apple and Wispr give scroll-driven product stages. PLAY is the only spec that does all of them.
- **Its weaknesses are cuttable.** It ships two extra plugins (Draggable and Inertia, about 16 KB gz), carries a custom spring solver and has too many toys. None of these is structural.

**Why not CINEMA.** Its craft is excellent: the screen spill, the rim light as the notch's only edge, the exploded planes and the fade-to-black finale. But its organising metaphor (scene slates, the boom mic, the matte, "questions from the back row") is a costume over the product. Jurors call that theme-park. We keep its craft and drop the costume.

**Why not TYPE.** It has the strongest typographic system: `bandText`, condensed figures, privacy statements turned into menu bars, and the black to paper to black rhythm. But "redaction" means censorship, which is the wrong feeling for a delight utility. Its ticker and giant marquee are the 2025 cliché the trend report warns about. We keep its tools and its paper interlude and drop the redaction framing.

**Grafts into the PLAY base (6):**
1. **CINEMA: screen spill and rim light.** A blurred copy of each wallpaper lights the black page around it, which gives "light from black", Apple's move. The notch's only visible edge is a 1 px rim whose opacity is `1 - band`, so as the band completes the notch really is gone.
2. **CINEMA and TYPE: the finale.** The black band drops from the nav and eats the page, then the NOTCHED wordmark's notch-shaped bite closes. This replaces PLAY's pull cord.
3. **CINEMA: the exploded how-it-works.** Four 16:10 planes in CSS 3D with drawn leader lines and a slow orbit, and each plane's light spills onto the one above.
4. **TYPE: `bandText` as the house typographic tool and the paper interlude.** "No account. / No analytics. / One request a day." are swept into three black menu bars on paper. The FAQ also sits on paper, and the nav's fillets finally read against a light ground there.
5. **TYPE: the tweenable store and the live spec plate.** One store shape whose accessor props GSAP can tween, a live hero readout (`BAND 000%`) with digit rollers, and the version taken from one source at build time.
6. **TYPE: condensed chapter figures.** Each features chapter has a giant figure (`14 PT`, `2 S`, `Off.`) that rolls in step with the stage.

**Cut (cheesy, slow or generic):**
- Film slates (`SC.01`), the boom-mic and matte copy, and "questions from the back row".
- The ticker and the giant marquee.
- The pull cord, the deck flick, the inertia throws, Draggable and InertiaPlugin. The notch drag is about 30 lines of pointer events, and the time toy is a native range input.
- The custom spring solver. One-overshoot CustomEases and CSS `linear()` springs do the job.
- Magnetic CTAs, because they are Claude Meter's move.
- DrawSVG. Native `pathLength="1"` plus `stroke-dashoffset` does the same.
- The "black on both sides" toast, animated grain and scene counters.
- Lenis and WebGL. Mac trackpads already have inertia and Lenis is a cliché. The SVG wallpaper renders at any DPR in about 2 KB, and with up to 8 instances on the page, WebGL contexts would be a non-starter.

**One sentence for the juror:** "You pull the notch down, the whole website goes black at the top, and then it stays that way."

---

## B. Big idea

**The viewport is the screen. The menu bar is the nav. You pull the black down yourself.**

- **Opening.** The page opens on a MacBook screen-top at real-life scale: side bezels, the camera notch hanging from the top centre, and a translucent menu bar (`Notched File Edit View Window Help … clock`) over an original wallpaper of the app icon's hills, lit for the visitor's real local time.
- **The signature.** You grab the notch and drag down, or you just scroll, and a black band spreads out of the notch to both edges. Menu letters turn white exactly where the black passes under them, concave fillets curl in under the band's ends and the notch's rim light fades. That black bar then **stays as the site's navigation for the rest of the page**, and its fake menus scramble into real links.
- **Motion language: subtraction.** Things are absorbed into black. Nothing bounces out of the notch. Every competitor makes the notch grow; Notched makes it vanish.
- **Black is the material.** Page, bezel, band and notch are the same `#000`. The only colour on the page is wallpaper light, plus one paper interlude where black bars sweep across a light ground.
- **Static frames must look finished.** Every section's first and last scroll frame is a poster.

Kill on sight:
- The old layout: a centred icon over a title, a lone toggle over a small laptop, and a 4-up feature grid.
- Marquees, cursor blobs and loaders.
- The Apple logo, even as a silhouette. The menu bar's first item is the word **Notched**.
- Apple-like wallpapers and any number not in FACTS.

---

## 1. Design tokens (`site/css/tokens.css`, architect)

### 1.1 Fonts (self-hosted woff2, latin subset, `font-display: swap`, ≤ 200 KB total)
| Role | Family | Source | Axes used |
|---|---|---|---|
| Display and text | **Bricolage Grotesque** (variable) | `@fontsource-variable/bricolage-grotesque`, the file carrying `opsz,wdth,wght` (check with `fonttools ttLib` `fvar`; if `wdth` is missing, subset Google Fonts' `BricolageGrotesque[opsz,wdth,wght].ttf`) | Display: wght 760–800, opsz 96, wdth 100. Swallow: wdth 100 → 75. Body: wght 420, opsz 14. Lede: wght 480, opsz 24. |
| Mono (chips, readouts, spec plates, kickers) | **Martian Mono** (variable) | `@fontsource-variable/martian-mono` (wdth+wght file) | wght 450 at wdth 87.5 for chips; wght 600 for figures. Uppercase at ≤ 12 px, tracking +0.06em. |
| Recreated macOS UI only (popover, fake menu-bar items in the hero and nav) | `system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif` | none (no SF Pro files shipped) | as the OS provides |

- Subset command: `pyftsubset <ttf> --unicodes="U+0020-007E,U+00A0-00FF,U+2013,U+2014,U+2018,U+2019,U+201C,U+201D,U+2022,U+2026,U+00B7,U+00D7,U+2190-2193,U+2197,U+2318,U+2325,U+2588" --flavor=woff2 --layout-features='*'`. Output to `site/fonts/bricolage.woff2` and `site/fonts/martian-mono.woff2`.
- Preload Bricolage only.
- Add metric-matched fallbacks to kill CLS: `"Bricolage Fallback"` = `local("Arial")` with `size-adjust`, `ascent-override` and `descent-override` tuned once in QA, and `"Martian Fallback"` = `local("Menlo")`.
- **Banned:** Anybody, Instrument Serif/Sans, Geist, Geist Mono (Claude Meter's identity), Inter, Archivo.

### 1.2 Type scale (fluid)
| Token | Value | Use |
|---|---|---|
| `--t-mega` | `clamp(4.5rem, 21vw, 22rem)` / lh .8 / ls −.05em / wght 800 / wdth 100 | finale wordmark |
| `--t-hero` | `clamp(3.25rem, 9.2vw, 9.5rem)` / .88 / −.035em / wght 780 | H1 |
| `--t-figure` | `clamp(5rem, 18vw, 16rem)` / .8 / −.04em / Martian wght 600 wdth 87.5 | chapter figures |
| `--t-h2` | `clamp(2.4rem, 5.6vw, 5.5rem)` / .92 / −.03em / wght 740 | section heads |
| `--t-statement` | `clamp(2.4rem, 9vw, 9.5rem)` / .92 / −.04em / wght 800 | privacy statements |
| `--t-manifesto` | `clamp(1.9rem, 3.8vw, 3.6rem)` / 1.06 / −.02em / wght 650 | manifesto |
| `--t-h3` | `clamp(1.4rem, 2.2vw, 2rem)` / 1.05 / −.015em / wght 650 | chapter titles, FAQ summaries |
| `--t-lede` | `clamp(1.125rem, 1.6vw, 1.45rem)` / 1.4 / wght 480 | ledes |
| `--t-body` | `1.0625rem` / 1.55 / wght 420 | body |
| `--t-chip` | `.75rem` mono uppercase / 1.3 / +.06em | chips, kickers, readouts (≥ 12 px always) |

### 1.3 Colour
```css
:root{
  color-scheme: dark;
  --black:#000;                     /* page, bezel, band, notch: one black */
  --ink-1:#0A0A0B; --ink-2:#141416; /* raised surfaces on black */
  --line:rgba(255,255,255,.10); --line-2:rgba(255,255,255,.18);
  --fg:#F3F1EC;                     /* warm white text on black; also the paper background */
  --fg-2:#A9A7A1;                   /* secondary on black (8.4:1) */
  --fg-3:#8C8A85;                   /* captions ≥ 12px only (5.9:1) */
  --paper:#F3F1EC; --paper-line:#DEDAD2; --on-paper-2:#55534F;  /* paper sections (6.9:1) */
  --rim:rgba(255,255,255,.07);      /* 1px rim light on bezel and notch edges */
  --focus:#6BE3D0;                  /* focus ring on black: the icon's mint */
  --focus-paper:#0B57D0;            /* focus ring on paper */
  --error:#FF8A7A;                  /* error text on black (≥ 4.5:1), always paired with words */
  /* popover (macOS-faithful; sample exact values from site/assets/popover-*.png) */
  --mac-blue:#0A84FF; --mac-blue-light:#007AFF;
  --pop-dark-bg:rgba(30,30,30,.94); --pop-dark-text:rgba(255,255,255,.88); --pop-dark-2:rgba(235,235,245,.6); --pop-dark-3:rgba(235,235,245,.3); --pop-dark-ctl:rgba(255,255,255,.1);
  --pop-light-bg:rgba(246,246,246,.94); --pop-light-text:rgba(0,0,0,.85); --pop-light-2:rgba(60,60,67,.6); --pop-light-3:rgba(60,60,67,.3); --pop-light-ctl:rgba(0,0,0,.06);
}
body{background:#000;color:var(--fg)}
::selection{background:#fff;color:#000}
```
- The site is **black-first and does not flip with `prefers-color-scheme`**: one art-directed scheme (black → paper → black).
- Only the popover recreation follows the OS appearance, and the visitor can switch it in `#try`. It is the one place `prefers-color-scheme` applies.

### 1.4 Wallpaper palette (`lib/wallpaper.js`; procedural, original)
`t` runs 0..1 and wraps. Stops: dawn 0, day .25, dusk .5, night .75.
| Phase | sky top | sky mid | horizon | sun / moon | sun pos (x, y of glass) | stars |
|---|---|---|---|---|---|---|
| dawn | `#1D2858` | `#8B6CB2` | `#F6A88A` | `#FFD7A1` | 22%, 78% | .2 |
| day (the icon) | `#3B71FE` | `#76A9FF` | `#6BE3D0` | `#FFFFFF` soft | 70%, 20% | 0 |
| dusk | `#24204C` | `#C05479` | `#FF9C5B` | `#FFB36B` | 80%, 82% | .12 |
| night | `#04050E` | `#0D1536` | `#1E2C5A` | `#E9EDFF` moon | 24%, 18% | 1 |

- Day is exactly the app icon's gradient, so that palette is the brand.
- Hills are the two paths from `AppIcon.icon/Assets/hills.svg` (ours), scaled ×1.5625 to a 1600 viewBox:
  - `M0 700C200 610 380 640 560 700S880 790 1024 690V1024H0Z` (white .28)
  - `M0 840C240 760 470 800 660 850S920 900 1024 830V1024H0Z` (white .22)
  - At dusk and night the fills tint toward the horizon colour.
- `phaseFromClock(date)`: 05–08 h dawn, 08–17 day, 17–20 dusk, else night, interpolating inside each band. A `?t=0|.25|.5|.75` URL override exists for QA and OG rendering.

### 1.5 Shape, space, texture
- **Product radii:** `--r-s:10` `--r-m:14` `--r-l:20` (pt, × `--pt`). `--r-site` is the site's live fillet radius in px; default Medium, changed by the popover.
- **UI radii:** pills 999px, cards 28px, popover 13px (measure from the PNG: about 26 @2x), preview 8px, macOS push buttons 6px, inputs 12px.
- **Grid:** 12 columns, gutter `clamp(16px,2vw,32px)`, margin `clamp(16px,4vw,64px)`, max 1440 (full-bleed allowed). Mobile: 4 columns, 16 px margins. Section padding `clamp(96px,14vh,180px)`.
- **Grain:** `body::after` fixed full-viewport with `url(/assets/grain.png)` (128×128 mono noise, ≤ 6 KB, generated once by the architect from SVG `feTurbulence`), opacity .045, `pointer-events:none`, `z-index:90`. **Static**: no jitter.
- **Rim light:** `inset 0 1px 0 var(--rim)` on bezel edges, plus a 1 px rim on the notch outline. That is what makes black-on-black read as an object, and it is what fades when the notch dissolves.
- **Spill (from CINEMA):** behind every living screen there is a blurred copy of its wallpaper layers: `filter: blur(60px) saturate(1.3); opacity:.4; transform:scale(1.15)`. It is a static filter on a fixed-size element, and only its opacity animates. Below 900 px it is turned off first if the frame budget fails.

### 1.6 Motion tokens (registered in `lib/motion.js`)
| Name | Curve | Use |
|---|---|---|
| `out` | `cubic-bezier(.16,1,.3,1)` | UI, arrivals, uncovering |
| `inOut` | `cubic-bezier(.65,0,.35,1)` | camera moves, ghost cursor |
| `sweep` | `cubic-bezier(.76,0,.24,1)` | the band moving: sweeps, fills, bandText |
| `swallow` | `cubic-bezier(.7,0,.84,0)` | things sucked into black (accelerate in) |
| `fillet` | CustomEase `M0,0 C0.25,0 0.3,1.16 0.55,1.06 0.75,0.98 1,1` | fillets and the radius only: one overshoot (the one shape the app lets you change) |
| `knob` | CustomEase `M0,0 C0.3,0 0.2,1.12 0.6,1.02 0.8,1 1,1` | switch knobs, the segmented pill, toasts landing |

- CSS mirrors: `--e-out`, `--e-inout`, `--e-sweep`, `--e-swallow`. `--e-spring` is a `linear()` string generated from `knob`, with an `--e-out` fallback under `@supports not`.
- Durations: micro 160 ms, UI 260 ms, band 700 ms, reveal 800 ms, scene 1100 ms. The intro totals ≤ 1.1 s.
- Scrub smoothing: `0.9` hero, `0.6` default, `true` for clip edges that must track exactly (bandText, curtains).

---

## 2. Global motion system (architect owns `site/js/main.js`, `site/js/lib/*`, `tokens.css`, `base.css`, `product.css`)

### 2.1 Vendor (self-hosted `site/vendor/`, classic `<script defer>`, copied from `/Users/freemansmain/Ai Projects/Claude Meter/site/vendor/`)
- **Ship:** `gsap.min.js`, `ScrollTrigger.min.js`, `SplitText.min.js`, `CustomEase.min.js`, `ScrambleTextPlugin.min.js`. That is about 55 KB gz.
- **Do not copy:** Lenis, Draggable, Inertia, DrawSVG, Flip, MorphSVG, Observer.
- **No WebGL.**
- `main.js` is `type="module"` and reads `window.gsap`.

### 2.2 Rules
- Native scroll and ScrollTrigger only. **Pins are CSS `position: sticky`** inside tall sections, with ScrollTrigger reading progress. Never use `pin:true`, which avoids spacer CLS and keeps anchors and find-in-page working.
- Sticky tracks: hero 220vh, gone 160vh, features 6 × 85vh, how 220vh, download 160vh. There are no others.
- Animate only `transform`, `opacity`, `clip-path`, and custom properties feeding those. `font-variation-settings` animates on ≤ 8 characters at a time (the swallow only).
- `will-change` is added in `onToggle` while a trigger is active and removed on leave.
- Every scrubbed state is also reachable by click or keyboard (the popover, the chapter rail, the chapter toys, the hero switch link).
- `ScrollTrigger.config({ignoreMobileResize:true})`. `ScrollTrigger.refresh()` runs once after `Promise.race([document.fonts.ready, sleep(600)])`, never on a timer.
- One `gsap.matchMedia()` per section with conditions `{desk:'(min-width: 900px) and (prefers-reduced-motion: no-preference)', mob:'(max-width: 899px) and (prefers-reduced-motion: no-preference)', still:'(prefers-reduced-motion: reduce)', hover:'(hover: hover) and (pointer: fine)'}`. Every section implements desk, mob and still.
- Every loop (clock, wallpaper drift, star twinkle, dynamic-time drift, ghost cursor) pauses off-screen through `whenVisible` and on `visibilitychange`.

### 2.3 Section module contract
- `site/js/<id>.js` does `export default function init(root, ctx) { …; return cleanup }`.
- `ctx = { gsap, ScrollTrigger, SplitText, mm, reduced, settings, stores, lib }`, where `stores.hero` is the hero store and `lib` is the namespace in 2.4.
- `main.js`:
  1. Registers plugins and eases.
  2. Mounts the nav and the hero store.
  3. Runs `initCtas(document)`.
  4. Dynamically `import()`s each section module when its section comes within 1 viewport (IO rootMargin `100% 0px`).
  5. Calls `init` inside `try/catch` (one broken section must not kill the page).
  6. Runs `fillVersion()`.
- Section CSS is scoped under `#<id>`. Sections never style `html`, `body`, `.nav`, `.cta`, the dialog or another section.

### 2.4 Shared utilities (`site/js/lib/`, architect; sections import, never re-implement)
| File | Export | Behaviour |
|---|---|---|
| `motion.js` | `reduced()`, `onReducedChange(fn)`, `EASE`, `mm()` | Registers the eases. `reduced()` is live. Sets `html.still` under reduced motion. |
| `store.js` | `createStore(initial)` → `{state, get(), set(patch), subscribe(fn)→unsub}` | `state` exposes **accessor properties**, so `gsap.to(store.state, {band:1, scrollTrigger:{…}})` tweens it directly. Notifies are batched to one rAF. |
| `settings.js` | `settings` (a store) | Site-wide prefs written by the `#try` popover: `{on, corners:true, radius:14, dynamic:true, builtInOnly:false, rotate:false, every:3600, folder:'', loginItem:true, iconHidden:false, appearance}`. It writes `--r-site` on `<html>` (pt × `--pt`, px), toggles `html.icon-hidden`, and persists to `localStorage['nt-settings']` in try/catch (a per-viewer convenience only). |
| `wallpaper.js` | `PALETTE`, `PRESETS`, `phaseFromClock(date)`, `paintWallpaper(el,{preset})` → `{setTime(t), setPreset(id,{transition}), setParallax(x,y), destroy()}` | The wallpaper DOM (3.2). |
| `screen.js` | `createScreen(el, opts)` | The living screen (3.3). |
| `popover.js` | `createPopover(el, {store, mirror})` | The real menu-bar window (3.5). |
| `bandtext.js` | `bandText(el, {origin:'center'|'left'|'right'})` → `{set(p), setEdges(l,r), destroy()}` | **The house typographic tool.** It clones `el`'s content into an `aria-hidden` overlay of white text on a black bar. Both are clipped by `clip-path: inset(0 R 0 L)` computed from `p` and the origin. Letters flip white exactly where the black covers them, mid-glyph if needed. Used by the nav, the manifesto, privacy, the CTA hover, the FAQ, the finale and the footer. |
| `split.js` | `splitChars`, `splitWords`, `splitLines` | SplitText with masks and `autoSplit:true`. Split copies are `aria-hidden` and the real text stays for assistive tech. |
| `roll.js` | `roll(el, value, {duration=.45})` | Digit and word roller: each char in a 1em mask, the old one goes `yPercent -100`, the new one comes from 100, with `blur(2px)` mid-flight on ≤ 6 chars. Reduced motion swaps the text. |
| `clock.js` | `onClock(fn)` | One minute-aligned `setTimeout`. Formats `Tue 14:32` with `Intl.DateTimeFormat(undefined,{weekday:'short',hour:'2-digit',minute:'2-digit'})`. Client-only; the nodes are empty with a fixed width, so there is no CLS. |
| `visible.js` | `whenVisible(el, onIn, onOut, rootMargin='10%')` | One shared IntersectionObserver. |
| `toast.js` | `toast(text, {anchor, ms=1600})` | A black pill with mono white text that drops from the anchor (`knob`) and leaves upward into the notch (`swallow`). One at a time, in one `role="status"` region. Under reduced motion it fades in and out over 120 ms. |
| `ghost.js` | `ghost(steps, {root, idle=4000})` | A drawn arrow cursor (our SVG, 18 px, black with a 1.5 px white stroke) plays a click script once per page load, after `idle` ms with no input while `root` is ≥ 60 % visible. The first real `pointerdown`, `keydown` or `wheel` cancels it for good (sessionStorage). Never under reduced motion or on `(hover:none)`. |
| `version.js` | `fillVersion()` | Reads `"softwareVersion"` from the SoftwareApplication JSON-LD and writes `v{x}` into every `[data-version]`. |
| `cta.js` | `initCtas(root)`, `noMac()`, `DOWNLOAD='/download'`, `REPO` | See 4.7. Adapted from `/Users/freemansmain/Ai Projects/Claude Meter/site/js/lib/cta.js` (logic only; no notch-path tab, no magnet, no stars). |
| `signup.js` | `openSignup(opener, {viaPointer})` | The download sheet (4.7), lazy-loaded. Adapted from `Claude Meter/site/js/lib/signup.js` (logic only: drop windows views, the star nudge and Lenis). |

---

## 3. The product component (architect builds; sections consume)

### 3.1 Geometry (true to the hardware so it reads as real)
- **One unit:** `--pt` = CSS px per macOS point for an instance. It is `instanceWidth / 1512` (a 14" "looks like" width). The hero (viewport mode) overrides it:
  - Desktop: `clamp(.92px, .11vw + .62px, 1.25px)`, so the menu bar is about 37–46 px.
  - Phones: `min(.98px, (100vw − 176px) / 185)` in JS, so the notch leaves room for one item on each side at 320 px.
- **Menu bar:** `MB = 37pt`, min 22 px.
- **Notch:** `185pt × 32pt`, bottom radii `9pt`, top concave shoulders `3pt`.
  - Camera lens: a 7pt circle `#0B0F1A` with a 3pt `#24304A` ring and a 1.5pt specular dot, 15pt from the top.
  - All `#000`. Its only visible edge is `.notch__rim`, a 1 px `rgba(255,255,255,.12)` outline whose opacity is `--notch-rim`, which defaults to `1 − band` from band .7.
- **Band (exact to `WallpaperRenderer.swift`):** full width × MB, pure black, spreading **out of the notch**. `clip-path: inset(0 calc((1 − var(--band)) * (50% − var(--notch-w)/2)) 0 calc(...))`. At band 0 it is exactly the notch footprint; at 1 it is edge to edge.
- **Fillets:** concave quarter circles of radius r hanging under each band end. Path: `M0,0 H r A r r 0 0 0 0,r Z`, mirrored on the right. They scale 0→1 with `fillet` once band ≥ .98, leave before the band retracts, and are hidden when Round corners is off. `radius` maps Small/Medium/Large to 10/14/20 pt.

### 3.2 Wallpaper (`paintWallpaper`)
- **No gradient repaint.** Four stacked phase layers (`.wp-phase[data-p]`), each a 3-stop `linear-gradient` (top, mid, horizon). Time changes only their **opacity** (smoothstep between neighbours).
- **Sun and moon:** a radial-glow div moved by **transform** along an arc.
- **Stars:** an inline SVG of 40 seeded circles (fixed PRNG, deterministic for QA), opacity = night-ness. 3 twinkle at a time, only while visible and not reduced.
- **Hills:** an inline SVG (two icon paths plus a faint flipped back hill at .12), `preserveAspectRatio="xMidYMax slice"`.
- **Presets** (all original, same palette system): `hills` (default, the icon art), `dunes` (long low sines, warm), `tide` (one hill plus a flat horizon line with a mirrored 30 % reflection) and `ridge` (sharper peaks).
  - `setPreset(id,{transition:'slide'|'cut'})`: `slide` brings the new layer in from the right with `clip-path inset(0 0 0 100%) → 0` (700 ms `sweep`) **under a band that never moves**. That is the rotation point.
- **Parallax** (hero and `#try` mirror, hover devices only): back hill ±6 px, front ±14 px, sun ±20 px via `quickTo` (.8 s, `out`).
- **No-JS / first paint:** the server HTML carries the day layer plus the hills SVG inline. An inline `<head>` script writes `--t0` from `phaseFromClock` before first paint, so the right phase shows with no flash.

### 3.3 `createScreen(el, opts)` → Screen
```js
const s = createScreen(el, {
  store,                         // required: createStore({...SCREEN_DEFAULT}) — see below
  mode: 'viewport'|'display'|'mini'|'preview',
  //  viewport: the hero. The viewport is the glass; side bezels; the menu bar renders INTO the fixed .nav (one node, no seam)
  //  display : a framed screen-top (bezel 2.2% of width, 16:10, top 62% crop), externals laid out beside it
  //  mini    : small 16:10 card (features mobile cards, how planes)
  //  preview : the popover's in-window preview (304 wide, radius 8, separator border, no menu text, no spill)
  notch: true,                   // externals: false
  follow: false,                 // true: radius/corners/iconHidden/builtInOnly come from `settings`
  interactive: false,            // true: notch drag + click (3.4)
  parallax: false,
});
// SCREEN_DEFAULT = { band:0, radius:14, corners:true, time:'local', preset:'hills', displays:1, builtInOnly:false,
//                    menuText:'auto', notchRim:null /* null = derived from band */, status:'idle', iconHidden:false }
s.setBand(p, {duration})      // 0..1; duration 0 = immediate (scrub). Default tween 700ms sweep
s.setRadius(pt, {duration})   // 0|10|14|20 or any number for scrubs; fillet ease
s.setTime(t, {duration})      // 0..1 or 'local'
s.setWallpaper(id, {transition:'slide'|'cut'})
s.setDisplays(n, {duration})  // 1..3; externals slide in from x ±40% with `out`, 900ms, stagger .12, each band spreading from ITS centre 200ms after landing
s.setBuiltInOnly(bool)        // externals' bands retract (600ms swallow); built-in keeps its band
s.setMenuText('auto'|'dark'|'white')
s.setNotchRim(v|null)
s.setStatusIcon('normal'|'hidden')
s.pulse()                     // the "watching" ring from the Notched status icon: 1px white ring, scale 1→3.2, opacity .7→0, 900ms
s.process(ms=700)             // shimmer bar across the band slot (30° white-at-8% gradient, x −100%→200%); returns a Promise
s.flash(text, ms=1600)        // toast above this screen's notch
s.on('change'|'notchdrag'|'notchclick', fn)
s.el; s.store; s.destroy()
```
- **Implementation rule:** setters write `store`, and one subscriber writes CSS custom properties on `.screen` (`--band`, `--r`, `--notch-rim`, `--t`, `--pt`). They **never rebuild DOM**, so a scrub costs one `style.setProperty` per changed var per frame.
- **Menu text `auto`:**
  - The base layer is `#0B0B0C` at .85 when the current phase luminance is > .45 (dawn and day), else `rgba(255,255,255,.92)`.
  - The band overlay (via `bandText`, origin centre, edges = band clip) is always white, so letters flip exactly as the black passes.
  - With the band off, the bar is translucent: `rgba(255,255,255,.18)` with `backdrop-filter: blur(20px) saturate(1.4)`, solid `rgba(255,255,255,.5)` on mobile.
- **Menu items:** left is `Notched` (bold), then `File Edit View Window Help` (generic only, never other brands). Right is the drawn status glyphs (a sun/moon time glyph, a battery outline), the **Notched icon** (a 16×11 rounded screen with a filled top bar: our own SVG of the `menubar.rectangle` idea, not the SF Symbol file) and the clock.
- **Accessibility:** `.screen` is `role="img"`. Its `aria-label` is kept current by the component, e.g. "Screen preview: menu bar black, notch hidden, medium corners, dusk". Everything inside is `aria-hidden`.

### 3.4 The notch as an object (hero, display and mini when `interactive`)
- **Drag:** a 1.4× invisible hit target over the notch with `cursor:grab` and `touch-action:none` on the hit target only.
  - Plain pointer events, no Draggable. Vertical drag `dy` gives band `p = clamp(dy / (3·MB), 0, 1)`, with rubber resistance past 1 (`1 + √over · .08`).
  - The notch stretches while dragged: `scaleY 1→1.3`, `scaleX 1→.92`, origin top.
  - On release: `p > .4` → tween to 1 (`fillet`), else back to 0 (`swallow`). Landing at 1 fires `toast('Notch hidden.')` (the UI's own string).
  - The hit target is `aria-hidden`; the keyboard equivalents are the hero's "Try the switch" link and the popover switch.
- **Click (no drag):** the lens blinks (`scaleY 1→.1→1`, 180 ms). Toasts cycle: `There's nothing here. That's the point.` → `Still nothing.` → `You're very thorough.` → `Okay, it's a camera.` → back to the first.
- **Hero rule:** `band = max(scrollProgressBand, dragBand)`. Drag wins while held; on release the larger value holds until scroll passes it.

### 3.5 `createPopover(el, {store, mirror})`: pixel-faithful `SettingsView.swift`
Match `site/assets/popover-dark.png` and `popover-light.png` (2×, 680×1182 → 340×591). The PNGs show `v1.0.1`; render `[data-version]`. A QA-only `?ghost=1` overlays the PNG at 50 % for alignment.
- **Window:** 340 px wide, padding `20px 18px 18px`, radius 13, background `--pop-*-bg` with `backdrop-filter: blur(30px) saturate(1.6)`. Border is 0.5 px `rgba(0,0,0,.6)` plus an inner `inset 0 0 0 1px rgba(255,255,255,.10)` (dark). Shadow `0 24px 80px rgba(0,0,0,.55), 0 2px 8px rgba(0,0,0,.4)`. `system-ui` 13 px.
- **Rows, in order, verbatim strings:**
  1. `Notched` (17 px/600, title3 semibold), then on the right `<button role="switch" aria-checked aria-label="Hide the notch">` (38×22, `--mac-blue` on / `--pop-*-ctl` off, 20 px white knob, `knob` 260 ms).
  2. **Preview:** `createScreen(…,{mode:'preview', follow:true})`, 304 × 197, radius 8, 0.5 px separator border, notch drawn on top. It shows the band as a thin black strip at its top when on, as in the PNG.
  3. **Status** (13 px secondary, `aria-live="polite"`, with a 10 px spinner while processing):
     - Off: `Turn on to blacken the menu bar so the notch blends in.`
     - Processing: `Processing wallpaper…` (preview `process(700)`). With Use dynamic wallpapers on: `Processing dynamic wallpaper… this takes a few seconds.` (1400 ms).
     - On: `Notch hidden. New wallpapers are handled automatically.` After 4 s it settles to `Notch hidden.` (the Swift's resting line, which the PNG shows).
     - Off after on: `Wallpaper restored. Other Spaces get theirs back when you visit them.`
  4. Divider.
  5. ☑ `Use dynamic wallpapers` with caption `Keeps time- and appearance-based wallpapers changing. Takes longer to process.` While on and visible, the mirror and preview time drifts one full day per 36 s. Off freezes it.
  6. ☑ `Round corners` with a segmented control `Small | Medium | Large` (`role="radiogroup"`, arrow-key roving; the selected pill slides with `knob`).
     - It is disabled at 40 % opacity when Round corners is off, as in `.disabled(!corners)`.
     - It writes `settings.radius`, so the site's own nav fillets change too, and the mirror flashes `Corners · 20 pt`.
  7. ☐ `Built-in display only`. The mirror's external band retracts.
  8. ☐ `Rotate wallpapers` with caption `macOS can't shuffle under the black bar, so Notched rotates your pictures itself.` When checked, a row expands (`grid-template-rows 0fr→1fr`, 240 ms):
     - `Choose Folder…`. In the demo it picks a built-in sample set: the label becomes `Sample wallpapers`, with toast `On your Mac, this opens a folder picker.`
     - `<select>` with `5 min / 15 min / 30 min / Hourly / Daily` (default Hourly).
     - `Next`, disabled unless a folder is chosen **and** the switch is on (the Swift rule). It runs `setWallpaper(next,{transition:'slide'})`.
  9. Divider. ☑ `Start at login` (cosmetic). ☐ `Hide menu bar icon` with caption `Open Notched again to bring it back.` This **hides the Notched icon in the site's own nav** (`html.icon-hidden`). Clicking the `Notched` word in the nav brings it back with toast `Welcome back.`
  10. Divider. Footer:
      - `Check for Updates…` (small bordered button) gives toast `You're on v1.0.2, the latest.` (version from `data-version`).
      - On the right, `v1.0.2` (tertiary), then `Quit`.
      - `Quit` shrinks the popover into the mirror's Notched icon (`swallow`, 260 ms), shows toast `It's a website. It can't quit.`, then brings it back (`knob`, 320 ms).
- **Controls:** checkboxes are real `<input type=checkbox>` with `<label>` and `appearance:none`, 14×14, radius 3.5, blue with a white SVG tick. Focus is macOS-like: `0 0 0 3px rgba(10,132,255,.5)`. Tab order is visual, Space toggles, and rows on touch are padded to 44 px hit areas (visual size unchanged).
- **API:** `p.set(patch)`, `p.on('change',fn)`, `p.setAppearance('dark'|'light')` (200 ms cross-fade), `p.highlight(name)` (a soft blue ring pulse on one control).
- **Not recreated:** the "Move Notched to your Applications folder…" warning (it is conditional) and "Update to Notched x.y…" (the site is the latest).

---

## 4. Global elements (architect)

### 4.1 Nav = the hero's menu bar (`<header class="nav">`, fixed, height MB)
- **One DOM node:** the hero screen in viewport mode renders its menu bar here, so there is no hand-off seam. The nav reads `stores.hero.band` and uses `bandText` (origin centre), so the band grows out of the nav's own notch, which is fixed at top centre inside the header.
- **Before the band:** translucent bar over the wallpaper with dark or light text by phase. Items:
  - Left: `Notched` (bold) `File Edit View Window Help`.
  - Right: the time glyph (button: cycles dawn → day → dusk → night for every screen on the page, 900 ms lerp; `aria-label="Change time of day"`), the Notched icon (button: scrolls to `#try` and `highlight('switch')`), and the clock.
- **At band = 1 (hero progress .42; crossed both ways, not scrubbed):**
  - The fake menus **ScrambleText** (chars `▮▯·`, 500 ms, 60 ms stagger) into real links: `File`→`How it works` (#how), `Edit`→`Features` (#features), `View`→`Try it` (#try), `Window`→`FAQ` (#faq), `Help`→`GitHub ↗` (repo, new tab).
  - A compact white `Download` pill (28 px tall, `<a class="cta cta--nav" href="/download" data-cta="mac">`) rolls in before the clock.
  - Scrolling back up scrambles everything back.
  - Reduced motion and no-JS: the real links and the pill are there from the start (the HTML ships the real links; JS swaps to the fake menus only when it will animate them).
- **Fillets under the nav ends**, radius `--r-site`, present whenever the band is 1 (the whole page after the hero). On black sections they are black on black, honest and invisible; over paper sections they read clearly. Changing the radius in the popover tweens them with `fillet`. This is the site's permanent signature.
- **Notch hover after the hero** (desktop): tooltip `Still here. You just can't see it.` (mono pill, 1.2 s delay).
- **Mobile (< 900 px):**
  - Left `Notched` and the notch at centre.
  - Right: a `Menu` text button, which opens a full-screen black sheet dropping from the bar (`clip-path inset(0 0 100% 0) → 0`, 450 ms `sweep`) with the links at `--t-h2` (stagger 40 ms, `out`), plus the CTA.
  - The clock is hidden below 400 px. There is no Download pill in the bar; the sheet carries it.
- A skip link `Skip to content` is the first tab stop.

### 4.2 Bezel (hero only)
- The viewport top edge is the top of the glass. During the hero there are left and right black bezel strips (`--bezel: 10px` desktop, `6px` phones) and two outer top-corner masks (glass radius 18pt).
- Over hero progress .75→1 the strips translate outward by their width and the corner masks scale to 0 (transform only), as if the camera moves through the screen.

### 4.3 Intro (≤ 1.1 s, never gates content; first paint is already the finished first frame)
| ms | What |
|---|---|
| 0–200 | Everything black except the bezel rim and the camera lens; the lens's specular dot slides across (a glint). |
| 120–700 | The screen wakes: wallpaper opacity 0→1, `brightness(.35)→1`, `clip-path: circle(0% at 50% 0%) → circle(150% at 50% 0%)` (light spreading out from the notch, `out`). The spill blooms in 200 ms later. |
| 450–850 | Menu items `y −6→0` plus opacity (35 ms stagger); the clock digits roll in. |
| 650–1100 | H1 lines rise from masks (`yPercent 105→0`, 80 ms stagger, `out`); the lede, CTAs and chips follow (opacity, `y 12→0`). |
- `html.intro` is set by an inline head script and removed at 1.1 s or on first input.
- A repeat visit in the same session (`sessionStorage`, try/catch) gets a 400 ms opacity-only version. There is no intro when `location.hash` is set or under reduced motion.

### 4.4 Cursor
No custom cursor, no blob, no magnet. The pointer only moves light inside the product (parallax). `grab`/`grabbing` applies on the notch only.

### 4.5 Cross-promo pill (desktop ≥ 900 px, fixed bottom-right, 16 px inset)
- A black pill, 1 px `--line-2`, 40 px tall: `assets/claude-meter.png` (20 px, rotated −6°) plus `Claude Meter ↗` (mono 12 px).
- On hover its width extends (`knob`) to `Your Claude limits, in the notch ↗`.
- `aria-label="Claude Meter: puts your Claude usage limits right in the MacBook notch (opens in a new tab)"`, linking to `https://claudemeter.vercel.app/?ref=notched` with `target=_blank rel=noopener`.
- It appears after the hero (`y 16→0`, 400 ms) and hides while `#download` is ≥ 30 % in view.
- `×` dismisses it (sessionStorage).
- On phones it is not rendered; the finale and footer carry the link.

### 4.6 Primary CTA (`.cta`, architect; used by the hero, the nav, the sheet and the finale)
- **Markup is always** `<a class="cta" href="/download" data-cta="mac"><svg class="cta__arrow" aria-hidden="true">…</svg><span class="cta__label">Download for Mac</span></a>`, with no `download` attribute (the Vercel redirect serves the DMG). It works without JS.
- **Look:** a white pill (`--fg` background, black text), Bricolage 640 17 px, 56 px tall (`.cta--lg` is 64 px / 20 px), padding 0 28 px, gap 10 px. The icon is a drawn 16 px arrow-into-tray, never an Apple glyph.
- **Hover (`hover` media):** `bandText(label,{origin:'left'})` sweeps a black bar in over 420 ms (`sweep`), turning the pill black with white text and a 1 px `--line-2` edge. On leave it exits to the right.
- **Active and focus:** active is `scale .97`. Focus-visible is a 2 px `--focus` outline at 3 px offset (`--focus-paper` on paper).
- **Phones and tablets:** `initCtas` relabels every CTA `Get it on your Mac` and points the arrow up (the nav sheet's CTA too).

### 4.7 The download sheet (the email ask; architect owns `lib/cta.js`, `lib/signup.js`, `css/sheet.css`; FACTS "Download email ask" is law)

**Contract (`cta.js`, loaded with main):**
- Delegated listeners on `document`:
  - `pointerover` and `focusin` on any `[data-cta="mac"]` warm `import('./signup.js')`.
  - `click` (left button, no modifiers, not `defaultPrevented`) runs `preventDefault()` then `openSignup(el,{viaPointer: e.detail>0})`.
  - **If the import fails, `location.href = '/download'`.** Never block the download.
- `noMac()` = `navigator.userAgentData?.mobile || /iPhone|iPod|iPad|Android/.test(UA) || (/Macintosh/.test(UA) && navigator.maxTouchPoints > 1)`. When true, `initCtas` relabels every Mac CTA (4.6).
- No-JS: the link downloads directly, with no email ask (flagged in section 11).

**Shape: the notch opens.** One native `<dialog class="sheet" aria-labelledby="sheet-title" aria-describedby="sheet-lede">`, opened with `showModal()`. That makes the page inert; Esc and a backdrop click close it, and focus returns to the opener. In the top layer it draws:
1. **A band strip:** full-width black, height MB, sitting exactly over the real nav, with the notch at centre and fillets at `--r-site`. If the hero band is < 1 at open, this strip plays the band spreading out of the notch to both edges (260 ms `sweep`). Hitting Download makes the product do its trick on the way.
2. **The panel:** `#000`, a 1 px `--line-2` edge on its sides and bottom only (so it reads as the bar grown downward), `width: min(440px, 100vw − 32px)`, hanging from the band's bottom edge at centre, bottom radii 28 px.
   - Two concave fillets (radius `--r-site`) join it to the band at its upper corners.
   - `max-height: calc(100dvh − MB − 16px)`, scrolling inside.
   - It is top-anchored, so the on-screen keyboard never covers the field.
3. **`::backdrop`:** `rgba(0,0,0,.6)` with `backdrop-filter: blur(8px) brightness(.7)`, a 200 ms fade.

**Motion:**
- **Open (420 ms):** the panel's `clip-path` goes from the notch rect (`inset(0 calc(50% − notchW/2) calc(100% − notchH) round 0 0 9px 9px)`) to `inset(0 round 0 0 28px 28px)` on WAAPI with the `--e-spring` `linear()` curve (fallback `out`). The fillets scale in with `fillet` over the last 160 ms. Content rises (`y 8→0`, opacity, 40 ms stagger) from 55 %.
- **Close (260 ms):** the reverse, back into the notch with `swallow`, then the backdrop fades out. If a `#hash` link inside closed it, scroll there after close.
- **View swap:** old content fades (120 ms), the panel height tweens old → new (measured, WAAPI, 400 ms `out`) and the new content rises.
- **Reduced motion:** 120 ms opacity only.

**Panel content:** padding `28px 28px 24px` (22 on phones). Header row: the drawn Notched icon plus `Notched` (13 px, 640) on the left, a 44×44 `×` (`aria-label="Close"`) on the right.

**View `mac`** (Mac visitor, no stored email):
- Kicker (mono, `--fg-3`): `DOWNLOAD · v1.0.2 · FREE` (version from JSON-LD).
- Title `#sheet-title` (Bricolage 760, 32 px, ls −.03em, `tabindex=-1`): **Where should updates go?**
- Lede `#sheet-lede` (`--fg-2`): `Leave your email and the download starts right away.`
- Field: label `Email` (mono 12 px uppercase), then `<input name="email" type="email" required autocomplete="email" inputmode="email" autocapitalize="off" spellcheck="false" placeholder="you@example.com" aria-describedby="sheet-err">`.
  - Style: 52 px tall, `--ink-2` fill, 1 px `--line-2`, radius 12, 17 px text (no iOS zoom).
  - Focus: the border goes white, a 2 px `--focus` outer ring appears, and a 2 px black band slides across its top edge (200 ms).
  - Autofocus only with a fine pointer.
- Honeypot (visually hidden off-canvas, never named `company`): `<div class="sheet-hp" aria-hidden="true" inert><label>Leave this empty <input name="nt_hp" type="text" tabindex="-1" autocomplete="off"></label></div>`.
- Error `<p id="sheet-err" class="sheet-err" aria-live="assertive">`, always present.
  - Blank: `Add your email and the download starts.`
  - Fails the regex: `That email doesn't look right. Check it and try again.`
  - The input gets `aria-invalid="true"`, the border goes `--error` and the text is `--error`. The field shakes once (x ±3 px, 240 ms; none under reduced motion). **No download.** Typing clears the error.
- Button: `.cta.cta--lg` full width, `Download for Mac`, with meta under it (mono): `Free · macOS 14+ · Apple silicon`.
- Fine print (mono 12 px, `--fg-3`): `Used only for Notched updates. Kept in the maker's Google Sheet, never shared or sold.` The second sentence links to `#privacy` (closing the sheet first).

**Submit, valid email: strictly this order, synchronously in the submit handler, so Safari keeps the user gesture.**
1. Start the download: create `<a href="/download">`, `.click()`, remove.
2. Fire and forget, never awaited:
   ```js
   fetch(document.querySelector('meta[name="nt-signup"]').content, { method:'POST', mode:'no-cors', keepalive:true,
     body:new URLSearchParams({ type:'mac', email, name:'', platform: navigator.userAgentData?.platform || navigator.platform,
       ref:'notched' + (document.referrer ? ' · ' + document.referrer : ''), company: form.elements.nt_hp.value }) }).catch(()=>{});
   ```
3. Save `localStorage['nt-email'] = email` (try/catch).
4. Render `macDone`: the field's text scrambles to `▮▮▮▮` and the field collapses upward (`scaleY→0`, 280 ms `swallow`). Then a 22 px ring fills and settles into a check (`stroke-dashoffset`, 600 ms; static check under reduced motion).

A rejected or hanging fetch never surfaces and never blocks.

**View `macDone`:**
- Kicker: check plus `NOTCHED · v1.0.2`.
- Title: **On its way.**
- Lede: `Open the disk image and drag Notched to Applications. Open it, agree to the license, then click its icon in the menu bar and flip the switch.`
- Fine: `Didn't start? <a href="/download">Download again</a>`.
- A text button `Use a different email`, which forgets the stored email and shows `mac` with the field empty.
- `Source on GitHub` (GitHub glyph, small) and a `Done` ghost pill (closes).

**Returning visitor (stored email, Mac):** any Mac CTA click starts the download at once (step 1 only, no POST, inside the CTA's own click handler) and opens straight into `macDone` with an extra line under the title: `Updates go to you@example.com.` (escaped) plus a `Not you?` button, which behaves like `Use a different email`.

**View `macAway`** (`noMac()`):
- Kicker `MAC APP · v1.0.2`.
- Title **Get it on your Mac.**
- Lede: `Notched installs on a Mac, not this phone. Send yourself the link and open it there.` It says `tablet` on iPad, Android tablets and iPadOS.
- Field label `Email · optional, for updates` (not required). If filled it must pass the regex (same error copy).
- Button `Send the link to my Mac` with an up arrow and meta `notched.vercel.app`.
- Same fine print.
- **Submit:**
  1. If an email was given, the same POST (`type:'mac'`), then store it.
  2. Then `navigator.share({title:'Notched', text:'Notched: hide the MacBook notch. Download it on your Mac.', url:'https://notched.vercel.app/'})`. An `AbortError` (sheet dismissed) leaves you on the form with no error.
  3. If share is missing or throws otherwise, run `navigator.clipboard.writeText(url)`. If that fails too, show the URL as selectable text.

**View `macAwayDone`:**
- Kicker: check plus `Link copied` | `Shared` | `Email saved` (by what happened).
- Title **Open it on your Mac.**
- Lede: `On your Mac, go to notched.vercel.app and download it there.`, prefixed with `Paste the link into a note or a message to yourself. ` when the link was copied.
- `Send it again` (secondary) and `Done`.

**Rules:**
- Never shown automatically; only a click on `[data-cta="mac"]` opens it.
- On every view render, focus the title, except the first `mac` render on a fine pointer, which focuses the field.
- Wrap Tab inside the dialog. Return submits.
- While open, set `html{overflow:hidden; scrollbar-gutter:stable}` so nothing shifts.

---

## 5. Sections

Template order and ids (= file names): `hero`, `gone`, `try`, `features`, `how`, `privacy`, `faq`, `download`. Each builder owns `web/sections/<id>.html`, `site/css/<id>.css` and `site/js/<id>.js`. Real text is in the HTML for every section.

### 5.1 `hero`: "Black out the notch."
**Layout (desk).**
- `section#hero` is 220vh. `.hero__stage` is sticky at top 0, 100vh.
- The stage holds `createScreen({store:stores.hero, mode:'viewport', interactive:true, parallax:true, follow:true})`. The wallpaper fills the stage and fades to black at the bottom (`transparent 45% → rgba(0,0,0,.6) 70% → #000`), and the spill bleeds below.
- Content sits bottom-left (cols 1–8, left 6vw, bottom 9vh):
  - Chips (mono): `FREE · OPEN SOURCE · MACOS 14+ · APPLE SILICON · v1.0.2`
  - H1 (`--t-hero`, `--fg`, two lines): **Black out / the notch.**
  - Lede (`--t-lede`, `--fg-2`, max 34ch): `Notched paints a black strip the height of your menu bar into a copy of your wallpaper. The bar goes black, the text goes white, and the notch disappears into the bezel.`
  - Actions:
    - `.cta` **Download for Mac** (`data-cta="mac"`).
    - A ghost pill **Try the switch** → `#try` (1 px `--line-2`, white text).
    - Under them, mono `--fg-3`: `Free. No account. Notarized by Apple.`
  - Hidden caption under the H1 (mono, revealed later): `Gone. Well, it's still there. You just can't see it.`
- **Spec plate** (bottom-right, desk only, mono 12 px, right-aligned, live from the store, values in `--fg`, labels `--fg-3`, numbers via `roll()`): `BAND 000%` / `CORNERS 14 PT · DUSK` / `LOCAL TUE 14:32`.
- **Drag hint** (desk, near the notch): a hand-drawn SVG arrow curving up to the notch, with the mono caption `grab the notch and pull ↓`. It draws itself (`stroke-dashoffset`) 1.6 s after load and is removed for good after the first drag or once the band is on.

**Scroll (desk).** ScrollTrigger on `#hero`, `start:'top top'`, `end:'bottom bottom'`, `scrub:.9`.
| Progress | What happens |
|---|---|
| 0 → .06 | Hold, so you can breathe. Pointer parallax is live, and a drag wins (`band = max(scroll, drag)`). |
| .06 → .42 | `band 0→1` (`sweep`): black spreads out of the notch, nav letters flip white as it passes, and the notch rim fades from .7. The spec plate's `BAND` rolls 000→100%. |
| .42 | **Threshold**, triggered both ways, not scrubbed: fillets spring in (`setRadius(settings.radius)`, `fillet`); the nav scrambles into real links and the Download pill; `toast('Notch hidden.')` once per page view. |
| .40 → .62 | **"notch." is swallowed.** SplitText chars of `notch.`: each squeezes `wdth 100→75` and `scaleY 1→.2`, then translates to the notch's on-screen centre (deltas computed on refresh) with `swallow`, and opacity goes to 0 in its last 20 %. Stagger .03 from the centre out. A 1 px dashed `--line-2` rounded outline the size of the word holds the gap, and it fades by .7. |
| .62 → .80 | A white mono chip `GONE` (black text) ScrambleTexts into the gap (500 ms) and stays: `Black out / the [GONE].` The caption reveals (`clip-path inset(0 100% 0 0)→0`, `sweep`). |
| .10 → .80 | `time += .12` (the light drifts a little). |
| .75 → 1 | Bezel strips out (4.2); wallpaper `scale 1→1.08` and `brightness 1→.6`; the spill dims to .2; content `y 0→−8vh` and fades from .88. The black nav stays: same node, no seam. |

- The H1's accessible name never changes: split chars and the chip are `aria-hidden`, and the real text sits in an sr-only span.
- **"Try the switch"** scrolls to `#try`.
- **Mobile (< 900).**
  - 170vh, sticky 100svh, `--pt` per 3.1. The wallpaper fills the top 58svh then fades to black.
  - The H1 is `clamp(3.25rem, 15vw, 4.5rem)`, below the notch region with 16 px gutters.
  - The CTA is full-width 56 px and reads **Get it on your Mac** on phones.
  - Drag hint caption: `pull the notch ↓`; touch drag works.
  - Same timeline over 170vh. The swallow uses the whole word, not chars. No parallax and no spec plate.
- **Reduced.**
  - 100vh, no sticky. Render the end state: band 1, fillets at `settings.radius`, rim 0, real nav links, H1 intact (no swallow, no chip), caption visible, wallpaper at local time.
  - Below the chips, a text button `Show the notch` / `Hide the notch` toggles the band instantly. A notch click or drag also toggles instantly.
- **Posters:** progress 0 (wallpaper, notch, translucent bar) and progress 1 (black bar, GONE) must both look finished.

### 5.2 `gone`: the manifesto
**Layout.**
- Black, 160vh, sticky 100vh. Single column (cols 2–10), `--t-manifesto`, left-aligned.
- Eyebrow (mono): `QUIETLY, ON PURPOSE`.
- **Copy** (4 paragraphs):
  1. `The notch is fine. It's just always there.`
  2. `Right in the middle of your menu bar. In every app. All day.`
  3. `Notched can't remove it. It paints the bar around it black, and black is what the notch was all along.`
  4. `Flip one switch. Then forget it's installed.`

**Animation (desk and mob, scrub .6 over the section).**
- Every paragraph uses `bandText` with a horizontal **reading band**. Words start at `--fg` 16 % opacity, and a black bar with white text sweeps across each line in turn (line by line via `splitLines`; per line `p 0→1`, `sweep`), so words go from ghost to white exactly as the bar passes. The product's "text turns white", as reading.
- The word `black` in paragraph 3, once inked, gets a white pill behind it with black text (width `knob`), the band inverted.
- In paragraph 4, `Flip one switch.` becomes a link to `#try` once inked (a 2 px underline draws L→R, 600 ms `sweep`).

**Mobile:** 130vh, `clamp(1.9rem, 8vw, 2.6rem)`.
**Reduced:** no sticky; all text at full `--fg`, pill static, link underlined.

### 5.3 `try`: "Go on. Flip it."
**Layout (desk).**
- Black, normal flow, min-height 100vh.
- Head (cols 1–6):
  - Eyebrow `THE REAL THING, MORE OR LESS`
  - H2 **Go on. Flip it.**
  - Sub (`--fg-2`): `This is Notched's menu bar window, rebuilt for the browser. Every switch works, and everything you change here also changes this website. Nothing here touches your Mac.`
- Grid:
  - Cols 1–8: the **mirror**, `createScreen({store:tryStore, mode:'display', interactive:true, parallax:true, follow:true})`, wallpaper `hills`, local time, `displays:2`. The external is half-cropped by the left edge, at 40 % scale behind, so Built-in display only has something to act on.
  - Cols 8–12: the popover at its real 340 px, positioned **as if dropped from the mirror's Notched icon** (top = the mirror's menu-bar bottom + 6 px). A 1 px connector line runs from the icon down to the popover top. While open, the icon shows the highlighted capsule (`rgba(255,255,255,.2)`, radius 4).
- Under the mirror, a live mono plate: `BAND ON · CORNERS MEDIUM 14 PT · DISPLAYS ALL`, scrambling on change (300 ms).
- Under the popover, a mono segmented control `DARK | LIGHT` (default from `prefers-color-scheme`) runs `p.setAppearance`.
- Caption beside the popover while idle: `It works. Try it.` It fades after the first input.
- **Wiring:**
  - `tryStore.band` follows `settings.on` (via the popover's switch sequence in 3.5: status "Processing…", then `process()`, then `setBand(1)` over 700 ms `sweep`, then the "Notch hidden…" status; off retracts into the notch over 600 ms `swallow`).
  - Everything else follows `settings`, so the change also reaches the hero (if you scroll back), the nav fillets and icon, and the features stage radius.
  - On each change the mirror runs `flash()`: `Corners · 20 pt`, `Built-in display only`, `Wallpaper rotated`.

**Animation.**
- Enter (once, `top 70%`):
  - The mirror is uncovered top-down by `clip-path inset(0 0 100% 0)→0` (900 ms `sweep`, a band dropping).
  - The popover drops from the icon (`scaleY .6→1`, origin top, opacity, 520 ms `knob`) like a menu opening, and the connector draws.
- **Camera reacts to the controls:**
  - Switch on: the mirror pushes in briefly toward the notch (`scale 1→1.025→1`, 600 ms `out`).
  - Radius change: a 500 ms focus pull (`blur(2px)` on everything but the top-left corner via a masked overlay, then back).
- **Ghost cursor** (desk, hover devices): `ghost([...], {root, idle:3500})`:
  1. Glide to the switch (900 ms `inOut`), press (scale .9), and the switch flips.
  2. 1.2 s later, glide to `Large` and click it.
  3. Rest off to the side and fade.
  - It plays once and is cancelled forever by real input.

**Mobile.**
- Stack: head, then the mirror (full width, notch-region crop zoom 2×, no external), then the popover at `min(340px, 100vw − 32px)`. The popover is real HTML that reflows; below 372 px use `transform: scale((100vw − 32px)/340)` with a height compensator, so there is no overflow at 320.
- A mono note under the mirror: `(No external display here. On your Mac, each one gets its own band.)`
- No ghost. Instead the switch does one gentle `x` wiggle on enter.

**Reduced:** no entrance, no ghost, instant state changes, toasts fade.

### 5.4 `features`: "Set it once. It keeps up."
**Layout (desk).**
- `section#features`, 6 chapters, each `min-height:85vh`.
- Left (cols 1–5): the chapters.
- Right (cols 6–12): a **sticky stage** (`top: calc(MB + 6vh)`, height 76vh) holding one `createScreen({store:featStore, mode:'display'})`, with `perspective(1600px) rotateX(6deg)`, the spill, and a mono readout plate at its bottom-left.
- Head above the columns: eyebrow `WHAT IT HANDLES`, H2 **Set it once. It keeps up.**
- **Chapter rail** (far left of the stage, mono 12 px): `01 DYNAMIC / 02 DISPLAYS / 03 CORNERS / 04 ROTATION / 05 WATCHING / 06 OFF`.
  - The active item gets a black band chip behind it with white text, and its bar is 28 px tall (`knob`). Inactive items are `--fg-3`.
  - Each item is a `<button>` that scrolls to its chapter (`scrollIntoView({block:'center'})`, instant under reduced motion).
- **Each chapter:** mono number, then the **figure** (`--t-figure`, rolling with the stage), then the H3, then the body (`--fg-2`, max 36ch), then one **toy** (a real control).
- Stage states are **absolute per chapter** (each sets every prop it cares about), so jumping works.
- **Scrubbing:** each chapter's ScrollTrigger (`start:'top 60%'`, `end:'bottom 40%'`, scrub .6) drives the stage. Figure swaps run on each chapter's `onToggle` (`start:'top 55%'`): the outgoing figure is swallowed upward (`yPercent −100`, mask, 350 ms `swallow`) and the incoming one is uncovered from below (500 ms `out`).

| # | Figure | H3 | Body (exact) | Stage (scrubbed across the chapter) | Toy | Readout |
|---|---|---|---|---|---|---|
| 01 | `06:00` rolling to `21:40` (from t; illustrative clock of the wallpaper, not a product claim) | **Dynamic wallpapers keep moving.** | `Time-of-day and light/dark wallpapers keep every frame and their own schedule, so your desktop still drifts from morning to night under a black bar. The first pass takes a few seconds.` | Band 1 throughout. `setTime(0→.95)`: dawn → day → dusk → night; the sun arcs and sets, stars come up, the menu text stays white. At start: `flash('Processing dynamic wallpaper… this takes a few seconds.')`. | A native `<input type="range" aria-label="Time of day">` styled as a thin arc with a sun knob. Dragging it overrides scroll until the chapter is left. | `PHASE DAWN → DAY → DUSK → NIGHT` |
| 02 | `1` rolling to `3` | **Every display. Every Space.** | `Each screen gets its own copy at its own resolution. Other Spaces are fixed up when you visit them. Prefer just the laptop? Tick Built-in display only.` | 0–.55: camera pulls back (`scale 1→.62`); `setDisplays(1→2→3)` at .2/.45, externals slide in, each band spreading from its own centre. .7: a stage chip `☐ Built-in display only` ticks and the externals' bands retract. | That chip is a real checkbox; click it back and forth. | `DISPLAYS 3 · BUILT-IN ONLY OFF/ON` |
| 03 | `14` with `PT`, rolling 10 → 14 → 20 | **Rounded corners, if you like.** | `Concave curves under each end of the band, so the desktop reads like a rounded screen. Small, Medium or Large: 10, 14 or 20 points. On by default, at Medium.` | The camera pushes in hard on the left band end (inner `scale 1→3.2`, origin there, `inOut`). `setRadius` steps 10→14→20 at .3/.55/.8 with `fillet` overshoot; a thin `--focus` dimension arc with tick marks draws on the fillet (`stroke-dashoffset`). Zoom back out at .9. | Three mono numerals `10 · 14 · 20` (a radiogroup). Clicking one sets the stage **and** `settings.radius`, so the site's own nav fillets change too. | `RADIUS 14 PT · MEDIUM` |
| 04 | `Hourly`: ScrambleText cycling `5 min → 15 min → 30 min → Hourly → Daily` | **It shuffles for you.** | `macOS can't shuffle wallpapers under a black bar, so Notched rotates a folder itself: every 5 minutes, 15, 30, hourly or daily, or right now with Next. A shuffle folder you already set in System Settings is taken over automatically.` | Zoom 1. `setWallpaper` steps hills → dunes → tide → ridge at .2/.45/.7, each `slide`: the new picture wipes in under a band and fillets that **never move**. | A `Next` button (black pill, white text) runs `setWallpaper(next)`. | `WALLPAPER 2/4 · EVERY HOUR` |
| 05 | `2 S`, counting 2 → 1 → 0 | **Change it. Wait two seconds.** | `Notched checks your wallpaper every two seconds. Pick a new picture and the bar is redone within about two seconds. Nothing to click.` | .2: the wallpaper **cuts** to a new preset with **no band** (band 0, rim back, notch visible, menu text dark: the problem, briefly). .3: `pulse()`. .3–.6: a 2 s ring runs round the status icon (`stroke-dashoffset`). .6: `process()` shimmer, then the band sweeps back out of the notch (scrubbed to .8). | A `Change wallpaper` button replays the cycle in real time (`setTimeout(2000)`). | `CHECKS EVERY 2 S` + a live dot blinking once per real 2 s while active |
| 06 | `Off.` | **Off means off.** | `Switch Notched off and your own wallpaper comes back. Other Spaces get theirs back the next time you visit them while Notched is running. Your original files are never edited.` | Fillets out first, then `setBand(1→0)` retracts **into** the notch (`swallow`); the menu text flips back to dark, the rim returns and the notch is visible, exactly as the page began. Camera pushes slightly to the notch (`scale 1→1.15`). `flash('Wallpaper restored. Other Spaces get theirs back when you visit them.', 2200)`. | A `Switch it back on` text button replays the band on. | `ORIGINAL RESTORED` |

- Small print under chapter 06 (`--fg-3`, 14 px): `Aerial, color and other live wallpapers are drawn by macOS, so Notched leaves them alone. Placement (fill, fit, stretch or center) stays exactly as you set it.`
- **Mobile.**
  - No sticky stage and no rail; a horizontal chip row of the six chapters sits at the top, scrollable inside its own box.
  - Each chapter is a card (`--ink-1`, radius 28, padding 20): a figure (20vw), the H3, the body, then its own `createScreen({mode:'mini'})` with its own store, then the toy.
  - Each card's sequence **plays once** when the card is 50 % visible (2–3 s), with a mono `↺ Replay` button.
  - Screens are created lazily by `whenVisible` and destroyed when ≥ 2 viewports away (≤ 3 alive).
- **Reduced.**
  - Desk keeps the sticky layout, but the stage jumps to each chapter's end state on `onToggle` (no scrub), and figures show their final values.
  - Mobile cards show end states with no Replay.
  - The toys still work, instantly.

### 5.5 `how`: "It's just a picture."
**Layout (desk).**
- Black, 220vh, sticky 100vh.
- Left (cols 1–5):
  - Eyebrow `HOW IT WORKS`
  - H2 **It's just a picture.**
  - Steps (mono `01`–`04`, then `--t-lede`; the active step is `--fg` and the others `--fg-3`):
    - `01  Notched makes a copy of your wallpaper. The original file is never touched.`
    - `02  It bakes a black strip, exactly the height of your menu bar, into the top of the copy.`
    - `03  It sets the copy as your desktop picture, at each screen's own resolution, placed the way you had it: fill, fit, stretch or center.`
    - `04  The menu bar goes black, its text goes white, and the notch has nothing left to stand out against.`
  - Footnote (mono 12 px, `--fg-3`): `Signed with Developer ID and notarized by Apple. Updates via Sparkle, signed with EdDSA.`
- Right (cols 6–12): an **exploded view** of four 16:10 planes in CSS 3D (`perspective:1600px`, `transform-style:preserve-3d`, 40vw wide), each built with `paintWallpaper` or plain DOM:
  1. **Original:** hills, day. Tag `ORIGINAL · NEVER MODIFIED`.
  2. **Copy:** the same picture with a 1 px dashed `--line-2` outline. Tag `COPY · ~/Library/Application Support/Notched`.
  3. **Strip:** only the band and fillets as a black slab with rim light, on a transparent plane. Tag `BLACK STRIP · MENU-BAR HEIGHT`.
  4. **Desktop:** the composite with a white-text menu bar and the notch. Tag `SET AS DESKTOP PICTURE`.
- Mono tags are joined to their planes by 1 px leader lines (SVG, `stroke-dashoffset` draw). Each plane's spill lights the plane above.

**Animation (scrub .6).**
| Progress | What happens |
|---|---|
| 0 → .15 | The planes are fused flat into the finished desktop, facing camera. |
| .15 → .55 | The camera **orbits** (`rotateX 0→58°`, `rotateZ 0→−32°`, `scale 1→.82`, `inOut`). The planes separate in z (0/120/240/360 px). Tags and leaders draw in sequence (each .08), and the matching step goes `--fg`. |
| .55 → .72 | Hold. |
| .72 → 1 | Collapse: z → 0 and the orbit returns to front. The planes fuse with one 120 ms flash of the strip plane (opacity 1→.6→1); the notch rim fades (fused). A mono stamp ScrambleTexts in: `DONE IN ABOUT TWO SECONDS`. |

- **Toy:** hover or focus a plane to lift it alone (+40 px z, `knob`). The planes are `<button>`s with `aria-label`s that name the layer.
- **Mobile:** no 3D. A vertical stack of four planes (100 % width, 16:10) with tags, joined by a 1 px vertical line that draws as you scroll (scrub). Each plane rises on enter. The steps sit between the planes.
- **Reduced:** the mobile layout at all widths, static, all tags visible.

### 5.6 `privacy`: "No account. No analytics. One request a day." (paper)
**Transition in.** The top of `#privacy` is a full-width black strip (height MB) on paper, whose two concave fillets hang into the paper. Their radius scrubs `0 → clamp(40px, 8vw, 120px)` as the section enters (`start:'top bottom'`, `end:'top 30%'`, `fillet` mapped). A mono label sits tucked into the left fillet: `R = LARGE`. The nav's own fillets show against paper here.

**Layout.**
- Paper background, `#000` text. Eyebrow `PRIVACY` (mono, `--on-paper-2`).
- Three statements (`--t-statement`, wght 800), each on its own line, left at col 1, separated by 1 px `--paper-line` hairlines:
  - **No account.**
  - **No analytics.**
  - **One request a day.**
- Each line is `bandText(el,{origin:'left'})`; per-line ScrollTrigger `start:'top 75%'`, `end:'top 45%'`, scrub `true`, `p 0→1`. A black band sweeps across and the letters flip to paper as it passes, ending as **three menu bars on paper**.
- Below, cols 1–7, `--t-lede`, `--on-paper-2`, key phrases in `#000`: `The app makes one network request: a daily update check against notched.vercel.app. Your original wallpaper files are never modified; copies live in ~/Library/Application Support/Notched. This website has no analytics and no tracking. It asks for one thing, an email when you download, and uses it only to tell you about Notched updates.`
- Then `Read the source on GitHub ↗` (underlined link, `--focus-paper` focus).

**Mobile:** statements at 13vw so each stays on one line at 320 px (`One request a day.` uses wdth 75 below 420 px); fillet max 40 px.
**Reduced:** lines render as their final black bars and the fillets at max, with no sweep.

### 5.7 `faq`: "Fair questions." (paper)
**Layout.**
- Paper, normal flow.
- Cols 1–4: H2 **Fair questions.** (sticky at top 20vh on desk).
- Cols 5–12: eight `<details>` rows with 1 px `--paper-line` hairlines. The summary is Bricolage 650 `--t-h3` (≥ 44 px row height). The marker is a small CSS notch shape that fills black and rotates 180° when open.
- **Open:** a `::before` black bar scales X from the left 0→1 behind the summary (300 ms `out`) and the summary text flips to paper exactly where the bar has reached (CSS-only dual layer: an `aria-hidden` duplicate summary text in paper, clipped by `clip-path: inset(0 100% 0 0) → inset(0)` on the same 300 ms transition). The answer drops via `::details-content` with `interpolate-size: allow-keywords` where supported, else instant (no JS needed).
- Answers are 17 px `--on-paper-2`, max 62ch.

**Copy (JSON-LD FAQPage must match word for word; the architect updates it):**
1. **How does Notched work?** Notched saves a copy of your wallpaper with a black strip the height of the menu bar and sets the copy as your desktop picture. The menu bar turns black and the notch blends into it. Your original file is never touched.
2. **How do I turn it off?** Flip the switch off and your own wallpaper comes back. If you use several Spaces, each one gets its wallpaper back the next time you visit it while Notched is running.
3. **Does it work with dynamic wallpapers?** Yes. Time-of-day and light or dark wallpapers keep all their frames and their schedule, so they keep changing. The first pass takes a few seconds.
4. **What about Aerials and color wallpapers?** Those are drawn live by macOS, so Notched leaves them as they are. Pick a photo or a dynamic wallpaper to hide the notch.
5. **Can it shuffle my wallpapers?** macOS can't shuffle under the black bar, so Notched does it for you: pick a folder and an interval. If you already had a shuffle folder set, Notched takes it over.
6. **Does Notched connect to the internet?** Only to check for updates, once a day. No analytics and no account.
7. **What do I need?** A Mac with Apple silicon running macOS 14 or later. It's built for MacBooks with a notch and works on external displays too.
8. **Why does the download ask for my email?** So the maker can tell you when Notched updates. It's kept in his Google Sheet and never shared or sold. The app itself collects nothing.

**Entrance:** rows rise `y 24→0` plus opacity, stagger .06, 600 ms `out`, once.
**Reduced:** none; details open instantly.

### 5.8 `download`: "Make it disappear." (+ footer)
**Transition in (the finale; the band takes the page).**
- `section#download` is 160vh with a sticky 100vh stage. Its top starts on paper with a black strip of height MB at the top edge, whose bottom corners carry the two concave fillets at `--r-site`.
- Scrub (`start:'top bottom'`, `end:'top top'`): the strip's `scaleY` goes `1 → 100vh/MB` (origin top, `sweep` mapped). The fillets ride its bottom edge and grow to 20 pt.
- The page turns fully black: the product's black, which is also where the page began.

**Layout (on black, centred).**
- Mono eyebrow `DOWNLOAD`.
- Wordmark **NOTCHED** (`--t-mega`, `--fg`, wght 800), with a **black notch shape overlaid centred on its top edge** (16 % of the word's width, 34 % of cap height, bottom radii .12em, a 1 px `--rim` outline). On black it reads as a bite out of the letters.
  - Scrub (`start:'top 40%'`, `end:'top top'`): the notch's `scaleY 1→0` (origin top, `swallow`) while its rim fades. **The notch closes and the wordmark is whole.**
- H2 under it (`--t-h2` at .6×): **Make it disappear.**
- `.cta.cta--lg` **Download for Mac** (`data-cta="mac"`).
- A mono line: `Free · MIT license · v1.0.2 · macOS 14+ · Apple silicon · Notarized by Apple`.
- `Source on GitHub` (GitHub glyph).
- A small card under it: `claude-meter.png` (28 px), then `Also by Yiftach Freeman: Claude Meter puts your Claude usage limits right in the MacBook notch. ↗` linking to `https://claudemeter.vercel.app/?ref=notched` (new tab).
- These fade and rise in at .6–.8 of the stage scrub.

**Footer** (architect markup and CSS in `base.css`, rendered inside `#download` after the stage):
- Hairline top, 13 px, `--fg-3`.
- Row 1: `Notched` · `<span data-version>v1.0.2</span>` · `MIT license` (→ GitHub LICENSE) · `Source on GitHub` · `llms.txt`.
- Row 2: `Not affiliated with Apple.` · `© 2026 Yiftach Freeman`.
- The finale wordmark's hover egg (desk): a tiny band slides across the closed notch spot and back.

**Mobile:** 130vh, wordmark 22vw, CTA `Get it on your Mac` (`macAway`).
**Reduced:** no sticky and no growth; the section is black from its top, the notch on the wordmark is already closed, and everything is visible.

---

## 6. Easter eggs (the screenshot list; all toys, none implies a feature the app lacks)
1. Drag the notch down (hero, the `#try` mirror): the menu bar goes black.
2. Click the notch: the camera blinks and four escalating toasts follow.
3. Popover → `Large`: the website's own top corners grow to 20 pt (visible over paper).
4. Popover → `Hide menu bar icon`: the site's own nav icon disappears. Click `Notched` in the nav to get it back (`Welcome back.`).
5. Popover → `Quit`: `It's a website. It can't quit.`
6. The nav's sun/moon glyph cycles the time of day for every wallpaper on the page.
7. Type `notch` anywhere (a keydown buffer, ignored in inputs): every visible notch blinks at once and the toast says `Hi.`
8. Hover the closed notch on the finale wordmark: a tiny band slides over it.

---

## 7. Copy rules (all builders)
- **Spelling:** US in our copy (`color`, `license`, `center`). Product UI strings stay verbatim.
- **Voice:** short sentences, plain, a little wry. No stacked adjectives, no rhetorical triads, no em-dash chains.
- **Banned:** seamless(ly), effortless, elevate, unleash, game-changer, magic(al), revolutionary, beautifully, just works, pixel-perfect, "Say goodbye to".
- **Numbers only from FACTS:** 2 s, 10/14/20 pt, 5 min/15 min/30 min/hourly/daily, v1.0.2, macOS 14. No user counts, stars, press, testimonials or awards.
- **Apple terms:** "MacBook", "macOS" and "Mac" are descriptive only. No Apple logo anywhere, not even a silhouette. The GitHub glyph is the only third-party mark.

---

## 8. SEO / meta (architect, template)
- `<title>Notched: hide the MacBook notch (free for Mac)</title>`
- Description: `Notched turns your menu bar black so the MacBook notch disappears into the bezel. Free and open source. Keeps dynamic wallpapers moving and works on every display. macOS 14+, Apple silicon.`
- `<meta name="nt-signup" content="https://script.google.com/macros/s/AKfycbyYJTV8Mm_N77moH5FPesW6b_7Khdt2XHBn9IvVHSbHGw43RxAkXjgibvvWu-QkzNuMRA/exec">` (exact, from FACTS).
- Canonical `https://notched.vercel.app/`. `theme-color #000`. Favicons from `assets/` (existing).
- **OG/Twitter:** `summary_large_image`, `/assets/og.png` 1200×630.
  - Render it from `web/og.html` with `"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless --screenshot=site/assets/og.png --window-size=1200,630 --hide-scrollbars file://…/web/og.html?t=.5`.
  - Composition: black canvas, a wide screen-top crop across the top with the band on and 20 pt fillets, dusk hills below it, and `Black out the notch.` in Bricolage 800 bottom-left, with mono `NOTCHED · FREE FOR MAC · MACOS 14+`.
- **JSON-LD:** keep SoftwareApplication (minified so `"softwareVersion":"1.0.2"` matches `release.sh`'s sed exactly, `operatingSystem:"macOS 14 or later"`, `offers.price:"0"`) and FAQPage (the 8 Qs from 5.7).
- **Version single source:** `build.mjs` reads `MARKETING_VERSION` from `../project.yml` and writes it into the JSON-LD and every `[data-version]` fallback. `version.js` re-syncs at runtime from the JSON-LD, so a `release.sh` sed on `site/index.html` is honoured.
- **Untouched:** `site/llms.txt`, `robots.txt`, `sitemap.xml`, `downloads/*`, and the existing `vercel.json` rules.
- **`vercel.json` additions only:**
  - `/fonts/(.*)` and `/vendor/(.*)` → `public, max-age=604800`
  - `/css/(.*)` and `/js/(.*)` → `public, max-age=0, must-revalidate`
- **Delete once replaced:** `site/style.css`, `site/demo.js`, `site/og.html`. Keep `popover-*.png` in `assets/` as references; they are not referenced by the page.

---

## 9. Accessibility
- One `<h1>`, ordered h2/h3. Landmarks: header, main, footer. A skip link.
- **Reduced motion:** a full path per section (above). Globally: no scrubs, no sticky stages, no intro, no ghost, no drift or twinkle, and no ScrambleText (text swaps). Setters use duration 0, and every state is reachable via the popover, the toys and the chapter buttons.
- **Focus-visible everywhere:** 2 px `--focus` at 3 px offset on black, `--focus-paper` on paper. On the white CTA, a 2 px black inner plus an outer `--focus` ring. The popover uses the macOS ring.
- **Contrast:**
  - `--fg` on black is 19:1, `--fg-2` 8.4:1, `--fg-3` 5.9:1 (≥ 12 px only).
  - On paper, `--on-paper-2` is 6.9:1.
  - Hero text sits only over the darkened lower area of the wallpaper. QA verifies ≥ 4.5:1 at `?t=0|.25|.5|.75`.
  - Error colour is always paired with words.
- **Split and duplicated text:** split chars, `bandText` overlays and chips are `aria-hidden`; the real text stays.
- **Screens:** `role="img"` with live labels. The popover is a real form with labels, and its status is `aria-live="polite"`. Toasts go to one `role="status"`.
- **Touch:** targets ≥ 44 px. `touch-action:none` only on the notch hit targets.
- **320 px:** no horizontal overflow. Screens are cropped inside `overflow:clip` stages; `html{overflow-x:clip}` is not allowed as a fix.
- **The sheet:** native modal `<dialog>` (inert page, Esc, Tab wrapped), labelled and described. Errors are `aria-live="assertive"` with `aria-describedby` and `aria-invalid`. Inputs are ≥ 17 px and targets ≥ 44 px. Focus goes to the field on fine pointers, otherwise the title, and returns to the opener.

---

## 10. Performance plan
- **JS (gz):** vendor about 55 KB, our code ≤ 60 KB (lib about 30 KB, sections about 30 KB), total ≤ 120 KB (budget 350).
  - `signup.js` and `sheet.css` (about 6 KB) load on first CTA intent; a click before they arrive awaits the import.
  - Section modules load when within one viewport.
- **Fonts:** 2 variable woff2 files ≤ 200 KB, Bricolage preloaded, fallback metrics tuned.
- **Images:** `icon-*.png`, `favicon.png`, `apple-touch-icon.png`, `claude-meter.png`, `grain.png`, `og.png`. All wallpapers are CSS and SVG (shared `<symbol>`s for the hill paths).
- **Screen instances:**
  - Hero (1), try mirror + preview (2), features stage (1, or ≤ 3 minis on mobile), how planes (4 static paints, no loops), privacy and download (none).
  - Living loops run only when visible; at most 4 animating screens at once.
- **Rendering:** time changes are opacity on pre-painted layers; the sun and hills move by transform; band and text flips are `clip-path: inset()`. `backdrop-filter` only on fake menu bars, the popover and the sheet backdrop, and it is off for the mobile hero bar.
- **CSS containment:** `content-visibility:auto; contain-intrinsic-size:auto 900px` on `#privacy`, `#faq` and the footer (never on sticky sections). Sticky stages have explicit heights (no CLS on enter/exit).
- **Targets:**
  - LCP < 2.0 s (the H1 text is the LCP element), CLS < .02.
  - 60 fps on the hero scrub on an M1 Air, ≥ 50 fps on a 390 px viewport at 4× CPU throttle.
  - No long task > 120 ms after load, 0 console errors.
  - If the mobile frame budget fails, drop the spill blur first (`@media (max-width:899px){.screen__spill{display:none}}`).

### 10.1 Build and QA
- **Build:** copy `/Users/freemansmain/.claude/skills/awwwards-site/build.mjs` → `web/build.mjs`.
  - It stitches `web/index.html` (`<!-- @section:<id> -->` markers in the order of section 5) with `web/sections/<id>.html` into `site/index.html`, with no dependencies, and injects the version (section 8).
  - CSS order: `tokens.css`, `base.css`, `product.css`, then 8 × `<id>.css`. `sheet.css` is lazy.
  - JS: vendor `defer`, then `js/main.js` `type=module`.
- **QA:** copy `/Users/freemansmain/.claude/skills/awwwards-site/qa.mjs` → `web/qa.mjs` and adapt the ids.
  - Serve with `python3 -m http.server 4321 --directory site`.
  - Run `timeout 170 node qa.mjs --steps 8` for desktop and mobile as **separate calls**, plus `--reduced` and `--overflow`.
  - Screens go to `/private/tmp/claude-501/-Users-freemansmain-Ai-Projects-Notched/fc959023-bd43-4ab1-9c6c-40abca6f8b97/scratchpad/qa/<run>/`. **Look at them.**
  - Required frames: hero at progress 0/.42/.62/1, each features chapter, how at .55, privacy fully swept, finale at .5 and 1, all at `?t=0|.25|.5|.75`.
  - Popover pixel check: a DPR 2 screenshot beside `popover-dark.png` and `popover-light.png`.
  - **Sheet checks (with request interception: abort every `script.google.com` request so no test address ever reaches the live sheet):**
    - Click the hero CTA and the dialog opens.
    - Blank submit shows the error, with no `/download` request.
    - Invalid submit shows the error.
    - Valid `qa@example.com` fires the `/download` request **before** the (aborted) POST settles, then `macDone` shows.
    - A second click (stored email) downloads at once.
    - At 390 px, `macAway` and the `Get it on your Mac` label.
    - At 320 px, no overflow with the dialog open.
    - Tab order and focus return.
    - No `fetch` happens before submit.
  - `web/node_modules` goes in `.gitignore`.

### 10.2 Ownership
| Owner | Files |
|---|---|
| Architect / integrator | `web/index.html` (template, head inline phase script, nav, footer, JSON-LD, meta), `web/build.mjs`, `web/qa.mjs`, `web/og.html`, `site/css/{tokens,base,product,sheet}.css`, `site/js/main.js`, `site/js/lib/*`, `site/vendor/*`, `site/fonts/*`, `site/assets/grain.png`, `site/assets/og.png`, the `vercel.json` additions, `.gitignore`, and deleting the old files. |
| One builder per section | `web/sections/<id>.html`, `site/css/<id>.css`, `site/js/<id>.js` for `hero`, `gone`, `try`, `features`, `how`, `privacy`, `faq`, `download`. |
**Nobody deploys.** The lead deploys after review.

---

## 11. Flags for the lead (do not "fix" on the site without the maker)
1. **This worktree is one commit behind `main`.** `main` has `60c8bd2 chore(release): Notched 1.0.2`, but here `site/vercel.json` still redirects `/download` → `Notched-1.0.1.dmg`, `site/downloads/` holds only the 1.0.1 DMG, and `llms.txt` and the old JSON-LD say 1.0.1. `project.yml` already says 1.0.2. Rebase `site-v2` on `main` before deploying; the page itself says v1.0.2 per FACTS.
2. **The popover PNGs show `v1.0.1`** and the resting status `Notch hidden.`. The recreation shows v1.0.2, and right after processing it shows the manager's longer status before settling. Both strings are real Swift strings.
3. **No-JS visitors download without the email ask** (`/download` is a plain link). That is deliberate, so the download never waits on anything. Gating it would mean making the DMG depend on JS.
4. **The signup endpoint is shared with Claude Meter's list** (the client's choice). The `ref:"notched…"` prefix is how the maker tells them apart; don't rename any field.
5. **FAQ 4 now reads "color"** in both the page and the JSON-LD (FACTS: US spelling in our copy). The old JSON-LD said "colour".
