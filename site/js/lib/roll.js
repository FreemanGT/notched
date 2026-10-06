// roll(el, value, { duration=.45 }) — digit/word roller. Each char lives in a clipped 1em cell holding two reused
// spans (front/back); a change rolls back in and front out on yPercent only (no filters, no new nodes per change).
// Reduced motion, duration 0 or the first call swap the text. The element keeps sr-friendly text via aria-label.
import { reduced, EASE } from './motion.js';

export function roll(el, value, { duration = 0.45 } = {}) {
  const gsap = window.gsap;
  value = String(value);
  const prev = el.dataset.roll;
  if (prev === value) return;
  el.dataset.roll = value;
  el.setAttribute('aria-label', value);
  const instant = prev === undefined || !duration || reduced() || !gsap;
  let cells = [...el.children].filter((b) => b._r);
  if (!cells.length) { el.textContent = ''; }
  while (cells.length < value.length) { const b = cell(); el.append(b); cells.push(b); }
  cells.slice(value.length).forEach((b) => { gsap?.killTweensOf(b._r); b.remove(); });
  cells = cells.slice(0, value.length);
  const outs = [], ins = [];
  [...value].forEach((c, i) => {
    const b = cells[i], [f, k] = b._r;
    if (f.textContent === c) return;
    if (instant) { gsap?.killTweensOf(b._r); f.textContent = c; if (gsap) gsap.set(f, { yPercent: 0 }), gsap.set(k, { yPercent: 100 }); return; }
    gsap.killTweensOf(b._r);
    k.textContent = c; b._r = [k, f];          // swap roles: the back span becomes the face
    outs.push(f); ins.push(k);
  });
  if (!ins.length) return;
  gsap.set(ins, { yPercent: 100 });
  gsap.to(outs, { yPercent: -100, duration, ease: EASE.out });
  gsap.to(ins, { yPercent: 0, duration, ease: EASE.out, stagger: 0.02 });
}

function cell() {
  const box = document.createElement('span');
  box.setAttribute('aria-hidden', 'true');
  box.style.cssText = 'display:inline-grid;overflow:hidden;height:1em;line-height:1;vertical-align:top';
  // no inline transform: gsap would parse a % translate as px and add it to yPercent. The empty back span needs none.
  const mk = () => { const s = document.createElement('span'); s.style.gridArea = '1/1'; return s; };
  box._r = [mk(), mk()];
  box.append(...box._r);
  return box;
}
