// Motion tokens + reduced-motion switch (SPEC §1.6, §2.2). Eases are registered once, on import.
const gsap = window.gsap;
const RM = matchMedia('(prefers-reduced-motion: reduce)');

export const MQ = {
  desk: '(min-width: 900px) and (prefers-reduced-motion: no-preference)',
  mob: '(max-width: 899px) and (prefers-reduced-motion: no-preference)',
  still: '(prefers-reduced-motion: reduce)',
  hover: '(hover: hover) and (pointer: fine)',
};

export const EASE = { out: 'nt-out', inOut: 'nt-inout', sweep: 'nt-sweep', swallow: 'nt-swallow', fillet: 'nt-fillet', knob: 'nt-knob' };
export const CSS_EASE = { out: 'cubic-bezier(.16,1,.3,1)', inOut: 'cubic-bezier(.65,0,.35,1)', sweep: 'cubic-bezier(.76,0,.24,1)', swallow: 'cubic-bezier(.7,0,.84,0)' };
export const DUR = { micro: .16, ui: .26, band: .7, reveal: .8, scene: 1.1 };

const CE = window.CustomEase;
if (gsap && CE) {
  gsap.registerPlugin(CE);
  const bez = (c) => { const [a, b, x, y] = c.match(/[\d.]+/g).map(Number); return `M0,0 C${a},${b} ${x},${y} 1,1`; };
  CE.create(EASE.out, bez(CSS_EASE.out));
  CE.create(EASE.inOut, bez(CSS_EASE.inOut));
  CE.create(EASE.sweep, bez(CSS_EASE.sweep));
  CE.create(EASE.swallow, bez(CSS_EASE.swallow));
  // SPEC's paths had 5 control pairs (invalid cubic); completed to two segments, same shape.
  CE.create(EASE.fillet, 'M0,0 C0.25,0 0.3,1.16 0.55,1.06 0.68,1.01 0.8,0.99 1,1');
  CE.create(EASE.knob, 'M0,0 C0.3,0 0.2,1.12 0.6,1.02 0.75,1 0.88,1 1,1');
  // CSS mirrors as linear() so CSS transitions/WAAPI get the same overshoot.
  if (CSS.supports('transition-timing-function', 'linear(0, 1)')) {
    const lin = (name) => { const f = gsap.parseEase(name); return `linear(${Array.from({ length: 33 }, (_, i) => +f(i / 32).toFixed(4)).join(', ')})`; };
    document.documentElement.style.setProperty('--e-spring', lin(EASE.knob));
    document.documentElement.style.setProperty('--e-fillet', lin(EASE.fillet));
  }
}

/** Live: true while the OS asks for reduced motion. */
export const reduced = () => RM.matches;
const sync = () => document.documentElement.classList.toggle('still', RM.matches);
sync();
RM.addEventListener('change', sync);
export function onReducedChange(fn) { const h = () => fn(RM.matches); RM.addEventListener('change', h); return () => RM.removeEventListener('change', h); }

/** A gsap.matchMedia() pre-wired with MQ: mm().add(MQ, (ctx) => { const { desk, mob, still, hover } = ctx.conditions; … }). */
export const mm = () => gsap.matchMedia();

/** WAAPI-friendly CSS easing string for a token name (falls back to cubic-bezier). */
export const cssEase = (name) => getComputedStyle(document.documentElement).getPropertyValue(`--e-${name}`).trim() || CSS_EASE[name] || CSS_EASE.out;
