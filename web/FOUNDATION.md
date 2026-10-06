# Notched site: foundation (read before building a section)

SPEC.md is the design law and FACTS.md is the product law. This file covers only how the code is wired.

## Ownership
| Owner | Files |
|---|---|
| Architect/integrator | `web/index.html`, `web/build.mjs`, `web/qa.mjs`, `web/og.html`, `site/css/{tokens,base,sheet}.css`, `site/js/main.js`, `site/js/lib/*` (except `component.js`), `site/vendor/*`, `site/fonts/*`, `site/assets/grain.png`, `site/vercel.json`, `.gitignore` |
| Product component agent | `site/js/lib/component.js`, `site/css/component.css` (+ `component-lab.html`) |
| Section builder `<id>` | `web/sections/<id>.html`, `site/css/<id>.css`, `site/js/<id>.js` only |

Section ids, in order: `hero gone try features how privacy faq download`.
- Every rule in `<id>.css` is scoped under `#<id>`. Never style `html`, `body`, `.nav`, `.cta`, `.sheet`, `.foot`, `.promo` or another section.
- The section root is `<section id="<id>" class="s s--<id>" data-section="<id>" aria-labelledby="…">`, and it must be a **direct child of `<main>`** (that is how main.js finds it).
- Exactly one `<h1>`, and it lives in hero. FAQ: 8 `<details>`, each with `<summary><span class="faq__q">Question</span></summary>`. build.mjs generates the FAQPage JSON-LD from them, so the page and the JSON-LD always match word for word.
- Version: write `<span data-version>v1.0.2</span>` (or `v%VERSION%`). The build fills it from `project.yml`, and `fillVersion()` re-syncs it at runtime from the JSON-LD.
- Need something in a shared file? Ask the integrator. Don't edit it yourself.

## Section module contract
```js
// site/js/<id>.js — loaded with import() when the section comes within 1 viewport
export default function init(root, ctx) {
  const { gsap, ScrollTrigger, SplitText, mm, MQ, reduced, settings, stores, lib, Component } = ctx;
  mm.add(MQ, (c) => {
    const { desk, mob, still, hover } = c.conditions;   // implement desk, mob AND still
    if (still) { /* end state, durations 0, no scrubs or sticky */ return; }
    gsap.to(stores.hero.state, { band: 1, ease: 'none',
      scrollTrigger: { trigger: root, start: 'top top', end: 'bottom bottom', scrub: 0.9 } });
    return () => {};                                     // matchMedia reverts its own tweens/triggers
  });
  return () => mm.revert();                              // optional cleanup
}
```
- `mm` is a fresh `gsap.matchMedia()` for each section. `reduced` is the boolean at init time; for a live value use `lib.reduced()`.
- `init` runs inside try/catch, so a throwing section logs `[section:<id>]` and the rest of the page keeps working. CTAs and `[data-version]` inside `root` are wired **after** init, which means markup you inject during init is covered.
- `Component` is the product module (`lib/component.js`: `createScreen`, `createPopover`, `paintWallpaper`, `SCREEN_DEFAULT`, `PALETTE`, `PRESETS`, `phaseFromClock`…). It is `null` if that module fails, so guard it: `if (!Component) return;`.
- Pins are CSS `position: sticky` inside tall sections, with ScrollTrigger reading progress. **Never use `pin:true`.** Give sticky stages explicit heights. Animate only transform, opacity and clip-path (plus custom props that feed them).
- Loops (clock, drift, twinkle) must pause off-screen with `lib.whenVisible`.
- There is no Lenis. Scroll is native, and gsap runs on its own single ticker. `ScrollTrigger.refresh()` runs once after fonts load (or after 600 ms).

## Shared state
| Store | Keys | Who writes |
|---|---|---|
| `stores.hero` | `band 0..1`, `progress 0..1` (hero scroll progress), `radius`, `corners`, `time`, `preset`, `displays`, `builtInOnly`, `menuText`, `notchRim` (null = derived), `status`, `iconHidden` | hero (band/progress; drag: `band = max(scroll, drag)`), anyone may read |
| `stores.time` | `t` (0..1, wraps; mid-tween it can exceed 1, so read it as `t % 1`) | nav sun/moon glyph; screens with `time:'local'` should follow it |
| `settings` | `on, corners, radius, dynamic, builtInOnly, rotate, every, folder, loginItem, iconHidden, appearance` | the `#try` popover. It writes `--r-site-pt` on `<html>` (0 when corners are off) and toggles `html.icon-hidden` |

Store API: `createStore(init)` returns `{ state, get(), set(patch), subscribe(fn(state, changedKeys), {now}) → unsub, flush() }`. `state` uses accessor props, so `gsap.to(store.state, {band:1})` tweens it directly. Notifications are batched to one rAF.

**What the nav does from `stores.hero`** (so hero only writes band/progress):
- `band` drives the nav's black band (bandText, centre origin) and the notch rim (fades from .7).
- `band ≥ .999` adds `html.band-on` and `.nav.is-black`, brings in the fillets, scrambles the menus into links and shows the Download pill.
- `band < .98` while `progress < .42` scrambles back.
- `progress .75→1` slides the bezel strips out (`--out`).
- `progress ≥ 1` brings in the promo pill.
- Under reduced motion it sets band 1 and progress 1 itself.

## Utilities: `ctx.lib` (or import from `./lib/<file>.js`)
| Call | Notes |
|---|---|
| `bandText(el,{origin:'center'\|'left'\|'right'})` → `{set(p), setEdges(l,r), refresh(), destroy(), el}` | White-on-black clone clipped by `inset()`. `set(p)` grows the bar from origin. `setEdges(l,r)` takes the uncovered fractions from each side (an exit to the right is `setEdges(p,0)`). Call `refresh()` after you change el's text. |
| `splitChars/Words/Lines(el, opts)` → SplitText | Masked, `autoSplit`, aria-safe. Animate in `onSplit:(s)=>gsap.from(s.lines,{yPercent:105})` and **return** the tween. |
| `roll(el, value, {duration})` | Rolls each changed char in a 1em mask. Under reduced motion it swaps the text. |
| `onClock(fn(text,date))` → unsub | One minute-aligned timer. Gives `Tue 14:32` in the visitor's locale. |
| `whenVisible(el,onIn,onOut,rootMargin='10%')` → unobserve | Shared IO. It also fires out/in on tab hide/show. |
| `toast(text,{anchor,ms})` | A black mono pill that drops from the anchor (default: nav notch). One `role=status`. |
| `ghost(steps,{root,idle})` | Plays a scripted cursor once per page load. `steps:[{el, click, wait}]`. Real input kills it for the session. |
| `blinkAll()` | Blinks the nav lens and dispatches `document` `nt:blink`, so product notches should listen. |
| `fillVersion(root)`, `version()` | Reads the JSON-LD `softwareVersion`. |
| `initCtas(root)`, `noMac()`, `startDownload()`, `DOWNLOAD`, `REPO` | CTAs are delegated globally, so you only write the markup below. |
| `EASE.{out,inOut,sweep,swallow,fillet,knob}` | GSAP ease names (CustomEase). |
| `cssEase(name)` | A WAAPI/CSS string. `spring` and `fillet` are real `linear()` overshoots. |
| `DUR` | `micro .16, ui .26, band .7, reveal .8, scene 1.1` (seconds). |
| `MQ`, `reduced()`, `onReducedChange(fn)` | Media conditions and the live reduced-motion switch. |

**Events:**
- `document` `nt:highlight` `{name:'switch'}`: the nav's Notched icon fires it after scrolling to `#try`. The try section listens and calls `popover.highlight(name)`.
- `nt:blink`: see `blinkAll()` above.

**CTA markup (always):**
```html
<a class="cta" href="/download" data-cta="mac"><svg class="cta__arrow" aria-hidden="true"><use href="#i-arrow-down"/></svg><span class="cta__label">Download for Mac</span></a>
```
- Variants: `.cta--lg`, `.cta--full`.
- The click opens the email sheet (lib/signup.js, lazy). On phones and tablets the label is rewritten to "Get it on your Mac" with an up arrow.
- Other shared classes: `.pill-ghost`, and `.gh-link` with `<svg><use href="#i-github"/></svg>`.
- Shared SVG symbols: `#i-arrow-down`, `#i-arrow-up`, `#i-github`, `#i-notched`.

## Tokens (`site/css/tokens.css`)
- **Type:** `--f-display` (Bricolage, variable opsz/wdth/wght), `--f-mono` (Martian), `--f-mac` (system-ui, for recreated macOS UI only).
- **Type scale:** `--t-mega --t-hero --t-figure --t-h2 --t-statement --t-manifesto --t-h3 --t-lede --t-body --t-chip`. Matching classes: `.t-mega .t-hero .t-h2 .t-statement .t-manifesto .t-h3 .t-lede .t-body .t-figure .mono .eyebrow`.
- **Colour:** `--black --ink-1 --ink-2 --line --line-2 --fg --fg-2 --fg-3 --paper --paper-line --on-paper-2 --rim --focus --focus-paper --error`. Mac controls: `--mac-blue*`. Popover: `--pop-{dark,light}-*`. Wallpaper: `--wp-{dawn,day,dusk,night}-{top,mid,hz,sun}`.
- **Product geometry:** `--pt` (px per macOS pt; viewport scale), `--mb` (menu bar height), `--notch-w`, `--notch-h`, `--bezel`, `--r-s/m/l` (10/14/20, unitless pt), `--r-site` (live fillet px, from `--r-site-pt`).
- **Space:** `--gutter --margin --max --sec-pad`. Layout: `.wrap`, `.grid` (12 columns, or 4 below 900 px), `.s--pad`, `.paper` (light ground, swaps `--focus`), `.sr-only`.
- **Motion:** `--e-out --e-inout --e-sweep --e-swallow --e-spring --e-fillet`, `--d-micro/ui/band/reveal/scene`.
- **Z:** `--z-nav 80`, `--z-grain 90`, `--z-toast 95`. Keep section content below 80.
- **`<html>` state hooks:** `.js`, `.still` (reduced motion), `.intro` with `.intro--full`/`.intro--quick` (cleared at 1.1 s / 0.4 s or on first input), `.band-on`, `.icon-hidden`, `.sheet-open`, `data-phase="dawn|day|dusk|night"`, and `--t0` (time at first paint; `?t=0|.25|.5|.75` overrides it).

## Build and QA
```sh
cd web
node build.mjs                                   # → site/index.html (version, section css links, modulepreloads, FAQ JSON-LD)
# server (integrator keeps one on :4321): python3 -m http.server 4321 --directory ../site
timeout 170 node qa.mjs --viewport desktop --steps 8 --run <name>
timeout 170 node qa.mjs --viewport mobile  --steps 8 --run <name>
timeout 170 node qa.mjs --viewport desktop --reduced --steps 8 --run <name>
timeout 170 node qa.mjs --viewport mobile --overflow --steps 1 --run <name>
timeout 170 node qa.mjs --viewport desktop --only-frames --frames hero:0,hero:.42,hero:.62,hero:1 --t .5 --run <name>
timeout 170 node qa.mjs --viewport desktop --steps 1 --sheet --run <name>   # email sheet; script.google.com is aborted
```
- `<id>:<p>` frames map sticky progress (top-top → bottom-bottom).
- Screens are saved to `/private/tmp/claude-501/-Users-freemansmain-Ai-Projects-Notched/fc959023-bd43-4ab1-9c6c-40abca6f8b97/scratchpad/qa/<run>/`. **Open them with Read.**
- QA exits 1 on console errors, page errors, failed requests or overflow.
- Debug: `__nt.stores.hero.set({band:1, progress:1})`, `__nt.reload('<id>')`, `__nt.sections`.

## Notes for the lead
- SPEC's `fillet` and `knob` CustomEase paths were invalid cubics (5 control pairs) and threw at boot. motion.js completes them into two segments of the same shape.
- The email sheet checks pass on desktop and phone. A valid email fires `/download` in the same task as the POST, never after it.
- `site/style.css` and `demo.js` are deleted. `site/og.html` stays until `web/og.html` and the new `og.png` exist (not done yet). `vercel.json` gained the fonts/vendor/css/js cache headers.
- The product files are `component.js` and `component.css`, not SPEC's `screen.js`/`popover.js`/`wallpaper.js`/`product.css`. The template links `component.css` (and `product.css`, but the build drops links to files that don't exist).
