// Entry (SPEC §2.3). Native scroll + ScrollTrigger, one gsap ticker, lazy section modules.
import { reduced, onReducedChange, mm, MQ, EASE, DUR, cssEase } from './lib/motion.js';
import { createStore } from './lib/store.js';
import { settings } from './lib/settings.js';
import { bandText } from './lib/bandtext.js';
import { splitChars, splitWords, splitLines } from './lib/split.js';
import { roll } from './lib/roll.js';
import { onClock, formatClock } from './lib/clock.js';
import { whenVisible } from './lib/visible.js';
import { toast } from './lib/toast.js';
import { ghost } from './lib/ghost.js';
import { fillVersion, version } from './lib/version.js';
import { initCtas, noMac, startDownload, DOWNLOAD, REPO } from './lib/cta.js';
import { initNav, blinkAll, phaseOf } from './lib/nav.js';

const { gsap, ScrollTrigger, SplitText, ScrambleTextPlugin } = window;
const html = document.documentElement;

if (gsap) {
  gsap.registerPlugin(...[ScrollTrigger, SplitText, ScrambleTextPlugin].filter(Boolean));
  ScrollTrigger?.config({ ignoreMobileResize: true });
}

// The hero store: the one product state the nav, bezel and hero share. Mirrors screen.js SCREEN_DEFAULT
// plus `progress` (hero scroll progress 0..1, written by the hero section).
const stores = {
  hero: createStore({ band: 0, radius: settings.state.radius, corners: settings.state.corners, time: 'local', preset: 'hills', displays: 1, builtInOnly: false, menuText: 'auto', notchRim: null, status: 'idle', iconHidden: false, progress: 0 }),
  // Page-wide time of day (0..1, wraps; may briefly exceed 1 mid-tween, so read it with `% 1`).
  // Screens whose time is 'local' follow this. The nav's sun/moon glyph steps it.
  time: createStore({ t: parseFloat(getComputedStyle(html).getPropertyValue('--t0')) || 0.25 }),
};

const lib = { bandText, splitChars, splitWords, splitLines, roll, onClock, formatClock, whenVisible, toast, ghost, fillVersion, version, initCtas, noMac, startDownload, DOWNLOAD, REPO, blinkAll, phaseOf, EASE, DUR, MQ, cssEase, reduced, onReducedChange };
const sections = new Map();   // id → { cleanup, error }
// The product component (another owner): lazy, shared, and optional — a missing/broken module gives null.
let componentP = null;
const loadComponent = () => (componentP ||= import('./lib/component.js').catch((e) => { console.warn('[component] unavailable', e); return null; }));

function boot() {
  try { initNav({ stores }); } catch (e) { console.error('[nav]', e); }
  initCtas(document);
  fillVersion();

  // Sections load near the viewport, and also in order, top to bottom, at idle once the first is up, so a jump
  // (hash, nav link) never leaves unloaded sections above it to init mid-gesture on the way back up.
  const roots = [...document.querySelectorAll('main > section[id]')];
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) if (e.isIntersecting) { io.unobserve(e.target); load(e.target); }
  }, { rootMargin: '100% 0px' });
  roots.forEach((r) => io.observe(r));
  const idle = window.requestIdleCallback || ((f) => setTimeout(f, 200));
  const next = () => { const r = roots.find((x) => !sections.has(x.id)); if (r) { io.unobserve(r); load(r).then(() => idle(next, { timeout: 2000 })); } };
  load(roots[0]).then(() => {
    idle(next, { timeout: 2000 });
    // The download sheet (module + its stylesheet, which it links on eval) at idle, so a tap on a CTA never waits on
    // two round trips. cta.js still loads it on hover/focus/click if this hasn't landed.
    idle(() => import('./lib/signup.js').catch(() => {}), { timeout: 4000 });
  });

  if (ScrollTrigger) {
    // One refresh path: ScrollTrigger's own load refresh covers first init; refresh again only for late fonts
    // or a real change in <main>'s height (the observer's initial callback is skipped).
    if (document.fonts && document.fonts.status !== 'loaded') document.fonts.ready.then(() => ScrollTrigger.refresh());
    let h = -1, t;
    new ResizeObserver(([e]) => {
      const n = Math.round(e.contentRect.height);
      if (h < 0 || n === h) { h = n; return; }
      h = n; clearTimeout(t); t = setTimeout(() => ScrollTrigger.refresh(), 150);
    }).observe(document.querySelector('main'));
  }
}

async function load(root) {
  const id = root.id;
  if (sections.has(id)) return;
  sections.set(id, {});
  try {
    const [mod, Component] = await Promise.all([import(`./${id}.js`), loadComponent()]);
    const ctx = { gsap, ScrollTrigger, SplitText, mm: mm(), MQ, reduced: reduced(), settings, stores, lib, Component };
    const cleanup = await mod.default?.(root, ctx);
    sections.set(id, { cleanup, ctx, h: root.offsetHeight });   // h: height after init (qa.mjs fails if it changes later)
    initCtas(root);
    fillVersion(root);
  } catch (e) {
    sections.set(id, { error: e });
    console.error(`[section:${id}]`, e);   // one broken section never kills the page
  }
}

/** Tear down and re-init one section (dev/QA convenience: __nt.reload('hero')). */
async function reload(id) {
  const s = sections.get(id);
  try { s?.cleanup?.(); s?.ctx?.mm?.revert(); } catch {}
  sections.delete(id);
  await load(document.getElementById(id));
  ScrollTrigger?.refresh();
}

window.__nt = { stores, settings, sections, reload, lib, loadComponent };
boot();
