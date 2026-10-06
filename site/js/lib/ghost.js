// ghost(steps, { root, idle=4000 }) — a drawn arrow cursor plays a click script once per page load,
// after `idle` ms without input while `root` is ≥ 60% visible. Any real input cancels it for the session.
// steps: [{ el: Element | () => Element, click?: () => void, wait?: seconds }]
import { reduced, EASE } from './motion.js';

const KEY = 'nt-ghost-off';
const off = () => { try { return sessionStorage.getItem(KEY) === '1'; } catch { return false; } };
let cancelled = off();
const cancel = () => { cancelled = true; try { sessionStorage.setItem(KEY, '1'); } catch {} ; active?.(); };
let active = null;
['pointerdown', 'keydown', 'wheel', 'touchstart'].forEach((t) => addEventListener(t, (e) => { if (e.isTrusted) cancel(); }, { passive: true, capture: true }));

export function ghost(steps, { root, idle = 4000 } = {}) {
  const gsap = window.gsap;
  if (cancelled || reduced() || !gsap || !matchMedia('(hover: hover)').matches || !root) return () => {};
  let timer = 0, tl = null, ratio = 0, done = false;
  const cur = document.createElement('div');
  cur.className = 'ghost';
  cur.setAttribute('aria-hidden', 'true');
  cur.innerHTML = '<svg viewBox="0 0 18 22" width="18" height="22"><path d="M1.5 1.5v16l4.2-4 2.9 6.6 2.8-1.2-2.9-6.5h5.9z"/></svg>';
  const io = new IntersectionObserver(([e]) => { ratio = e.intersectionRatio; arm(); }, { threshold: [0, 0.6, 1] });
  const arm = () => { clearTimeout(timer); if (!done && !cancelled && ratio >= 0.6) timer = setTimeout(play, idle); };
  const resetIdle = () => arm();
  addEventListener('pointermove', resetIdle, { passive: true });
  const play = () => {
    if (cancelled || done || ratio < 0.6) return;
    done = true;
    document.body.append(cur);
    tl = gsap.timeline({ onComplete: stop });
    gsap.set(cur, { x: innerWidth * 0.7, y: innerHeight * 0.8, opacity: 0 });
    tl.to(cur, { opacity: 1, duration: 0.2 });
    for (const s of steps) {
      tl.add(() => {
        const el = typeof s.el === 'function' ? s.el() : s.el; const r = el?.getBoundingClientRect();
        if (r) gsap.to(cur, { x: r.left + r.width / 2, y: r.top + r.height / 2, duration: 0.9, ease: EASE.inOut });
      }).to({}, { duration: 1 })
        .to(cur, { scale: 0.85, duration: 0.08, yoyo: true, repeat: 1 })
        .add(() => s.click?.())
        .to({}, { duration: s.wait ?? 0.6 });
    }
    tl.to(cur, { opacity: 0, duration: 0.3 });
  };
  const stop = () => { clearTimeout(timer); tl?.kill(); cur.remove(); io.disconnect(); removeEventListener('pointermove', resetIdle); };
  active = stop;
  io.observe(root);
  return stop;
}
