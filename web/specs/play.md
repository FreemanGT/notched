# Notched site spec: PLAY ("Pull the black down")

Lens: tactile play. Springy physics, things you can grab, a product you operate, small secrets people screenshot.
Law: `web/FACTS.md`. Swift wins over FACTS (see "Fact flags" at the end). Every number on the page comes from FACTS.

---

## 0. Big idea

**The viewport is the screen. The menu bar is the nav. You pull the black down yourself.**

The page opens as a MacBook screen-top at real-life scale: a thin bezel around the browser viewport, the camera notch hanging from the top centre, a translucent menu bar ("Notched File Edit View Window Help" … clock) over an original, procedurally drawn wallpaper of the icon's hills, lit for the visitor's actual local time of day.

The notch is a physical object. Grab it and drag down: a black band stretches out of it like taffy and snaps across the whole menu bar. Or just scroll, and the band grows from the notch to both edges on its own. Either way, the menu-bar text flips to white as the black passes under each word, concave corners spring in under the band ends, the notch is gone, and **that black menu bar stays pinned as the site's navigation for the rest of the page**. Its fake menus scramble into real links. The site has Notched installed on itself.

Everything after is the same trick from another angle, and every control you touch changes the page you are on: pick Large corners in the popover and the site's own top corners go to 20 pt; tick "Hide menu bar icon" and the site's own icon disappears ("Open Notched again to bring it back."). The motion language is **subtraction**: things are absorbed into black, nothing bounces out of the notch (every competitor makes the notch grow; Notched is the one that makes it vanish).

Even the download obeys the idea: every **Download for Mac** button makes the notch open up. A black sheet grows out of it (concave corners where it meets the bar), asks for one email, and the DMG starts the moment you hit Enter. It never waits on the network.

One sentence for a juror: *"You pull the notch down and the whole website goes black at the top, and then it stays that way."*

---

## 1. Design tokens

### Type (2 families, self-hosted, subset latin woff2, ≤ 200 KB total)
| Role | Family | npm (fontsource) | Axes / weights used |
|---|---|---|---|
| Display + body | **Bricolage Grotesque** | `@fontsource-variable/bricolage-grotesque` (use `full.css` files: opsz 12–96, wdth 75–100, wght 200–800) | Display: wght 700–800, opsz 96, wdth 100 → 75 for "squeeze into the notch". Body: wght 420, opsz 14. Leads: wght 500, opsz 24. |
| Labels, spec plates, status, numbers | **Martian Mono** | `@fontsource-variable/martian-mono` (`wdth.css`: wdth 75–112.5, wght 100–800) | wght 450, wdth 87.5 for chips; wght 600 for big numerals (10/14/20). Uppercase, tracking +0.06em at ≤ 12px. |
| Recreated macOS UI only (popover, menu bar) | `system-ui, -apple-system, "Segoe UI", sans-serif` | none (no SF Pro files shipped) | as the OS gives |

Self-host: copy the needed woff2 from `node_modules/@fontsource-variable/*/files/` into `site/fonts/`, write `@font-face` in `site/css/tokens.css` with `font-display: swap` and `size-adjust`/`ascent-override` tuned so swap causes no CLS. Preload only the Bricolage latin file. Not used anywhere: Anybody, Instrument Serif/Sans, Geist (Claude Meter identity).

Type scale (fluid, `clamp`):
- `--t-hero: clamp(3.25rem, 9.2vw, 9.5rem)` / line-height 0.88 / tracking −0.035em / wght 780
- `--t-h2: clamp(2.4rem, 5.6vw, 5.5rem)` / 0.92 / −0.03em / wght 740
- `--t-h3: clamp(1.4rem, 2.2vw, 2rem)` / 1.05 / −0.015em / wght 650
- `--t-lead: clamp(1.15rem, 1.6vw, 1.45rem)` / 1.4 / wght 480
- `--t-body: 1.0625rem` / 1.55 / wght 420
- `--t-chip: 0.72rem` mono uppercase / 1 / +0.06em

### Colour (black is the hero; wallpaper light is the only colour)
```
--black:      #000000   page, bezel, band, notch: all the same black, on purpose
--ink-1:      #0A0A0B   raised surfaces (FAQ rows, cards)
--ink-2:      #141416   hover surface
--line:       rgba(255,255,255,0.10)
--line-2:     rgba(255,255,255,0.18)
--fg:         #F3F1EC   warm white, primary text (19.4:1 on black)
--fg-2:       #A9A7A1   secondary text (8.4:1)
--fg-3:       #8C8A85   tertiary, captions ≥ 13px only (5.9:1)
--rim:        rgba(255,255,255,0.07)   1px rim light on bezel/notch edges
--focus:      #6BE3D0   focus ring (icon's P3 mint, sRGB fallback)
/* wallpaper light, from the icon (display-p3 0.231,0.443,0.996 → 0.420,0.890,0.816) */
--day-top:    #3B71FE   --day-bot: #6BE3D0
--dawn-top:   #2B2F6B   --dawn-mid: #C46A8E   --dawn-bot: #FFB38A
--dusk-top:   #2A1B4E   --dusk-mid: #E0546A   --dusk-bot: #FF9F5A
--night-top:  #04050C   --night-bot: #1A2350  --star: #E9ECFF
--hill-a:     rgba(255,255,255,0.28)   --hill-b: rgba(255,255,255,0.22)   (icon's hills.svg)
--cta-bg:     #F3F1EC  --cta-fg: #000   (primary CTA is the light, inverted)
```
Use `color(display-p3 …)` with sRGB fallback for the four day/dawn/dusk accents via `@supports (color: color(display-p3 0 0 0))`.
`::selection { background: #fff; color: #000 }`.

macOS popover tokens (light/dark, sample exact values from `site/assets/popover-*.png` with an eyedropper; starting points):
```
dark:  bg #1E1E1E  border rgba(255,255,255,.12) outer + rgba(0,0,0,.6) shadow  text #FFFFFF E5  secondary rgba(255,255,255,.55)
       control-off #3A3A3C  control-on #2F7CF6  segmented track #2C2C2E  segmented selected #2F7CF6  divider rgba(255,255,255,.10)
       button #333335  tertiary text rgba(255,255,255,.28)
light: bg #FFFFFF(95% + backdrop blur)  text #000 D9  secondary rgba(0,0,0,.5)  control-off #E5E5E7  control-on #2F7CF6
       segmented track #E3E3E5  button #E8E8EA  divider rgba(0,0,0,.10)
```

### Radii
- Product radii: `--r-s: 10` `--r-m: 14` `--r-l: 20` (pt, scaled by `--pt`, see 3.1). `--r-site` = the site's current fillet radius in px, default Medium, changed by the popover.
- UI: pills 999px; cards 28px; popover 14px (`radius ≈ 26/2` from the render, verify); preview 8px; buttons 7px (macOS push buttons).

### Easing and duration
Register with CustomEase in `js/lib/motion.js`:
- `ease.out` = `"0.16,1,0.3,1"` (expo-ish, default UI)
- `ease.inOut` = `"0.65,0,0.35,1"`
- `ease.swallow` = `"0.7,0,0.84,0"` (things sucked into black: slow start, fast end)
- `ease.drop` = `"0.34,1.56,0.64,1"` (one overshoot, for things landing)
- Springs (own solver, see 2.2): `snappy {k:420, c:30}` (buttons, toggles: one tiny overshoot, settles < 300 ms); `taffy {k:180, c:14}` (band, notch, fillets: one visible overshoot, settles ≈ 450 ms); `lazy {k:90, c:16}` (cards, displays, drum).
- Durations: micro 160 ms, UI 280 ms, reveal 700 ms, scene 1100 ms. Scrubs: `scrub: 0.6` default, `0.9` for the hero.

### Texture
- **Grain**: one fixed full-viewport `<canvas>` 256×256 noise tile, generated once in JS at load (no image request), drawn as CSS `background` via `toDataURL`, `opacity .055`, `mix-blend-mode: overlay` on light areas; on black it reads as anodised metal. Static (no animated grain: costs frames for nothing).
- **Rim light**: bezel inner edge and notch edge get a 1px `--rim` inset shadow; it's what makes black-on-black legible as an object, and it's what fades out when the notch "dissolves".
- **Glow**: the wallpaper's bottom fades to black with a 3-stop gradient, so colour rises out of black, never sits as a box.

---

## 2. Global motion system (architect owns: `site/js/main.js`, `site/js/lib/*`, `site/css/tokens.css`, `site/css/base.css`)

### 2.1 Libraries (self-hosted, copy from `/Users/freemansmain/Ai Projects/Claude Meter/site/vendor/`)
`gsap.min.js`, `ScrollTrigger.min.js`, `SplitText.min.js`, `CustomEase.min.js`, `ScrambleTextPlugin.min.js`, `Draggable.min.js`, `InertiaPlugin.min.js`. ≈ 72 KB gz together. **No Lenis** (Mac trackpads already have inertia; Lenis adds lag and is a juror cliché). **No WebGL** (the wallpaper is SVG, see 3.2; it scrubs for free, renders at any DPR and is a fraction of the bytes). Loaded as classic `<script defer>` before `main.js` (type=module).

### 2.2 Shared utilities (each one small; no frameworks)
| File | Export | What |
|---|---|---|
| `lib/motion.js` | `gsap, ScrollTrigger, ease, reduced, mm` | Registers plugins and eases. `reduced` = live boolean from `matchMedia('(prefers-reduced-motion: reduce)')`; `mm = gsap.matchMedia()` with contexts `{desktop:'(min-width: 900px)', mobile:'(max-width: 899px)', motion:'(prefers-reduced-motion: no-preference)', still:'(prefers-reduced-motion: reduce)'}`. Sets `ScrollTrigger.config({ignoreMobileResize:true})`. |
| `lib/spring.js` | `spring(from, {k,c,m=1,onUpdate,onRest})` → `{set(target), jump(v), value, velocity, stop()}` | Semi-implicit Euler on `gsap.ticker`, rest when `|v|<0.001 && |x-target|<0.001`. Presets `snappy/taffy/lazy`. Under `reduced` it jumps. ~40 lines. Used for the notch drag, fillets, displays, popover switch, cards. |
| `lib/visible.js` | `whenVisible(el, onIn, onOut)` | One shared IntersectionObserver; used to pause the clock, the wallpaper drift, the ghost cursor and the drum when off-screen. |
| `lib/settings.js` | `settings` store: `{on, radius:'s'|'m'|'l', corners, dynamic, builtInOnly, rotate, every, startAtLogin, hideIcon, appearance:'dark'|'light'}` + `subscribe(fn)` | The **site-wide** state the popover writes and every screen instance reads. Writes `--r-site` on `<html>`, toggles `html.icon-hidden`. Persist to `localStorage` in try/catch (per-viewer convenience only). |
| `lib/dualtext.js` | `dualText(el)` | Clones a text node into a white overlay layer clipped by `clip-path: inset(var(--band-top) var(--band-right) var(--band-bottom) var(--band-left))`. Sections set the 4 vars; letters turn white exactly where they sit inside the black. Original layer keeps the semantics, overlay is `aria-hidden`. |
| `lib/toast.js` | `toast(text, {anchor, ms=1600})` | Small black pill with mono white text, drops from the anchor with `ease.drop`, leaves with `ease.swallow` upward (into the notch). One at a time. `role="status"` live region. |
| `lib/magnet.js` | `magnet(el, {strength=.25, radius=90})` | Pointer-proximity pull for primary CTAs (`(hover:hover)` only), released with `snappy` spring. |
| `lib/cta.js` | `initCtas()`, `noMac()`, `DOWNLOAD='/download'`, `REPO` | Every primary CTA is `<a class="cta" data-cta="mac" href="/download">Download for Mac</a>` in the HTML (works with no JS). `initCtas()` intercepts clicks (not modifier/middle clicks) and opens the sheet; warms `signup.js` with `import()` on first `pointerenter`/`focus`/`touchstart` of any CTA. `noMac()` = phone/tablet test (`/iPhone|iPad|Android/` or `maxTouchPoints > 1 && /Macintosh/` iPadOS) → relabels every CTA to `Get it on your Mac` at init. Adapt logic from `/Users/freemansmain/Ai Projects/Claude Meter/site/js/lib/cta.js` (not its look). |
| `lib/signup.js` | `openSheet(opener)` | The download sheet (spec 4.7). Native `<dialog>` + `showModal()`, POST to `<meta name="nt-signup">`, honeypot `nt_hp`, `localStorage` key `nt-email` (try/catch). Adapt logic from `/Users/freemansmain/Ai Projects/Claude Meter/site/js/lib/signup.js` (drop its windows views, star nudge, Lenis). |
| `lib/clock.js` | `clock(el)` | Renders `Tue 6 Oct  9:41`-style local time client-side only (empty in HTML, filled before first paint by an inline-safe call in main). Digits roll on change (each digit a 1-char mask, old digit `yPercent -100` + `blur(2px)`, new from `100`, 380 ms `ease.out`). Ticks once a minute, paused off-screen. |

### 2.3 Scroll rules
- Native scroll. ScrollTrigger only. Pins via CSS `position: sticky` inside tall sections (no `pin:true` spacers, so no CLS on enter/exit); ScrollTrigger just reads progress.
- Max sticky track: hero 220 vh, features 5 chapters × 90 vh. No other pins.
- `will-change` only added in `onToggle` while a trigger is active.
- Every scrubbed state must also be reachable by click/keyboard (popover, chapter buttons), so nothing exists only on scroll.
- `ScrollTrigger.refresh()` once after fonts load (`document.fonts.ready`). Never on a timer.

### 2.4 Reduced motion (first-class, `html.still` class set by main.js)
- No scrubs, no pins (sticky containers become `position: static`), no intro, no ghost cursor, no drift, no springs (they `jump`), no ScrambleText (text swaps).
- Hero renders its **end state** (band on, notch gone, menu bar = nav) with a static noon wallpaper. The popover still works and its changes apply instantly.
- Features: chapters stack as cards, each with its own static screen instance in the right state.
- Cross-fades ≤ 150 ms opacity are allowed (they aid comprehension).

---

## 3. The shared PRODUCT COMPONENT (component builder owns `site/js/lib/screen.js`, `site/js/lib/wallpaper.js`, `site/js/lib/popover.js`, `site/css/product.css`)

### 3.1 Geometry (true to the hardware, so it reads as real)
All sizes derive from one unit **`--pt`** = CSS px per macOS point for that instance: `--pt = instanceWidth / 1512` (14" MacBook default "looks like" width). Real numbers:
- Menu bar height `MB = 37pt`. Notch `200pt × 32pt`, bottom corner radius `9pt`, top outer flare (concave, where the notch meets the bezel) `5pt`. Camera lens: 7pt dark circle `#0B0F1A` with a 3pt `#24304A` inner ring and a 1.5pt specular dot, centred 15pt from the top.
- Bezel: `--bezel = max(10px, 14pt)`, screen corner radius `= 18pt` outer on the screen glass (top corners).
- Fillets: concave quarter circles, radius `{10,14,20}pt`, hanging under each end of the band, exactly as `WallpaperRenderer.swift` draws them (band = full width × menu-bar height, pure black; fillet = square r×r under the band end minus a circle of radius r centred at (edge ± r, top − r)). Draw as an SVG `<path>`: `M0,0 H r A r r 0 0 0 0,r Z` mirrored on the right.
- **Viewport mode (the hero)** uses a magnified scale so the menu bar is chunky enough to be the nav: `--pt = clamp(0.92px, 0.11vw + 0.62px, 1.25px)` on desktop (MB ≈ 37–46 px), `--pt = 0.98px` on phones (MB ≈ 36 px, notch 196 px wide, which on 390 px leaves ~97 px each side: fine, it's what a phone-width crop of a real notch region looks like).

### 3.2 Wallpaper (`wallpaper.js`): procedural, original, SVG
One `<svg viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice">` per instance:
- `<linearGradient>` sky with 3 stops; colours interpolated in OKLab (simple JS lerp over the 4 keyframes in tokens: dawn t=0, day t=.33, dusk t=.66, night t=1, wrapping).
- Sun/moon: a `<circle>` with a radial-gradient glow; position on an arc by `t` (rises left at dawn, high at day, sets right at dusk, moon at night).
- Stars: 40 `<circle r=1–1.6>` pre-seeded (fixed PRNG seed so SSR/QA are deterministic), opacity = night-ness.
- Hills: the two paths from `AppIcon.icon/Assets/hills.svg`, scaled to 1600 wide (`M0 700C200 610 380 640 560 700S880 790 1024 690V1024H0Z` and `M0 840C240 760 470 800 660 850S920 900 1024 830V1024H0Z`, x × 1.5625), fills `--hill-a` / `--hill-b` at day, tinted toward the sky's bottom colour at dusk/night. A third back hill (same curve flipped, 0.12) for depth.
- **Drift** (motion only, visible only): hills' control points breathe ±6 units on a 14 s sine; pointer x over the instance shifts sun ±30 and hills ±8/±14 (parallax) through a `lazy` spring.
- Presets (`setWallpaper(id)`): `hills` (default, time-driven), `dunes` (same paths, warm palette, no stars), `lake` (hills mirrored at 60% opacity below a horizon line), `grid` (a dark dusk sky with the hills drawn as 1px contour lines). All original. Used by rotation.
- Static fallback for no-JS: an inline CSS `background: linear-gradient(...)` noon sky + the inline hills SVG in the HTML; JS takes over.

### 3.3 `createScreen(el, opts)` → Screen
```js
const s = createScreen(el, {
  mode: 'viewport' | 'display' | 'mini',   // viewport = hero full-bleed; display = framed monitor; mini = popover preview
  label: 'Built-in',                        // displays only, shown under the frame in mono
  notch: true,                              // externals have no notch
  menus: ['Notched','File','Edit','View','Window','Help'],   // generic only, never other brands
  time: 'local' | 0..1,                     // 'local' maps the visitor's hour: 5–8 dawn, 8–17 day, 17–20 dusk, else night
  wallpaper: 'hills',
  radius: 'm',                              // 's'|'m'|'l'|0
  band: 0,                                  // 0..1
  follow: true,                             // subscribe to settings store (popover drives it)
});
```
Setters (all accept a number and tween/spring internally unless `{instant:true}`; all chainable; all no-ops after `destroy()`):
- `s.setBand(p)` 0..1. The band is one black rect centred on the notch, `width = notchW + (W − notchW)·ease(p)`, height MB, its two outer ends rounded (`rx` = MB/2 → 0 as it hits the screen edges, so it reads as liquid spreading, then squares off). At p=1 exactly it equals the renderer's band.
- `s.setNotchDissolve(p)` 0..1: rim light and lens glint fade out, notch bottom corners go from 9pt to flush. Default: driven by `setBand` (starts at p .7, done at 1). Exposed for sections that want to decouple.
- `s.setRadius(r)` `'s'|'m'|'l'|0|px number`: fillet radius, `taffy` spring (visible overshoot). Fillets only draw when band ≥ 0.98.
- `s.setTime(t)` 0..1 (or `'local'`): sky, sun, stars, hill tint. Also flips the menu-bar text colour **when band is 0** (dark text on bright day sky, white at night) the way macOS does.
- `s.setWallpaper(id, {transition:'slide'|'fade'})`: rotation uses `slide` (new wallpaper slides in from the right *under* the band; the band never moves).
- `s.setMenuText(mode)` `'auto'|'dark'|'white'`. `auto` = per-item: an item is white if its centre x is inside the band span, else per sky luminance. Items flip with a 120 ms colour tween as the band passes (this is the "text turns white" moment; it travels from the notch outward).
- `s.setStatusIcon(kind)` `'normal'|'update'`: the Notched menu-bar icon (drawn: a small rounded screen with a bar across the top, our own SVG, **not** the SF Symbol file) or its down-arrow variant.
- `s.pulse()`: the "watching" ring: a 1px white ring expands from the Notched menu-bar icon (scale 1→3.2, opacity .7→0, 900 ms).
- `s.process(ms=700)`: shimmer sweep across the screen (a 30° white-at-8% gradient bar, translates −100%→200%) and returns a promise. Used before the band appears in demos ("Processing wallpaper…").
- `s.on('notchdrag', fn)`, `s.on('band', fn)`: events.
- `s.destroy()`.
- `s.el` root, `s.bandRect()` → DOMRect of the band (for `dualText`).

Static props on the module: `Screen.RADII = {s:10,m:14,l:20}`, `Screen.MB = 37`.

**Notch drag (tactile signature), viewport and display modes:** `Draggable` on an invisible 1.4×-size hit target over the notch (`cursor: grab`, `aria-hidden` because the switch in the popover is the accessible control). Drag down `dy`: band progress `p = clamp(dy / (3·MB), 0, 1)` with rubber-band resistance past 1 (`1 + (over)^0.5·0.08`), and the notch itself stretches `scaleY 1 → 1.35` with `scaleX 1 → 0.9` (taffy). Release: `p > .4` → spring to 1 (`taffy`), else spring back to 0. Horizontal drag is ignored. Fires `toast('Notch hidden.')` on landing at 1 (UI string, verbatim). Double-click the notch toggles. Keyboard users get the same via the popover switch and the hero's "Try the switch" button.

**Notch click easter egg:** a single click (no drag) makes the lens "blink" (lens scaleY 1→0.1→1, 180 ms) and shows a toast cycling through: `There's nothing here. That's the point.` / `Still nothing.` / `You're very thorough.` / `Okay, it's a camera.` (5th click and after: back to the first.)

### 3.4 `createPopover(el, {appearance})` → Popover
Pixel-faithful HTML/CSS recreation of `SettingsView.swift` at **340 px wide**, 18 px side insets, 20 px top inset, `system-ui`, matching `popover-dark.png` / `popover-light.png` (680×1182 @2x → 340×591). Overlay the PNG at 50% in a QA-only `?ghost=1` mode to align. Structure (real controls, keyboard operable, visible focus):
1. Row: `<h3>Notched</h3>` (17px/600, title3 semibold) … `<button role="switch" aria-checked aria-label="Hide the notch">` (38×22 macOS switch, knob springs with `snappy`).
2. Preview: a `createScreen(.., {mode:'mini', follow:true})` 304×196, radius 8px, 1px separator border, notch drawn on top.
3. Status `<p aria-live="polite">` (13px callout, secondary). Sequence on switch on: `Processing wallpaper…` (preview runs `process(700)`) → `Notch hidden. New wallpapers are handled automatically.` On off: `Wallpaper restored. Other Spaces get theirs back when you visit them.` Initial (off): `Turn on to blacken the menu bar so the notch blends in.` With dynamic wallpaper chosen and switching on: `Processing dynamic wallpaper… this takes a few seconds.` (1400 ms).
4. Divider. Checkbox `Use dynamic wallpapers` + caption `Keeps time- and appearance-based wallpapers changing. Takes longer to process.` (on: preview's time drifts dawn→night in a 12 s loop; off: freezes at current).
5. Checkbox `Round corners` + segmented `Small | Medium | Large` (`role="radiogroup"`, arrow keys move, selected pill slides with `snappy`). Writes `settings.radius` → **the site's own `--r-site` fillets under the nav change too**.
6. Checkbox `Built-in display only`.
7. Checkbox `Rotate wallpapers` + caption `macOS can't shuffle under the black bar, so Notched rotates your pictures itself.` When checked, a row expands (height spring): `Choose Folder…` button (on the site: opens nothing; toast `On your Mac, this opens a folder picker.`), picker `<select>` (5 min / 15 min / 30 min / Hourly / Daily, default Hourly), `Next` button (disabled unless switch on) → `setWallpaper(next, {transition:'slide'})` on every subscribed screen.
8. Divider. Checkbox `Start at login` (checked). Checkbox `Hide menu bar icon` + caption `Open Notched again to bring it back.` → **hides the Notched icon in the site's nav menu bar**; clicking the "Notched" app-menu word in the nav brings it back with a toast `Welcome back.`
9. Divider. Footer: `Check for Updates…` button (toast: `You're on v1.0.2, the latest.`) … `v1.0.2` (tertiary, read from one `data-version` attr) … `Quit` (gag: popover does a quick shrink-to-icon `ease.swallow` 260 ms, toast `It's a website. It can't quit.`, then pops back with `ease.drop`).
- API: `p.set(partialSettings)`, `p.on('change', fn)`, `p.setAppearance('dark'|'light')` (cross-fade 200 ms; View Transition API if available), `p.highlight(controlName)` (soft blue ring pulse on a control; chapters use it), `p.ghost(script)` → plays a ghost-cursor script (see Try section) and cancels on any real pointer/key input.
- All copy is the UI's own strings, verbatim.

### 3.5 `createDisplays(el)` → row of screens
`d.setCount(n)` 1..3: screens enter from the right with `lazy` springs, each its own `createScreen({mode:'display'})`; display 1 `Built-in` (notch), 2 `External 1`, 3 `External 2` (no notch, plain menu bar; never a product name). `d.setBuiltInOnly(bool)`: external bands retract (their own `setBand(0)`), built-in keeps its band. Mono labels under each: `BUILT-IN · 14PT`, `EXTERNAL 1 · 14PT` / `EXTERNAL 1 · UNCHANGED`.

---

## 4. Global elements

### 4.1 Nav = the menu bar (template, architect)
- One fixed `<header>` at the top of the viewport that **is the hero screen's menu bar** (the hero screen in viewport mode renders its menu bar into this element instead of its own; it's one DOM node so there's no handoff seam).
- Height `MB` (≈ 40px desktop / 36px phone). Left: Notched icon (our SVG) · **Notched** (bold) · `File` `Edit` `View` `Window` `Help`. Right: three drawn status glyphs (generic: a sun/moon for time of day that you can click to cycle time, a battery shape, a toggle shape) · clock.
- Background: transparent over the hero wallpaper (with `backdrop-filter: blur(20px) saturate(1.4)` and `rgba(255,255,255,.12)` tint like a real translucent bar) until the band arrives, then `--black`.
- When the band reaches 1 (hero ~45%), the fake menus run **ScrambleText** (chars `"▮▯·"`, 500 ms, stagger 60 ms) into real links: `File`→`How it works` (#how), `Edit`→`Features` (#features), `View`→`Try it` (#try), `Window`→`FAQ` (#faq), `Help`→`GitHub ↗`. Right side gains a white pill `Download` (`data-cta="mac"`, `href="/download"`, opens the sheet, 4.7) before the clock. Scroll back up past that point: they scramble back. Reduced motion: real links from the start.
- **Fillets under the nav** at the viewport's left and right ends, radius `--r-site` (default 14pt × `--pt`). Visible for the whole page after the hero. Changing radius in the popover springs them. This is the site's permanent signature.
- Phone: left shows icon + `Notched` + `Menu` (opens a full-screen black sheet that drops down from the bar like the band: links in `--t-h2`, staggered `ease.drop`). Right: `Download` hidden on phones (can't install from a phone); the clock stays.
- The nav notch: the hero's notch is also fixed to the top centre (inside the header), so it is always there, black inside the black bar: present but invisible, which is the whole product. Hovering it after the hero shows a tooltip `Still here. You just can't see it.`
- Focus: skip link `Skip to content` as the first tab stop.

### 4.2 Bezel
A fixed 4-sided frame (`--bezel` thick, black, inner radius 18pt, 1px `--rim` inner edge) around the viewport **during the hero only**; it scales out (frame thickness → 0 by animating `clip-path: inset()` on a full-screen black layer with a hole, no layout) over the last 25% of the hero track, as if the camera moves in through the screen. Phones: bezel 6px.

### 4.3 Intro (≤ 1.2 s, never gates content)
HTML renders the hero end-of-intro state with the CSS noon sky; JS adds `html.intro` before first paint (inline 1-line script in `<head>`), then plays:
- 0–200 ms: everything black except the bezel rim and the camera lens; the lens specular dot slides across (glint).
- 120–700 ms: the screen "wakes": wallpaper `opacity 0→1`, `filter: brightness(.35)→1`, `scale(1.03)→1`, `clip-path: circle(0% at 50% 0%) → circle(150% at 50% 0%)` (light spreading from the notch, `ease.out`).
- 450–850 ms: menu items stagger in (`y -6→0`, opacity, 35 ms stagger); clock digits roll in.
- 650–1100 ms: headline lines rise from masks (`yPercent 105→0`, `rotate 2→0`, 80 ms line stagger, `ease.out`); CTA pops (`scale .92→1`, `ease.drop`).
- Return visit in the same session (`sessionStorage` try/catch): 400 ms opacity-only version. Reduced motion: no intro.

### 4.4 Cursor
No custom cursor, no blob. The pointer only moves light inside the product (sun parallax) and pulls CTAs (magnet). `cursor: grab/grabbing` on the notch and the band handle.

### 4.5 Cross-promo pill (bottom-right, fixed)
Black pill, 1px `--line-2`, Claude Meter icon (`assets/claude-meter.png`, 20px) + `Claude Meter ↗` (mono 12px). On hover it extends to `Your Claude limits, in the notch ↗` (width spring). Link `https://claudemeter.vercel.app/?ref=notched`. Dismiss `×` (sessionStorage). Hidden while the hero is on screen and while the download section is in view. Phones: hidden (the footer link covers it).

### 4.6 Footer
- Giant wordmark **NOTCHED** across the full width in `--ink-1` on black (barely visible, Bricolage 800, wdth 75, ~22vw), cropped by the bottom of the viewport. A black band slides across its top edge on enter (scrub) and the letters under the band go white for a beat (`dualText`), then the band slides off. A notch shape is cut from the top centre of the wordmark (CSS mask).
- Row (mono 12px, `--fg-3`): `Free · MIT licence · v1.0.2` · `Source on GitHub` (GitHub glyph) · `Claude Meter, also by Yiftach Freeman` · `llms.txt`.
- Legal line: `Not affiliated with Apple. © 2026 Yiftach Freeman.`

### 4.7 The download sheet (the email ask; architect owns `lib/cta.js`, `lib/signup.js`, `css/sheet.css`)
Client decision (FACTS "Download email ask"): every Download CTA asks for an email first. The download itself never waits on anything.

**Shape.** One native `<dialog class="sheet" aria-labelledby="sheet-title">`, opened with `showModal()` (page inert, Esc and backdrop click close it, focus returns to the opener). Inside the top layer it draws:
1. **A copy of the menu bar band**: full-width black strip, height `MB`, with the notch centred and fillets at `--r-site` under both ends. It sits exactly over the real nav so the bar stays crisp while everything else dims. If the real band wasn't on yet (top of the hero), this strip plays the band animation in miniature: it spreads from the notch to both edges, 260 ms `taffy`. The download button makes the product do its trick on the way.
2. **The panel**: black (`--black`), 1px `--rim` edge, width `min(440px, 100vw − 32px)`, hanging from the band's bottom edge at centre, bottom radius 28px. Its top corners have concave fillets (radius `--r-site`) that join the band, so it reads as the band growing a tongue downward. `max-height: calc(100dvh − MB − 16px)`, scrolls inside. On phones it's the same shape at full width minus 16px gutters. It stays top-anchored, so the on-screen keyboard never covers the field.
3. `::backdrop`: `rgba(0,0,0,.55)` + `backdrop-filter: blur(8px) brightness(.7)`, 200 ms fade.

**Open (motion).** Panel `clip-path` goes from the notch's rect (`200pt × 32pt` at top centre, bottom radius 9pt) to the full panel rect over 420 ms on a WAAPI `linear()` spring generated from `taffy` (one small overshoot), falling back to `ease.out`. Content staggers in after 55% (`y 8→0`, opacity, 40 ms). **Close:** reverse into the notch, 260 ms `ease.swallow`. **Reduced:** 120 ms opacity only.

**View `mac` (desktop, no stored email).**
- Kicker (mono): `DOWNLOAD · V1.0.2`
- Title `#sheet-title` (`--t-h3`, wght 740): **Where should updates go?**
- Lede (`--fg-2`): `Leave your email and the download starts right away.`
- Field: label `Email`, `<input name="email" type="email" required autocomplete="email" inputmode="email" autocapitalize="off" spellcheck="false" placeholder="you@example.com">`, autofocus only with a fine pointer. Black field, 1px `--line-2`, radius 12px; on focus its border goes white and a 2px black band slides across its top edge (the house trick, 200 ms).
- Hidden honeypot: `<div class="sheet-hp" aria-hidden="true" inert><label>Leave this empty <input name="nt_hp" tabindex="-1" autocomplete="off"></label></div>`.
- Error `<p id="sheet-err" aria-live="assertive">` (always in the DOM): blank → `Your email, then the download.`; invalid → `That doesn't look like an email.` The field shakes once (`x` spring, `snappy`, 3 px). No download.
- Button (white pill, black text, full width, drawn down-arrow): `Download for Mac`, sub-label mono `Free · macOS 14+ · Apple silicon`.
- Fine print (mono 12px, `--fg-3`): `Used only for Notched updates. Kept in the maker's Google Sheet, never shared or sold.`

**Submit (valid email), strictly in this order, synchronously in the submit handler (keeps the user activation):**
1. Start the download: create `<a href="/download" download>` and `.click()` it.
2. Fire and forget: `fetch(meta[nt-signup].content, {method:'POST', mode:'no-cors', keepalive:true, body:new URLSearchParams({type:'mac', email, name:'', platform: navigator.userAgentData?.platform || navigator.platform, ref:'notched' + (document.referrer ? ' · ' + document.referrer : ''), company: form.nt_hp.value})}).catch(()=>{})`. Never awaited.
3. `localStorage['nt-email'] = email` (try/catch).
4. Swap to the done view: the field is "swallowed" (its text ScrambleTexts to `▮▮▮▮`, then the field `scaleY → 0` toward the top, 280 ms `ease.swallow`), a 22px ring fills and settles into a check.

**View `macDone`.**
- Kicker: check ring + `NOTCHED · V1.0.2`
- Title: **On its way.**
- Lede: `Open the DMG and drag Notched to Applications. Open it, agree to the licence, then click its icon in the menu bar and flip the switch.`
- `Didn't start? <a href="/download" download>Download again</a>`
- `Source on GitHub` (GitHub glyph, small) · `Done` button (closes).

**Returning visitor (stored email).** The CTA click starts the download directly (step 1 only, no POST) and opens the sheet straight in `macDone` with an extra line under the title: `Updates go to you@example.com. Not you?`, where `Not you?` clears the stored email and switches to `mac`.

**Phones and tablets (`noMac()`): view `macAway`.** Every CTA reads `Get it on your Mac`.
- Kicker `MAC APP · V1.0.2`; title **Get it on your Mac.**; lede `Notched is a Mac app, so it installs on your Mac, not this phone.` (`tablet` on iPad) `Send yourself the link and open it there.`
- Field label `Email · optional, for updates` (not required; if filled it must be valid, same errors).
- Button `Send the link to my Mac` → if an email was given, the same fire-and-forget POST; then `navigator.share({title:'Notched', url:'https://notched.vercel.app/'})`; if share is missing or throws (not `AbortError`), copy the URL to the clipboard; if that fails too, show the URL as selectable text.
- Done (`macAwayDone`): title **Open it on your Mac.**; lede `Link copied. Paste it into a note or a message to yourself, or just go to notched.vercel.app on your Mac.` (the "Link copied." sentence only when it was copied); button `Send it again`; `Done`.

**No JS.** The CTA is a real link to `/download`, so it downloads without asking (flagged in section 10).

---

## 5. Sections (ids, files, owners)

Template order: `hero`, `gone`, `try`, `features`, `how`, `faq`, `download`. Each builder owns `web/sections/<id>.html`, `site/css/<id>.css`, `site/js/<id>.js` (exports `init()` and returns a `kill()`; main.js calls them inside `mm` contexts).

---

### 5.1 `hero` — "Black out the notch."
**Layout (desktop).** Section 220vh; inner sticky 100vh = the screen in viewport mode (full-bleed wallpaper behind the fixed header/menu bar, bezel frame around). The wallpaper fills the top ~70% and fades to black at the bottom (3-stop gradient overlay, `transparent 45% → rgba(0,0,0,.6) 70% → #000 100%`). Content bottom-left on a 12-col grid (cols 1–8), 6vw from left, 9vh from bottom:
- Chip row (mono): `FREE` · `MACOS 14+` · `APPLE SILICON` · `V1.0.2`
- H1 (`--t-hero`, `--fg`, two lines): **Black out / the notch.**
- Lead (`--t-lead`, `--fg-2`, max 34ch): `Notched paints a black strip the height of your menu bar into a copy of your wallpaper. The bar goes black, the text goes white, and the notch disappears into the bezel.`
- Actions: primary pill `Download for Mac` (white, black text, drawn down-arrow glyph, magnet; `data-cta="mac"`, opens the download sheet, 4.7); secondary ghost pill `Try the switch` → smooth-scrolls to `#try`. Under them in mono `--fg-3`: `Free. No account. Notarized by Apple.`
- Right side, near the notch (desktop only), a hand-drawn arrow (SVG path, DrawSVG-style via `stroke-dashoffset`) curving up toward the notch with mono caption: `grab the notch and pull ↓`. It draws itself 1.6 s after load, and disappears forever after the first drag or once the band is on.

**Animation (motion context).** ScrollTrigger on the section, `start:'top top', end:'bottom bottom', scrub:0.9`. Timeline positions (0–1):
- 0.00–0.06: nothing (breathing room; if the visitor drags, drag wins: `band = max(scroll, drag)`).
- 0.06–0.42: `screen.setBand(0→1)`. Menu items go white as the band passes (auto mode). Hill parallax keeps running.
- 0.30–0.42: notch dissolve (rim and glint out).
- 0.42: crossing threshold (not scrubbed, triggered both ways): fillets spring in (`setRadius(settings.radius)` with `taffy` overshoot); nav ScrambleText into real links; `toast('Notch hidden.')` once per page view.
- 0.40–0.62: **the word "notch" gets swallowed.** SplitText chars of `notch.` (keep the `.`): each char squeezes `font-variation-settings wdth 100→75`, `scaleY 1→0.2`, then translates toward the notch's screen position (computed once, `x/y` per char) with `ease.swallow`, `opacity→0` in the last 20%. Stagger from the centre char outward (0.03). What's left: `Black out / the ___.` where the gap holds a 1px dashed `--line-2` rounded-rect outline the size of the word, which fades out by 0.7. The H1's accessible text never changes (chars are aria-hidden duplicates; the real text stays in an sr-only span).
- 0.62–0.80: a small white mono chip appears in the gap and types itself (ScrambleText, 500 ms) `GONE`, then stays: `Black out / the [GONE].` Chip is `aria-hidden`; reverses on scroll up.
- 0.75–1.00: bezel frame scales out; wallpaper scale 1→1.08 and `brightness 1→.6` (camera moves in, light dims); hero content `y 0→-8vh`, opacity →0 from 0.88. The fixed black menu bar remains: the hand-off is invisible because it's the same node.

**Interaction.** Notch drag/click (3.3). The sun/moon status glyph in the menu bar cycles time of day (dawn→day→dusk→night) with the sky lerping 900 ms; first load uses the visitor's local time.

**Mobile (< 900px).** Section 170vh. Screen in viewport mode with `--pt 0.98px`, wallpaper fills top 58% and fades to black; headline `clamp(3.25rem, 15vw, 4.5rem)` stacked below the notch region, left-aligned with 16px gutters. CTA reads `Get it on your Mac` (same white pill) and opens the sheet's `macAway` view (4.7). Drag hint caption: `pull the notch ↓` (touch drag works; `touch-action: pan-x` on the notch hit target only so page scroll elsewhere is untouched). Same scrub but over 170vh; char swallow uses words not chars.

**Reduced motion.** End state rendered statically: band on, fillets Medium, notch dissolved, `Black out / the notch.` intact (no swallow), real nav links, noon wallpaper, no arrow drawing (arrow shown static), no bezel animation. Notch click/drag still toggles band instantly.

---

### 5.2 `gone` — the manifesto
**Layout.** Black. 140vh section, sticky inner 100vh, single column (cols 2–10 desktop), `--t-h2` at wght 650, left-aligned. Eyebrow mono `QUIETLY, ON PURPOSE`.

**Copy (4 lines, each its own paragraph):**
1. `The notch is fine. It's just always there.`
2. `Right in the middle of your menu bar. In every app. All day.`
3. `Notched doesn't hide the notch. It hides everything around it. The bar goes black, and black is what the notch was all along.`
4. `Flip one switch. Then forget it's installed.`

**Animation.** Word-by-word "ink" (SplitText words): every word starts at `--fg` 14% opacity; a scrubbed **black band with a white text layer** sweeps down the paragraph like a reading bar: implement as `dualText` per paragraph where the overlay's `clip-path` bottom edge is scrubbed from 100%→0% line by line, so words go from ghost to white exactly as the bar passes (the product's "text turns white" again). Scrub 0.6 over the section. The word `black` in line 3 is the one exception: when inked it gets a black pill behind it (the band, `--black` on `#fff` text inverted: white pill, black text) that springs in width (`snappy`). Line 4's `Flip one switch.` is a link to `#try` once inked (underline draws in).

**Mobile.** Same, 120vh, `clamp(1.9rem, 8vw, 2.6rem)`. **Reduced.** All text full `--fg`, no band, no pill animation (pill static).

---

### 5.3 `try` — the operable popover ("Psst" is Alcove's; ours is a dare)
**Layout (desktop).** 100vh+ black section, not pinned. Two columns: left (cols 1–7) a `display`-mode screen at ~60vw wide (the "mirror", follows settings, wallpaper `hills`, local time); right (cols 8–12) the popover at real 340px, hanging from a small drawn Notched menu-bar icon (the popover is positioned as if opened from the mirror screen's menu bar: a 1px connector line from the icon in the mirror's menu bar down to the popover top).
- Eyebrow mono: `THE REAL THING, MORE OR LESS`
- H2 above the pair, left: **Go on. Flip it.**
- Sub (`--fg-2`): `This is the Notched menu, rebuilt for the browser. Every switch works, and everything you change here also changes this website.`
- Appearance toggle chip under the popover: `Dark ● ○ Light` (segmented, mono) → `p.setAppearance`.
- Mono spec plate under the mirror, live: `BAND: ON · CORNERS: MEDIUM 14PT · DISPLAYS: ALL` (updates as you toggle; ScrambleText on change, 300 ms).

**Animation.**
- Enter (once, `start:'top 70%'`): mirror rises (`y 60→0`, `rotateX 8→0`, perspective 1400, 900 ms `ease.out`); popover drops from the icon (`scaleY .6→1`, origin top, `ease.drop`, 520 ms) like a menu opening.
- **Ghost cursor** (motion only): if the section is ≥ 60% visible and there's no input for 3.5 s, a drawn macOS-style arrow cursor (our SVG) glides (`ease.inOut`, 900 ms) to the switch, presses (scale .9), the switch flips, preview processes, status changes, mirror's band sweeps on; then it clicks `Large` (fillets overshoot), then rests off to the side and fades. Plays **once**. Any real `pointerdown`/`keydown` in the section cancels it permanently. Caption beside the popover while idle: `It works. Try it.` (fades after first input).
- All popover changes apply to the mirror, the hero (if scrolled back), the nav fillets, and the features stage, through `settings`.
- Toasts appear above the mirror's notch on each change (`Corners · 20pt`, `Built-in display only`, `Wallpaper rotated`), short, mono, then swallowed into the notch.

**Mobile.** Stack: H2 + sub, then the mirror (full width minus gutters), then the popover scaled to `min(340px, 100vw - 32px)` (layout reflows: it's real HTML, not a `transform: scale`). No ghost cursor (touch screens): instead the switch does a gentle `x` wiggle once on enter. Popover controls have ≥ 44px hit areas via padding (visual size unchanged).

**Reduced.** No enter motion, no ghost, instant state changes, no toasts' motion (they appear/disappear with a 120 ms fade).

---

### 5.4 `features` — five chapters on one stage
**Layout (desktop).** Section height `5 × 90vh`. Left column (cols 1–5) holds 5 chapter blocks, each `min-height: 90vh`, vertically centred text. Right column (cols 6–12) is a sticky 100vh stage holding **one** `createDisplays` row (initially 1 built-in screen at ~48vw) plus the chapter readouts. A vertical chapter rail at the far left: 5 short bars, active one white and 28px tall, others `--line-2` 12px (spring height). Each bar is a `<button>` that scrolls to its chapter (`scrollIntoView({behavior})`, or instant under reduced).

Eyebrow mono at top: `WHAT IT HANDLES`. H2: **Set it once. It keeps up.**

Chapters (h3 + body + one tactile toy each; scrubbing happens over each chapter's own ScrollTrigger `start:'top 60%' end:'bottom 40%'`):

1. **h3** `Dynamic wallpapers keep moving.`
   **Body** `Time-of-day and light/dark wallpapers keep every frame and their schedule, so your desktop still changes through the day, under a black bar. The first pass takes a few seconds.`
   **Stage:** scroll scrubs `setTime(0→1)` across the chapter (dawn → day → dusk → night), the band stays black throughout, menu text stays white. **Toy:** a draggable sun on a thin arc above the stage (`Draggable` x-bounded, `InertiaPlugin` throw; releases into a `lazy` spring) to scrub time yourself; drag overrides scroll until the chapter is left. Mono readout `06:40 · DAWN` → `13:10 · DAY` etc. (labels only, the hours are illustrative of the slider position, not a product claim).

2. **h3** `Every display. Every Space.`
   **Body** `Each screen gets its own copy at its own resolution. Other Spaces are fixed up when you visit them. Prefer just the built-in? There's a box for that.`
   **Stage:** `setCount(1→2→3)` at 25% and 55% of the chapter: externals slide in from the right with `lazy` spring and slight rotation (−2°→0), each already wearing its band (the band sweeps on 200 ms after it lands). At 80%: a mini checkbox `Built-in display only` ticks itself and the external bands retract. **Toy:** that checkbox is real; click it back and forth.

3. **h3** `Rounded corners, in three sizes.`
   **Body** `Little concave corners under the bar, so the desktop reads like a rounded screen. Small, Medium or Large. Medium unless you say otherwise.`
   **Stage:** the camera zooms into the top-left corner of the built-in screen (stage `scale 1→3.2`, origin top-left, scrubbed), and the fillet steps `10 → 14 → 20` at 30/55/80% of the chapter with a `taffy` overshoot each time. Giant mono numerals beside the corner: `10` `14` `20` with `PT` (the active one `--fg`, others `--fg-3`; hairline above each, Apple stat-column style). **Toy:** click a numeral to set it; it also sets the site's own nav fillets (settings).

4. **h3** `Rotation, done by hand.`
   **Body** `macOS can't shuffle wallpapers under a black bar, so Notched rotates a folder itself: every 5 minutes, 15, 30, hourly or daily, with a Next button for the impatient. A shuffle folder you already set in System Settings is taken over automatically.`
   **Stage:** zoom back out. A fanned **deck** of 4 wallpaper cards (`hills`, `dunes`, `lake`, `grid`, each a `mini` screen) sits behind the main screen. At 30/60% the top card flicks off to the left (`rotate -14°, x -120%`, `ease.swallow`) and the next wallpaper slides in **under the band**, which never moves. Interval chips `5 min · 15 min · 30 min · Hourly · Daily` with `Hourly` selected. **Toy:** a `Next` button (black pill) and a draggable deck (flick the top card left/right with `Draggable` + inertia; past 30% width it goes, else it springs back).

5. **h3** `It watches. Then it lets go.`
   **Body** `Notched checks every 2 seconds. Change your wallpaper and the bar is redone within about two seconds. Switch it off and your original wallpaper comes back.`
   **Stage:** at 20%: the wallpaper swaps instantly to `dunes` with the band *missing* (the notch visible again, menu text dark); `pulse()` ring from the menu-bar icon; mono countdown `2.0 → 0.0 s` ticks; band sweeps back on at 0. At 70%: the band retracts to the notch (`setBand(1→0)`, `ease.swallow` reversed), the notch reappears with its rim light, mono line `ORIGINAL RESTORED`. Scroll back = everything reverses. **Toy:** a `Change wallpaper` button that replays the 2-second redo on demand (with real `setTimeout(2000)`).

**Mobile.** No sticky stage. Each chapter is a card (`--ink-1`, radius 28px, padding 20px) with its own small `display` screen above the text (5 instances, each created lazily by `whenVisible` and destroyed when far away to keep only ≤ 3 alive). Scroll scrubs replaced by enter-triggered autoplay (each chapter's sequence plays once on 50% visibility, total 2–3 s). Toys stay (sun drag, deck flick, numerals, buttons). Rail hidden.

**Reduced.** Same card layout as mobile, every card shows its end state (night wallpaper with band; 3 displays with built-in-only off; Large fillet; second wallpaper under band; band on). Toys still work, instantly.

---

### 5.5 `how` — "Here's the whole trick." (mechanics + privacy, the trust section)
**Layout.** Black, 200vh section, sticky inner 100vh. Centre: an exploded stack of 4 layers in CSS 3D (`perspective: 1600px`, stage `rotateX(58deg) rotateZ(-32deg)` isometric):
1. bottom: `YOUR WALLPAPER` (a mini wallpaper card) with mono tag `ORIGINAL · NEVER MODIFIED`
2. `A COPY` (same card, slight offset) tagged `~/Library/Application Support/Notched`
3. `A BLACK STRIP` (just the band + fillets as a black slab with rim light) tagged `MENU-BAR HEIGHT · PURE BLACK`
4. top: a thin frame with the notch, tagged `YOUR DESKTOP`

Left text column (cols 1–5):
- Eyebrow mono `HOW IT WORKS`
- H2: **Here's the whole trick.**
- Steps (numbered mono 01–04, `--t-lead`):
  `01  Notched makes a copy of your wallpaper. The original file is never touched.`
  `02  It bakes a black strip, exactly the height of your menu bar, into the top of the copy.`
  `03  It sets the copy as your desktop picture, at your screen's own resolution, placed the way you had it: fill, fit, stretch or center.`
  `04  The menu bar goes black, its text goes white, and the notch has nothing left to stand out against.`
- Privacy block below a hairline, `--fg-2`, with the key phrases in `--fg` (Apple bold-in-grey):
  `**One network request:** a daily check for updates. **No analytics. No account.** Copies live in` `~/Library/Application Support/Notched` `and nothing else leaves your Mac.`
  Second line, same style: `**This website** asks for your email once, when you download, to send Notched updates. It sits in the maker's Google Sheet and is never shared or sold. No analytics here either.`
  Fine print line, mono `--fg-3`: `Leaves Aerial, colour and other live wallpapers alone. There's nothing still to edit.`

**Animation (scrub 0.6).** 0–0.2: the four layers start fused into one flat desktop image (the "after"). 0.2–0.6: they **separate in z** (`translateZ` 0 → 0/90/180/270px), each tag draws its leader line (stroke-dashoffset) and fades in as its layer lifts; the active step text goes `--fg`, others `--fg-3`. 0.6–0.75 hold. 0.75–1: the stack slams back together (`translateZ → 0` with a scrubbed `ease.drop` feel: overshoot −8px then 0) and a mono stamp `DONE IN ABOUT TWO SECONDS` scrambles in. **Toy:** hover/tap a layer to lift it alone (`snappy` spring, +40px z); the black-strip layer, when tapped, flips over to show its underside is also black (`rotateX 180`), with toast `Black on both sides. We checked.`

**Mobile.** No 3D isometric: layers as a vertical stack of 4 cards that slide apart vertically (gap 0 → 24px) on enter, tags under each. Steps below. **Reduced.** Static separated stack, all tags visible, all steps `--fg`.

---

### 5.6 `faq` — "Fair questions."
**Layout.** Black, normal flow, cols 3–10. H2 **Fair questions.** Eight `<details>` rows (native disclosure, keyboard-free), each row a black band on `--ink-1` with a 1px `--line` top. The open row's summary bar turns pure black and its text flips white with a tiny version of the band sweep (a `::before` black bar scales X from the left 0→1, 300 ms `ease.out`), and the answer drops with height animated via `grid-template-rows: 0fr→1fr` (CSS only). Marker: a small notch shape (CSS) that fills black and rotates 180° when open.

**Copy (keep JSON-LD FAQPage in sync, same text):**
1. `How does Notched work?` — `Notched saves a copy of your wallpaper with a black strip the height of the menu bar and sets the copy as your desktop picture. The menu bar turns black and the notch blends into it. Your original file is never touched.`
2. `How do I turn it off?` — `Flip the switch off and your own wallpaper comes back. If you use several Spaces, each one gets its wallpaper back the next time you visit it while Notched is running.`
3. `Does it work with dynamic wallpapers?` — `Yes. Time-of-day and light or dark wallpapers keep all their frames and their schedule, so they keep changing. The first pass takes a few seconds.`
4. `What about Aerials and color wallpapers?` — `Those are drawn live by macOS, so Notched leaves them as they are. Pick a photo or a dynamic wallpaper to hide the notch.`
5. `Can it shuffle my wallpapers?` — `macOS can't shuffle under the black bar, so Notched does it for you: pick a folder and an interval. If you already had a shuffle folder set, Notched takes it over.`
6. `Does Notched connect to the internet?` — `Only to check for updates, once a day. No analytics and no account.`
7. `What do I need?` — `A Mac with Apple silicon running macOS 14 or later. It's built for MacBooks with a notch and works on external displays too.`
8. `Why does the download ask for my email?` — `So the maker can tell you when Notched updates. It's kept in his Google Sheet and never shared or sold. The app itself collects nothing.`

**Mobile.** Full width with 16px gutters. **Reduced.** No sweep, instant open.

---

### 5.7 `download` — "Pull the cord."
**Layout.** 160vh section, sticky inner 100vh. Starts as black page with a **hanging pull cord** from the nav band at top centre (an SVG line + a small ring handle, swaying gently on a 3 s pendulum when idle; motion only). Centre: H2 **Make it disappear.** Below: primary pill `Download for Mac` (big, white, magnet, drawn down-arrow that does a small drop loop on hover: arrow `y 0→6→0`; `data-cta="mac"`, opens the sheet, 4.7), mono line `Free · MIT licence · v1.0.2 · macOS 14+ · Apple silicon · Notarized by Apple`, text link `Source on GitHub` (GitHub glyph).

**Animation.** The black **band comes down and fills the screen** (subtraction to the end): the section opens on the bright wallpaper (a `viewport`-like screen, `time` = visitor's local, band at 0, notch visible), and as you scroll the band descends from the nav and grows downward until the whole viewport is black (`clip-path: inset(0 0 calc(100% - p*100%) 0)` on a black layer, its bottom edge carries the two concave fillets so it reads as the band itself getting taller). The H2 and CTA sit on top as `dualText`: dark text on the wallpaper, white where the black has passed. At 100% the page is black, the cord swings once (spring), done.
- **Toy:** grab the cord ring and pull down (`Draggable`, y only, rubber-band): pulling scrubs the curtain to 100% instantly (springs the black down with `taffy`) and on release past 60% fires a toast `That's the whole app. Now get the real one.` and opens the download sheet (4.7) with the cord as its focus-return target. The cord never starts a download by itself; the sheet's submit does.
- After the curtain is full, the cross-promo line appears (mono, small): `Also by Yiftach Freeman: Claude Meter puts your Claude usage limits right in the MacBook notch. ↗`

**Mobile.** 120vh, same curtain, no cord (tap-friendly CTA instead). CTA `Get it on your Mac` → sheet `macAway` view. **Reduced.** Static black end state, cord static, CTA.

Then footer (4.6).

---

## 6. Easter eggs (the screenshot list)
1. Drag the notch down: the menu bar goes black (hero, any `display` screen).
2. Click the notch: the camera blinks, 4 escalating toasts.
3. Popover → `Large`: the website's own top corners grow to 20pt.
4. Popover → `Hide menu bar icon`: the website's own menu-bar icon disappears; click "Notched" in the nav to get it back (`Welcome back.`).
5. Popover → `Quit`: `It's a website. It can't quit.`
6. The sun/moon glyph in the nav cycles the time of day for every wallpaper on the page.
7. Footer wordmark: the notch cut-out in NOTCHED; hover it (desktop) and a tiny band slides over it.
8. Type `notch` anywhere (keydown buffer, not in inputs): every visible screen's notch blinks at once and the toast says `Hi.`

All are toys; none implies a feature the app doesn't have.

---

## 7. Accessibility
- One `<h1>`, ordered `h2`/`h3`. Landmarks: header, main, footer. Skip link.
- Every interactive toy has a real button/input equivalent; Draggables are mirrors of keyboard-operable controls (switch, segmented, checkboxes, Next, numerals, `Change wallpaper`).
- `:focus-visible` = 2px `--focus` outline, 3px offset, on everything including popover controls (macOS-style blue glow inside the popover: `0 0 0 3px rgba(47,124,246,.5)`).
- Toasts use one `role="status"` region. Ghost cursor and decorative SVG `aria-hidden`.
- Split text: real text stays in the DOM; split copies `aria-hidden`.
- Contrast: body ≥ `--fg-2` on black; `--fg-3` only ≥ 13px and non-essential. On the bright hero wallpaper, text sits only on the darkened lower area (verify ≥ 4.5:1 at all four times of day; the night sky is dark so white menu text is fine; day sky with band off uses `--black` menu text at 85%).
- 320px: no horizontal overflow; the notch scales with `--pt` and the fake menus collapse to icon + `Notched` + `Menu`.
- Download sheet: native `<dialog>` modal (inert page, Esc, focus trap by the browser), labelled by its title, focus moves to the field (fine pointer) or the title (`tabindex=-1`), returns to the opener on close. Errors in an `aria-live="assertive"` node linked with `aria-describedby`. Field and buttons ≥ 44 px tall. The fine print is ≥ 12px mono `--fg-3` on black (5.9:1).
- Touch: `touch-action: none` only on Draggable handles (notch, sun, deck top card, cord), never on large areas.

---

## 8. Performance plan
- JS budget: GSAP core+ST+SplitText+CustomEase+Scramble+Draggable+Inertia ≈ 72 KB gz; our code target ≤ 45 KB gz. Total ≤ 120 KB gz (well under the 350 cap). No WebGL, no Lenis, no video, no Lottie.
- Fonts: 2 variable woff2 subsets (latin), Bricolage preloaded; ≤ 160 KB.
- Images: only `icon-*.png`, `claude-meter.png`, `og.png`. Wallpapers are SVG (≈ 2 KB each, shared `<symbol>`s for hill paths).
- Screen instances: hero (1), try mirror + popover mini (2), features stage (1–3 + 4 deck minis), how (2 minis), download (1). Each instance's drift/clock loop pauses via `whenVisible`. Hills breathing writes `d` on 2 paths per visible instance at ≤ 30 fps (skip every other tick).
- Animate only `transform`, `opacity`, `clip-path`, `filter` on small elements, SVG attributes on small SVGs. No layout props in scrubs. Sticky (not ST pin) avoids spacer CLS.
- `content-visibility: auto; contain-intrinsic-size` on `how`, `faq`, `download`, footer.
- `signup.js` + `sheet.css` (≈ 5 KB gz) load on first CTA intent (`pointerenter`/`focus`/`touchstart`), not at boot; a click before they arrive awaits the import (≤ 1 frame on a warm cache).
- No-JS: full content, CSS noon wallpaper, band shown on (end state), real nav links, `<details>` FAQ works, download link works (no email ask without JS).
- QA (qa.mjs) adds a sheet check: click the hero CTA → dialog open; submit blank → error, no navigation; submit `qa@example.com` with `fetch` stubbed to reject → the `/download` request still fires and `macDone` shows. Mobile viewport → `macAway` view, CTA label `Get it on your Mac`.
- QA gates (qa.mjs): 0 console errors, no long tasks > 120 ms after load on desktop, 60 fps band scrub at 4× CPU throttle on the 390px viewport (frame bursts during hero scrub), no overflow at 320, `--reduced` run shows end states, LCP element = H1.

---

## 9. SEO / meta
- `<title>Notched: hide the MacBook notch</title>`; description: `Free macOS menu bar app that hides the MacBook notch by baking a black menu-bar strip into a copy of your wallpaper. Works with dynamic wallpapers and every display.`
- `<meta name="nt-signup" content="https://script.google.com/macros/s/AKfycbyYJTV8Mm_N77moH5FPesW6b_7Khdt2XHBn9IvVHSbHGw43RxAkXjgibvvWu-QkzNuMRA/exec">` in `<head>` (from FACTS, verbatim).
- Canonical `https://notched.vercel.app/`. OG 1200×630 rendered from `web/og.html`: black canvas, a wide screen-top crop with the band on and fillets at 20pt, a daylight hills wallpaper below, the wordmark `Notched` bottom-left in Bricolage 800 and mono `Black out the notch. Free for Mac.`
- JSON-LD: SoftwareApplication (keep `"softwareVersion":"1.0.2"` pattern exactly, `operatingSystem: "macOS 14 or later"`, `offers.price: 0`) + FAQPage (section 5.6 copy). Keep `llms.txt` `- Version:` line untouched.

---

## 10. Fact flags for the lead (do not "fix" on the site without the maker)
- `site/vercel.json` redirects `/download` → `/downloads/Notched-1.0.1.dmg`, and `site/downloads/` only holds the 1.0.1 DMG, while FACTS/Swift say v1.0.2. The page says v1.0.2 (per FACTS); the redirect/DMG mismatch is the release script's job, flagged here.
- `popover-*.png` renders show `v1.0.1` and the short idle status `Notch hidden.`; the recreation shows `v1.0.2`, and uses the manager's longer status after processing (both strings are real, from `SettingsView.swift` and `WallpaperManager.swift`).
- FACTS uses "colour"; the FAQ uses US "color" per the tone rule; product UI strings stay verbatim. (The sheet's "agree to the licence" mirrors the app's own dialog wording; switch to "license" if the lead wants strict US.)
- With JS off, `Download for Mac` is a plain `/download` link, so it skips the email ask. That's deliberate: the download never waits on anything. Changing it means gating the DMG on JS.
- The sign-up endpoint is shared with Claude Meter's list (client's choice); `ref: "notched…"` is how the maker tells them apart. Don't change the field names.
