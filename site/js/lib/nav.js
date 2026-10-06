// Global chrome (SPEC §4.1–4.5): the nav = the hero's menu bar, bezel, intro flag, promo pill, menu sheet, eggs.
// Driven by stores.hero ({ band, progress, notchRim }) and stores.time ({ t }). Sections never touch these nodes.
import { bandText } from './bandtext.js';
import { onClock } from './clock.js';
import { toast } from './toast.js';
import { settings } from './settings.js';
import { reduced, EASE } from './motion.js';
import { trapTab } from './trap.js';

export const PHASES = ['dawn', 'day', 'dusk', 'night'];
export const phaseOf = (t) => PHASES[Math.round((((t % 1) + 1) % 1) * 4) % 4];
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));

export function initNav({ stores }) {
  const gsap = window.gsap, html = document.documentElement;
  const nav = document.getElementById('nav');
  const row = nav.querySelector('.nav__row');
  const links = [...nav.querySelectorAll('.nav__menus a[data-fake]')];
  const still = reduced();

  // Real links ship in the HTML (no-JS, reduced). JS shows the fake menus only when it will animate them.
  links.forEach((a) => { a.dataset.real = a.textContent; a.setAttribute('aria-label', a.dataset.real); });
  let linked = true;
  const setText = (fake) => links.forEach((a) => { a.textContent = fake ? a.dataset.fake : a.dataset.real; });
  if (!still) { linked = false; setText(true); }
  nav.classList.toggle('is-linked', linked);

  const bt = bandText(row, { origin: 'center' });
  const ovLinks = () => [...bt.el.querySelectorAll('.nav__menus a')];

  function link(on) {
    if (on === linked) return;
    linked = on;
    nav.classList.toggle('is-linked', on);
    if (reduced() || !gsap?.plugins?.scrambleText) { setText(!on); bt.refresh(); return; }
    const ov = ovLinks();
    links.forEach((a, i) => {
      const text = on ? a.dataset.real : a.dataset.fake;
      for (const el of [a, ov[i]]) if (el) gsap.to(el, { duration: 0.5, delay: i * 0.06, scrambleText: { text, chars: '▮▯·', speed: 0.6 }, overwrite: true });
    });
    if (on) gsap.from(nav.querySelector('.cta--nav'), { x: 12, opacity: 0, duration: 0.4, ease: EASE.out });
    gsap.delayedCall(0.5 + links.length * 0.06, () => bt.refresh());
  }

  // Band → overlay clip, black state, rim, fillets, real links.
  const notch = nav.querySelector('[data-nav-notch]');
  const bezel = document.querySelector('.bezel');
  const promo = document.querySelector('[data-promo]');
  let promoBlocked = false;
  try { promoBlocked = sessionStorage.getItem('nt-promo-x') === '1'; } catch {}
  let downloadInView = false;

  const render = (s) => {
    const band = clamp(s.band);
    bt.set(band);
    const on = band >= 0.999;
    nav.classList.toggle('is-black', on);
    html.classList.toggle('band-on', on);
    notch.style.setProperty('--notch-rim', s.notchRim ?? (band < 0.7 ? 1 : 1 - (band - 0.7) / 0.3));
    if (on) link(true); else if (band < 0.98 && s.progress < 0.42) link(false);
    const out = still ? 1 : clamp((s.progress - 0.75) / 0.25);
    bezel?.style.setProperty('--out', out.toFixed(4));
    promo?.classList.toggle('is-in', !promoBlocked && s.progress >= 0.999 && !downloadInView);
  };
  stores.hero.subscribe(render, { now: true });
  if (still) stores.hero.set({ band: 1, progress: 1 });

  // Promo: hidden while #download is ≥ 30 % in view; × dismisses for the session.
  const dl = document.getElementById('download');
  if (dl && promo) new IntersectionObserver(([e]) => { downloadInView = e.intersectionRatio >= 0.3; render(stores.hero.state); }, { threshold: [0, 0.3] }).observe(dl);
  promo?.querySelector('[data-promo-x]')?.addEventListener('click', () => {
    promoBlocked = true; promo.classList.remove('is-in');
    try { sessionStorage.setItem('nt-promo-x', '1'); } catch {}
  });

  // Clock.
  const clocks = document.querySelectorAll('[data-clock]');
  onClock((text) => { clocks.forEach((c) => { c.textContent = text; }); bt.refresh(); });

  // Time of day: one page-wide value; the nav glyph steps it dawn → day → dusk → night (900 ms lerp).
  stores.time.subscribe((s) => { html.dataset.phase = phaseOf(s.t); });
  nav.querySelector('[data-time-cycle]').addEventListener('click', () => {
    const t = stores.time.state.t, next = (Math.floor(t * 4 + 1e-6) + 1) / 4;
    gsap?.killTweensOf(stores.time.state);
    if (!gsap || reduced()) stores.time.set({ t: next % 1 });
    else gsap.to(stores.time.state, { t: next, duration: 0.9, ease: EASE.inOut, onComplete: () => { stores.time.state.t = next % 1; } });
  });

  // Notched icon → the #try popover's switch. "Notched" brings a hidden icon back.
  nav.querySelector('[data-nav-icon]').addEventListener('click', () => {
    document.getElementById('try')?.scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth' });
    document.querySelector('#try .nt-pop__switch')?.focus({ preventScroll: true });   // keyboard users land on the switch
    document.dispatchEvent(new CustomEvent('nt:highlight', { detail: { name: 'switch' } }));
  });
  nav.querySelector('[data-nav-app]').addEventListener('click', (e) => {
    if (!settings.state.iconHidden) return;
    e.preventDefault();
    settings.set({ iconHidden: false });
    toast('Welcome back.');
  });

  // Notch click: blink + escalating toasts (SPEC §3.4). Hero's own hit target may sit above this.
  const lines = ["There's nothing here. That's the point.", 'Still nothing.', "You're very thorough.", "Okay, it's a camera."];
  let n = 0;
  notch.addEventListener('click', () => { blinkAll(); toast(lines[n++ % lines.length]); });

  // Egg: type "notch" anywhere (not in inputs) → every notch blinks, "Hi."
  let buf = '';
  addEventListener('keydown', (e) => {
    if (e.target.closest?.('input,textarea,select,[contenteditable]') || e.key.length !== 1) return;
    buf = (buf + e.key.toLowerCase()).slice(-5);
    if (buf === 'notch') { blinkAll(); toast('Hi.'); buf = ''; }
  });

  // Mobile menu sheet.
  const ms = document.getElementById('msheet');
  trapTab(ms);
  nav.querySelector('[data-menu-open]').addEventListener('click', () => ms.showModal());
  ms.addEventListener('click', (e) => {
    if (e.target.closest('[data-menu-close]')) return ms.close();
    const a = e.target.closest('a[href^="#"]');
    if (a) { e.preventDefault(); ms.close(); document.querySelector(a.getAttribute('href'))?.scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth' }); }
    else if (e.target.closest('[data-cta]')) ms.close();
  });

  // Intro: menu items settle (450–850 ms); html.intro clears at 1.1 s or on first input.
  if (html.classList.contains('intro')) {
    const quick = html.classList.contains('intro--quick');
    if (gsap && !quick) gsap.from(nav.querySelectorAll('.nav__l > *, .nav__menus a, .nav__r > *'), { y: -6, opacity: 0, duration: 0.4, stagger: 0.035, delay: 0.45, ease: EASE.out, clearProps: 'all' });
    const end = () => html.classList.remove('intro', 'intro--full', 'intro--quick');
    setTimeout(end, quick ? 400 : 1100);
    ['pointerdown', 'keydown', 'wheel', 'touchstart'].forEach((t) => addEventListener(t, end, { once: true, passive: true }));
  }

  return { link, bandText: bt };
}

/** Blink every camera lens on the page (nav + product screens listen to nt:blink). */
export function blinkAll() {
  document.dispatchEvent(new CustomEvent('nt:blink'));
  if (reduced() || !window.gsap) return;
  window.gsap.fromTo('.nav__notch .lens', { scaleY: 1 }, { scaleY: 0.1, duration: 0.09, yoyo: true, repeat: 1, ease: 'none', transformOrigin: '50% 50%' });
}
