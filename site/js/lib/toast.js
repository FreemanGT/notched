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
  const a = (anchor || document.querySelector('[data-nav-notch]'))?.getBoundingClientRect() || { left: innerWidth / 2, width: 0, bottom: 0 };
  const w = el.offsetWidth;
  const x = Math.max(8, Math.min(innerWidth - w - 8, a.left + a.width / 2 - w / 2));
  const y = Math.max(a.bottom + 10, 8);
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
