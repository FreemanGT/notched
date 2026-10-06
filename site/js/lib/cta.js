// Primary CTA wiring (SPEC §4.6, §4.7). Delegated on document, so section markup just uses
// <a class="cta" href="/download" data-cta="mac">…<span class="cta__label">Download for Mac</span></a>.
import { bandText } from './bandtext.js';
import { reduced, EASE } from './motion.js';

export const DOWNLOAD = '/download';
export const REPO = 'https://github.com/FreemanGT/notched';
export const SITE = 'https://notched.vercel.app/';
const UA = navigator.userAgent;
export const isTablet = () => /iPad|Tablet/.test(UA) || (/Macintosh/.test(UA) && navigator.maxTouchPoints > 1) || (/Android/.test(UA) && !/Mobile/.test(UA));
export const noMac = () => !!(navigator.userAgentData?.mobile || /iPhone|iPod|iPad|Android/.test(UA) || (/Macintosh/.test(UA) && navigator.maxTouchPoints > 1));

export const storedEmail = () => { try { return localStorage.getItem('nt-email') || ''; } catch { return ''; } };
/** Starts the DMG download. Call synchronously inside a user-gesture handler (Safari). */
export function startDownload() {
  const a = document.createElement('a');
  a.href = DOWNLOAD; a.rel = 'nofollow'; a.style.display = 'none';
  document.body.append(a); a.click(); a.remove();
}

let mod = null;
const load = () => (mod ||= import('./signup.js').catch((e) => { mod = null; throw e; }));

/** Relabels CTAs for phones/tablets and wires hover sweeps on `root` (call again for late-added CTAs). */
export function initCtas(root = document) {
  const away = noMac();
  root.querySelectorAll('[data-cta="mac"]').forEach((el) => {
    if (el.dataset.ctaInit) return;
    el.dataset.ctaInit = '1';
    if (away) {
      const label = el.querySelector('.cta__label');
      if (label) label.textContent = el.classList.contains('cta--nav') ? 'Get it' : 'Get it on your Mac';
      el.querySelector('.cta__arrow use')?.setAttribute('href', '#i-arrow-up');
    }
    if (el.classList.contains('cta') && matchMedia('(hover: hover) and (pointer: fine)').matches) hoverSweep(el);
  });
}

function hoverSweep(el) {
  let bt = null, p = { v: 0 }, tw = null;
  const gsap = window.gsap;
  el.addEventListener('pointerenter', () => {
    if (reduced() || !gsap) return;
    bt ||= bandText(el, { origin: 'left' });
    bt.refresh();
    tw?.kill();
    p.v = 0;
    tw = gsap.to(p, { v: 1, duration: 0.42, ease: EASE.sweep, onUpdate: () => bt.setEdges(0, 1 - p.v) });
  });
  el.addEventListener('pointerleave', () => {
    if (!bt) return;
    tw?.kill();
    const from = 1 - parseFloat(bt.el.style.getPropertyValue('--bt-r') || '100') / 100;   // how much is covered now
    p.v = 0;
    tw = gsap.to(p, { v: 1, duration: 0.36, ease: EASE.sweep, onUpdate: () => bt.setEdges(p.v, 1 - from) });
  });
}

document.addEventListener('pointerover', (e) => { if (e.target.closest?.('[data-cta="mac"]')) load().catch(() => {}); }, { passive: true });
document.addEventListener('focusin', (e) => { if (e.target.closest?.('[data-cta="mac"]')) load().catch(() => {}); });
document.addEventListener('click', (e) => {
  const el = e.target.closest?.('[data-cta="mac"]');
  if (!el || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
  e.preventDefault();
  const returning = !noMac() && storedEmail();
  if (returning) startDownload();                       // synchronous, inside the gesture
  load().then((m) => m.openSignup(el, { viaPointer: e.detail > 0, downloaded: !!returning }))
    .catch(() => { if (!returning) location.href = DOWNLOAD; });
});
