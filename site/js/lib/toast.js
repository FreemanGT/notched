// toast(text, { anchor, ms=1600 }) — black mono pill that drops from `anchor` (default: the nav notch)
// and leaves upward into it. One at a time, announced via the single role=status region.
import { reduced, EASE } from './motion.js';

let current = null;
export function toast(text, { anchor, ms = 1600 } = {}) {
  const gsap = window.gsap;
  const region = document.querySelector('[data-toasts]');
  if (!region) return;
  current?.kill();
  region.querySelectorAll('.toast').forEach((n) => n.remove());
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = text;
  region.append(el);
  // Unanchored toasts never drop onto the page (they'd sit on a heading): the notch itself speaks, inside the
  // menu bar, at least as wide as the notch and widening out of it when the text needs more room.
  const bar = !anchor;
  const a = (anchor || document.querySelector('[data-nav-notch]'))?.getBoundingClientRect() || { left: innerWidth / 2, width: 0, bottom: 0 };
  if (bar) { el.classList.add('toast--bar'); el.style.minWidth = `${a.width}px`; }
  const w = el.offsetWidth;
  const x = Math.max(8, Math.min(innerWidth - w - 8, a.left + a.width / 2 - w / 2));
  const y = bar ? 0 : Math.max(a.bottom + 10, 8);
  if (bar && gsap && !reduced()) {
    const k = `${Math.max(0, (w - Math.min(a.width, w)) / 2)}px`;   // clipped to the notch's width, then swept open
    el.style.clipPath = 'inset(0 var(--k) 0 var(--k) round 0 0 10px 10px)';
    gsap.set(el, { x, y: 0, '--k': k, opacity: 1 });
    current = gsap.timeline({ onComplete: () => el.remove() })
      .to(el, { '--k': '0px', duration: 0.32, ease: EASE.out })
      .from(el, { color: 'rgba(255,255,255,0)', duration: 0.2, ease: 'none' }, 0.08)
      .to(el, { '--k': k, color: 'rgba(255,255,255,0)', duration: 0.24, ease: EASE.swallow }, `+=${ms / 1000}`)
      .set(el, { opacity: 0 });
    return;
  }
  if (!gsap || reduced()) {
    Object.assign(el.style, { transform: `translate(${x}px, ${y}px)`, opacity: 0, transition: 'opacity 120ms linear' });
    requestAnimationFrame(() => { el.style.opacity = 1; });
    const t = setTimeout(() => { el.style.opacity = 0; setTimeout(() => el.remove(), 140); }, ms);
    current = { kill: () => clearTimeout(t) };
    return;
  }
  gsap.set(el, { x, y: y - 14, scaleY: 0.4, opacity: 0 });
  current = gsap.timeline({ onComplete: () => el.remove() })
    .to(el, { y, scaleY: 1, opacity: 1, duration: 0.42, ease: EASE.knob })
    .to(el, { y: a.bottom - 10, scaleX: 0.6, scaleY: 0.2, opacity: 0, duration: 0.3, ease: EASE.swallow }, `+=${ms / 1000}`);
}
