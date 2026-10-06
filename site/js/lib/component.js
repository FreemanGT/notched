// Notched product component (SPEC §3): wallpaper, living screen, the real menu-bar window.
// No GSAP dependency: setters tween with rAF; GSAP can also tween `store.state` directly.
// lib/wallpaper.js, lib/screen.js, lib/popover.js may simply re-export from here.

/* ---------------- tiny utils ---------------- */
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = t => t * t * (3 - 2 * t);
const mq = q => typeof matchMedia === 'function' && matchMedia(q).matches;
const isReduced = () => mq('(prefers-reduced-motion: reduce)');
const h = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
const hex = c => { const n = parseInt(c.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; };
const mix = (a, b, t) => a.map((v, i) => Math.round(lerp(v, b[i], t)));
const rgb = c => `rgb(${c.join(',')})`;

// cubic-bezier solver (supports y overshoot, used for `fillet`/`knob`)
function bezier(x1, y1, x2, y2) {
  const A = (a, b) => 1 - 3 * b + 3 * a, B = (a, b) => 3 * b - 6 * a, C = a => 3 * a;
  const f = (t, a, b) => ((A(a, b) * t + B(a, b)) * t + C(a)) * t;
  const d = (t, a, b) => 3 * A(a, b) * t * t + 2 * B(a, b) * t + C(a);
  return x => { if (x <= 0) return 0; if (x >= 1) return 1; let t = x; for (let i = 0; i < 8; i++) { const s = d(t, x1, x2); if (Math.abs(s) < 1e-6) break; t -= (f(t, x1, x2) - x) / s; } return f(clamp(t), y1, y2); };
}
export const EASE = {
  out: bezier(.16, 1, .3, 1), inOut: bezier(.65, 0, .35, 1), sweep: bezier(.76, 0, .24, 1),
  swallow: bezier(.7, 0, .84, 0), fillet: bezier(.3, 1.45, .45, 1), knob: bezier(.3, 1.3, .5, 1),
};
export const CSS_EASE = { out: 'cubic-bezier(.16,1,.3,1)', sweep: 'cubic-bezier(.76,0,.24,1)', swallow: 'cubic-bezier(.7,0,.84,0)', knob: 'cubic-bezier(.3,1.3,.5,1)', fillet: 'cubic-bezier(.3,1.45,.45,1)' };

// one tween per (target,key); returns a Promise
const live = new WeakMap();
function tween(target, key, to, ms, ease, write) {
  const map = live.get(target) || new Map(); live.set(target, map);
  cancelAnimationFrame(map.get(key)?.raf);
  const from = target.get()[key];
  if (!ms || isReduced() || from === to) { write(to); map.delete(key); return Promise.resolve(); }
  return new Promise(res => {
    const t0 = performance.now(), job = {};
    const step = now => { const k = clamp((now - t0) / ms); write(lerp(from, to, ease(k))); if (k < 1) job.raf = requestAnimationFrame(step); else { map.delete(key); res(); } };
    job.raf = requestAnimationFrame(step); map.set(key, job);
  });
}

/* ---------------- store (fallback; lib/store.js has the same shape) ---------------- */
export function createStore(initial) {
  let s = { ...initial }; const subs = new Set(); const state = {};
  const api = {
    state, get: () => s,
    set(patch) { const prev = s; s = { ...s, ...patch }; const ch = Object.keys(patch).filter(k => prev[k] !== s[k]); if (ch.length) subs.forEach(fn => fn(s, ch)); },
    subscribe(fn) { subs.add(fn); return () => subs.delete(fn); },
  };
  for (const k of Object.keys(initial)) Object.defineProperty(state, k, { enumerable: true, get: () => s[k], set: v => api.set({ [k]: v }) });
  return api;
}

function emitter() { const m = {}; return { on(n, fn) { (m[n] ||= new Set()).add(fn); return () => m[n].delete(fn); }, emit(n, ...a) { m[n]?.forEach(fn => fn(...a)); } }; }

let srEl;
function announce(text) {
  if (!srEl) { srEl = h('div', 'nt-sr'); srEl.setAttribute('role', 'status'); srEl.setAttribute('aria-live', 'polite'); document.body.append(srEl); }
  srEl.textContent = ''; setTimeout(() => { srEl.textContent = text; }, 30);
}

/* ---------------- wallpaper (SPEC §1.4, §3.2) ---------------- */
export const PALETTE = {
  dawn:  { top: '#1D2858', mid: '#8B6CB2', hz: '#F6A88A', sun: '#FFD7A1', pos: [22, 78], stars: .2,  lum: .55 },
  day:   { top: '#3B71FE', mid: '#76A9FF', hz: '#6BE3D0', sun: '#FFFFFF', pos: [70, 20], stars: 0,   lum: .62 },
  dusk:  { top: '#24204C', mid: '#C05479', hz: '#FF9C5B', sun: '#FFB36B', pos: [80, 82], stars: .12, lum: .38 },
  night: { top: '#04050E', mid: '#0D1536', hz: '#1E2C5A', sun: '#E9EDFF', pos: [24, 18], stars: 1,   lum: .08 },
};
const PHASES = ['dawn', 'day', 'dusk', 'night'];
// hills art is ours (AppIcon.icon/Assets/hills.svg), drawn in a 1024 box stretched to the screen
export const PRESETS = {
  hills: [
    ['M0 620C220 560 420 590 620 640S900 700 1024 610V1024H0Z', .12, 'back', 'scale(-1 1) translate(-1024 0)'],
    ['M0 700C200 610 380 640 560 700S880 790 1024 690V1024H0Z', .28, 'mid'],
    ['M0 840C240 760 470 800 660 850S920 900 1024 830V1024H0Z', .22, 'front'],
  ],
  dunes: [
    ['M0 690C180 660 360 700 540 680S860 640 1024 670V1024H0Z', .12, 'back'],
    ['M0 760C260 720 470 790 700 760S940 730 1024 750V1024H0Z', .24, 'mid'],
    ['M0 870C200 840 430 880 640 860S900 830 1024 860V1024H0Z', .22, 'front'],
  ],
  tide: [
    ['M0 812H1024V1024H0Z', .1, 'back'],
    ['M120 812C260 700 400 690 560 760S760 812 820 812Z', .28, 'mid'],
    ['M120 812C260 924 400 934 560 864S760 812 820 812Z', .084, 'front'],
  ],
  ridge: [
    ['M0 700L120 610 230 680 360 560 480 660 600 590 720 670 860 570 1024 660V1024H0Z', .12, 'back'],
    ['M0 780L150 690 280 760 420 650 560 750 700 690 840 770 1024 680V1024H0Z', .26, 'mid'],
    ['M0 880L180 820 340 870 520 800 700 880 880 830 1024 870V1024H0Z', .2, 'front'],
  ],
};
const PRESET_IDS = Object.keys(PRESETS);

export function phaseFromClock(date = new Date()) {
  const q = typeof location !== 'undefined' && new URLSearchParams(location.search).get('t');
  if (q != null && q !== '' && !isNaN(+q)) return ((+q % 1) + 1) % 1;
  const hr = date.getHours() + date.getMinutes() / 60;
  // dawn 05–08 → 0...25, day 08–17 → .25..5, dusk 17–20 → .5..75, night 20–05 → .75..1
  if (hr >= 5 && hr < 8) return (hr - 5) / 3 * .25;
  if (hr >= 8 && hr < 17) return .25 + (hr - 8) / 9 * .25;
  if (hr >= 17 && hr < 20) return .5 + (hr - 17) / 3 * .25;
  return .75 + ((hr - 20 + 24) % 24) / 9 * .25;
}
// weights of each phase at t (smooth cross-fade between neighbours)
function phaseMix(t) {
  t = ((t % 1) + 1) % 1; const f = t * 4, i0 = Math.floor(f) % 4, i1 = (i0 + 1) % 4, w = smooth(f - Math.floor(f));
  return { i0, i1, w, get: k => lerp(PALETTE[PHASES[i0]][k], PALETTE[PHASES[i1]][k], w) };
}
export function phaseName(t) { const m = phaseMix(t); return PHASES[m.w < .5 ? m.i0 : m.i1]; }

let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
const STARS = (() => { seed = 7; let s = ''; for (let i = 0; i < 40; i++) s += `<circle cx="${(rnd() * 1000).toFixed(1)}" cy="${(rnd() * 520).toFixed(1)}" r="${(rnd() * 1.3 + .5).toFixed(2)}"/>`; return s; })();

function hillsSVG(id) {
  const paths = PRESETS[id] || PRESETS.hills;
  return `<svg class="nt-wp__hills" viewBox="0 0 1024 1024" preserveAspectRatio="none" aria-hidden="true">${paths.map(([d, o, layer, tf]) =>
    `<g class="nt-wp__${layer}"><path d="${d}" fill="var(--hill)" fill-opacity="${o}"${tf ? ` transform="${tf}"` : ''}/></g>`).join('')}</svg>`;
}

export function paintWallpaper(el, { preset = 'hills', time = 'local' } = {}) {
  el.classList.add('nt-wp');
  el.innerHTML = PHASES.map(p => { const c = PALETTE[p]; return `<div class="nt-wp__phase" data-p="${p}" style="background:linear-gradient(180deg,${c.top} 0%,${c.mid} 52%,${c.hz} 100%)"></div>`; }).join('')
    + `<svg class="nt-wp__stars" viewBox="0 0 1000 1000" preserveAspectRatio="xMidYMin slice" aria-hidden="true">${STARS}</svg>`
    + `<div class="nt-wp__sun"></div><div class="nt-wp__land">${hillsSVG(preset)}</div>`;
  const layers = [...el.querySelectorAll('.nt-wp__phase')], sun = el.querySelector('.nt-wp__sun'), stars = el.querySelector('.nt-wp__stars');
  let land = el.querySelector('.nt-wp__land'), cur = preset, t = 0;
  const setTime = v => {
    t = v === 'local' ? phaseFromClock() : v; const m = phaseMix(t);
    layers.forEach((l, i) => { l.style.opacity = i === m.i0 ? 1 : i === m.i1 ? m.w : 0; l.style.zIndex = i === m.i1 ? 1 : 0; });
    const a = PALETTE[PHASES[m.i0]], b = PALETTE[PHASES[m.i1]];
    sun.style.transform = `translate(${lerp(a.pos[0], b.pos[0], m.w)}cqw, ${lerp(a.pos[1], b.pos[1], m.w)}cqh)`;
    sun.style.color = rgb(mix(hex(a.sun), hex(b.sun), m.w));
    sun.style.opacity = m.get('stars') > .9 ? .85 : 1;
    stars.style.opacity = m.get('stars');
    const night = clamp(1 - m.get('lum') / .55); // hills tint toward the horizon at dusk/night
    el.style.setProperty('--hill', rgb(mix([255, 255, 255], mix(hex(a.hz), hex(b.hz), m.w), night * .7)));
    return t;
  };
  const setPreset = (id, { transition = 'cut' } = {}) => {
    if (!PRESETS[id] || id === cur) return Promise.resolve(); cur = id;
    const next = h('div', 'nt-wp__land', hillsSVG(id));
    if (transition !== 'slide' || isReduced()) { land.replaceWith(next); land = next; return Promise.resolve(); }
    // the new picture wipes in from the right; the old one stays underneath until covered
    const sky = el.querySelector('.nt-wp__phase[style*="z-index: 1"]') || layers[0];
    const wrap = h('div', 'nt-wp__slide'); wrap.append(...layers.map(l => l.cloneNode(true)), next); el.append(wrap);
    wrap.querySelectorAll('.nt-wp__phase').forEach((c, i) => { c.style.opacity = layers[i].style.opacity; c.style.zIndex = layers[i].style.zIndex; });
    void sky;
    const anim = wrap.animate([{ clipPath: 'inset(0 0 0 100%)' }, { clipPath: 'inset(0 0 0 0%)' }], { duration: 700, easing: CSS_EASE.sweep });
    return anim.finished.then(() => { land.replaceWith(next); land = next; wrap.remove(); }).catch(() => {});
  };
  const setParallax = (x, y) => {
    el.style.setProperty('--px', clamp(x, -1, 1)); el.style.setProperty('--py', clamp(y, -1, 1));
  };
  setTime(time);
  return { setTime, setPreset, setParallax, get preset() { return cur; }, get time() { return t; }, destroy() { el.innerHTML = ''; } };
}

/* ---------------- screen (SPEC §3.3, §3.4) ---------------- */
export const SCREEN_DEFAULT = { band: 0, radius: 14, corners: true, time: 'local', preset: 'hills', displays: 1, builtInOnly: false,
  menuText: 'auto', notchRim: null, status: 'idle', iconHidden: false, fil: 0, ext: 1 };

const ICON = `<svg class="nt-ico" viewBox="0 0 18 13" aria-hidden="true"><rect x=".75" y=".75" width="16.5" height="11.5" rx="2.6" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M1.5 1.5h15v2.6h-15z" fill="currentColor"/></svg>`;
const BATT = `<svg class="nt-batt" viewBox="0 0 26 12" aria-hidden="true"><rect x=".6" y=".6" width="22" height="10.8" rx="3" fill="none" stroke="currentColor" stroke-opacity=".5" stroke-width="1.1"/><rect x="2.3" y="2.3" width="15" height="7.4" rx="1.6" fill="currentColor"/><path d="M24.2 4.2v3.6c.8-.3 1.3-1 1.3-1.8s-.5-1.5-1.3-1.8z" fill="currentColor" fill-opacity=".5"/></svg>`;
const SUNG = `<svg class="nt-tg" viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="3.2" fill="currentColor"/><g stroke="currentColor" stroke-width="1.4" stroke-linecap="round"><path d="M8 1v1.6M8 13.4V15M1 8h1.6M13.4 8H15M3 3l1.1 1.1M11.9 11.9 13 13M3 13l1.1-1.1M11.9 4.1 13 3"/></g></svg>`;
const MOONG = `<svg class="nt-tg" viewBox="0 0 16 16" aria-hidden="true"><path d="M10.8 2.2A6 6 0 1 0 13.8 11 5 5 0 0 1 10.8 2.2z" fill="currentColor"/></svg>`;

function menuItems() {
  return `<span class="nt-mb__l"><b>Notched</b><span>File</span><span>Edit</span><span>View</span><span>Window</span><span>Help</span></span>`
    + `<span class="nt-mb__r"><span class="nt-mb__tg">${SUNG}</span>${BATT}<span class="nt-mb__icon">${ICON}<i class="nt-ring"></i></span><span class="nt-mb__clock"></span></span>`;
}
function buildGlass(isExt) {
  const g = h('div', 'nt-glass');
  const wp = h('div'); g.append(wp);
  g.insertAdjacentHTML('beforeend',
    `<div class="nt-mb">${menuItems()}</div>`
    + `<div class="nt-band"><div class="nt-mb nt-mb--on">${menuItems()}</div></div><div class="nt-slot"><i class="nt-shimmer"></i></div>`
    + `<i class="nt-fil nt-fil--l"></i><i class="nt-fil nt-fil--r"></i>`
    + (isExt ? '' : `<div class="nt-notch"><i class="nt-notch__rim"></i><i class="nt-notch__lens"></i></div>`));
  return { g, wp };
}

const fmtClock = d => new Intl.DateTimeFormat(undefined, { weekday: 'short', hour: '2-digit', minute: '2-digit' }).format(d).replace(',', '');
const RAD_NAME = { 10: 'small', 14: 'medium', 20: 'large' };
const NOTCH_TOASTS = ["There's nothing here. That's the point.", 'Still nothing.', "You're very thorough.", "Okay, it's a camera."];

export function createScreen(el, opts = {}) {
  const { mode = 'display', notch = true, follow = false, settings = null, interactive = false, parallax = false, clock = mode === 'viewport' || mode === 'display', label = 'Screen preview' } = opts;
  const store = opts.store || createStore({ ...SCREEN_DEFAULT });
  if (!('fil' in store.get())) store.set({ fil: 0, ext: 1 });
  const ev = emitter(), offs = [];
  el.classList.add('nt-screen', `nt-screen--${mode}`);
  if (!notch) el.classList.add('nt-screen--nonotch');
  el.setAttribute('role', 'img');
  const row = h('div', 'nt-row'); el.append(row);
  const main = buildGlass(false); main.g.classList.add('nt-glass--main'); row.append(main.g);
  const wp = paintWallpaper(main.wp, { preset: store.get().preset, time: store.get().time });
  const exts = [];
  const nodes = sel => el.querySelectorAll(sel);

  // --pt from the instance width (viewport mode uses the token from tokens.css)
  let ro;
  if (mode !== 'viewport') {
    ro = new ResizeObserver(([e]) => { const w = e.contentRect.width; if (w) el.style.setProperty('--pt', `${(w / 1512).toFixed(4)}px`); });
    ro.observe(main.g);
  }

  function ensureExts(n) {
    while (exts.length < n - 1) {
      const x = buildGlass(true); x.g.classList.add('nt-glass--ext');
      const w2 = paintWallpaper(x.wp, { preset: wp.preset, time: wp.time });
      exts.push({ ...x, w: w2 });
      exts.length === 1 ? row.prepend(x.g) : row.append(x.g);
    }
  }

  let lastMenu = '';
  function render(s, changed) {
    const st = el.style, all = !changed;
    const has = k => all || (changed.has ? changed.has(k) : changed.includes(k));
    if (has('band')) { st.setProperty('--band', s.band.toFixed(4)); }
    if (has('band') || has('notchRim')) st.setProperty('--notch-rim', (s.notchRim ?? clamp((1 - s.band) / .3)).toFixed(3));
    if (has('radius')) st.setProperty('--r', s.radius);
    if (has('fil')) st.setProperty('--fil', s.fil.toFixed(4));
    if (has('ext')) st.setProperty('--eb', s.ext.toFixed(4));
    if (has('time')) { const t = wp.setTime(s.time); exts.forEach(x => x.w.setTime(t)); }
    if (has('preset') && !all) {} // handled by setWallpaper (transition aware)
    if (has('iconHidden')) el.classList.toggle('nt-icon-hidden', !!s.iconHidden);
    if (has('corners')) el.classList.toggle('nt-nocorners', !s.corners);
    if (has('displays')) { ensureExts(s.displays); exts.forEach((x, i) => x.g.classList.toggle('is-on', i < s.displays - 1)); el.classList.toggle('nt-multi', s.displays > 1); }
    // menu text colour
    const lum = phaseMix(wp.time).get('lum');
    const mt = s.menuText === 'auto' ? (lum > .45 ? 'dark' : 'white') : s.menuText;
    if (mt !== lastMenu) { el.dataset.menu = mt; lastMenu = mt; }
    const tg = el.querySelectorAll('.nt-mb__tg'), night = phaseName(wp.time) === 'night';
    if (el._night !== night) { el._night = night; tg.forEach(n => (n.innerHTML = night ? MOONG : SUNG)); }
    // fillets follow the band unless someone drives `fil` explicitly
    if (has('band') && !filManual) {
      const want = s.band >= .98 ? 1 : 0;
      if (want !== filTarget) { filTarget = want; tween(store, 'fil', want, want ? 520 : 160, want ? EASE.fillet : EASE.swallow, v => store.set({ fil: v })); }
    }
    el.setAttribute('aria-label', `${label}: menu bar ${s.band > .5 ? 'black' : 'see-through'}, notch ${s.band > .5 ? 'hidden' : 'visible'}, ${s.corners ? (RAD_NAME[Math.round(s.radius)] || Math.round(s.radius) + ' pt') + ' corners' : 'square corners'}, ${phaseName(wp.time)}${s.displays > 1 ? `, ${s.displays} displays` : ''}`);
    ev.emit('change', s, changed);
  }
  let filTarget = -1, filManual = false;
  offs.push(store.subscribe(render));

  // follow site settings (lib/settings.js store)
  if (follow && settings) {
    const sync = v => store.set({ corners: v.corners, iconHidden: v.iconHidden, builtInOnly: v.builtInOnly });
    sync(settings.get());
    if (store.get().radius !== settings.get().radius) store.set({ radius: settings.get().radius });
    offs.push(settings.subscribe((v, ch) => { sync(v); if (!ch || (ch.has?.('radius') ?? ch.includes('radius'))) api.setRadius(v.radius); if (!ch || (ch.has?.('builtInOnly') ?? ch.includes('builtInOnly'))) api.setBuiltInOnly(v.builtInOnly); }));
  }

  // clock
  let clockT;
  const tick = () => { const txt = fmtClock(new Date()); nodes('.nt-mb__clock').forEach(n => (n.textContent = txt)); clockT = setTimeout(tick, 60000 - Date.now() % 60000 + 50); };
  if (clock) tick();
  // local time: refresh each minute
  let localT;
  if (store.get().time === 'local') localT = setInterval(() => { if (store.get().time === 'local') render(store.get(), ['time']); }, 60000);

  // parallax (hover devices only)
  let onMove;
  if (parallax && mq('(hover: hover) and (pointer: fine)') && !isReduced()) {
    // Only while on screen, from a rect cached until the next scroll/resize: one layout read per scroll, not per move.
    let r = null, seen = false;
    const pio = new IntersectionObserver(([e]) => { seen = e.isIntersecting; r = null; }); pio.observe(el);
    const drop = () => { r = null; }; addEventListener('resize', drop); addEventListener('scroll', drop, { passive: true });
    offs.push(() => { pio.disconnect(); removeEventListener('resize', drop); removeEventListener('scroll', drop); });
    onMove = e => { if (!seen) return; r ||= el.getBoundingClientRect(); wp.setParallax(((e.clientX - r.left) / r.width) * 2 - 1, ((e.clientY - r.top) / r.height) * 2 - 1); };
    addEventListener('pointermove', onMove, { passive: true });
  }

  // interactive notch (drag + click)
  let toastI = 0;
  if (interactive && notch) {
    const hit = h('div', 'nt-notch-hit'); hit.setAttribute('aria-hidden', 'true'); main.g.append(hit);
    const n = main.g.querySelector('.nt-notch'), lens = n.querySelector('.nt-notch__lens');
    let y0 = null, moved = false, b0 = 0;
    hit.addEventListener('pointerdown', e => { y0 = e.clientY; moved = false; b0 = store.get().band; hit.setPointerCapture(e.pointerId); n.classList.add('is-held'); });
    hit.addEventListener('pointermove', e => {
      if (y0 == null) return; const dy = e.clientY - y0; if (Math.abs(dy) > 4) moved = true; if (!moved) return;
      const mb = main.g.querySelector('.nt-mb').offsetHeight || 37;
      let p = b0 + dy / (3 * mb); if (p > 1) p = 1 + Math.sqrt(p - 1) * .08; p = Math.max(0, p);
      n.style.transform = `scale(${lerp(1, .92, clamp(p))}, ${lerp(1, 1.3, clamp(p))})`;
      tween(store, 'band', Math.min(1, p), 0, null, v => store.set({ band: v }));
      ev.emit('notchdrag', { p, phase: 'move' });
    });
    const up = () => {
      if (y0 == null) return; y0 = null; n.classList.remove('is-held'); n.style.transform = '';
      if (!moved) {
        lens.animate([{ transform: 'translate(-50%,-50%) scaleY(1)' }, { transform: 'translate(-50%,-50%) scaleY(.1)' }, { transform: 'translate(-50%,-50%) scaleY(1)' }], { duration: 180 });
        api.flash(NOTCH_TOASTS[toastI++ % NOTCH_TOASTS.length]); ev.emit('notchclick'); return;
      }
      const on = store.get().band > .4;
      api.setBand(on ? 1 : 0, { duration: on ? 520 : 600, ease: on ? 'fillet' : 'swallow' }).then(() => { if (on) api.flash('Notch hidden.'); });
      ev.emit('notchdrag', { p: on ? 1 : 0, phase: 'end' });
    };
    hit.addEventListener('pointerup', up); hit.addEventListener('pointercancel', up);
  }

  let flashEl;
  const api = {
    el, store, wallpaper: wp, _follows: !!(follow && settings),
    on: ev.on,
    setBand(p, { duration = 700, ease = 'sweep' } = {}) { return tween(store, 'band', clamp(p), duration, EASE[ease] || EASE.sweep, v => store.set({ band: v })); },
    setRadius(pt, { duration = 520 } = {}) { return tween(store, 'radius', pt, duration, EASE.fillet, v => store.set({ radius: v })); },
    setFillets(v, { duration = 0 } = {}) { filManual = v != null; if (v == null) return Promise.resolve(); return tween(store, 'fil', clamp(v), duration, EASE.fillet, x => store.set({ fil: x })); },
    setTime(t, { duration = 900 } = {}) {
      if (t === 'local' || !duration) { store.set({ time: t }); return Promise.resolve(); }
      // shortest way round the day
      let from = wp.time; if (Math.abs(t - from) > .5) from += t > from ? 1 : -1;
      store.set({ time: from });
      return tween(store, 'time', t, duration, EASE.inOut, v => store.set({ time: ((v % 1) + 1) % 1 }));
    },
    setWallpaper(id, { transition = 'slide' } = {}) {
      if (id === 'next') id = PRESET_IDS[(PRESET_IDS.indexOf(wp.preset) + 1) % PRESET_IDS.length];
      store.set({ preset: id });
      return Promise.all([wp.setPreset(id, { transition }), ...exts.map(x => x.w.setPreset(id, { transition }))]);
    },
    setDisplays(n, { duration = 900 } = {}) {
      n = clamp(Math.round(n), 1, 3); ensureExts(n); store.set({ displays: n });
      if (!duration || isReduced()) return Promise.resolve();
      return Promise.all(exts.slice(0, n - 1).map((x, i) => x.g.animate([{ opacity: 0, transform: `translateX(${i === 0 ? -40 : 40}%)` }, { opacity: 1, transform: 'none' }], { duration, easing: CSS_EASE.out, delay: i * 120, fill: 'backwards' }).finished));
    },
    setBuiltInOnly(b) { store.set({ builtInOnly: !!b }); return tween(store, 'ext', b ? 0 : 1, b ? 600 : 700, b ? EASE.swallow : EASE.sweep, v => store.set({ ext: v })); },
    setMenuText(v) { store.set({ menuText: v }); },
    setNotchRim(v) { store.set({ notchRim: v }); },
    setStatusIcon(v) { store.set({ iconHidden: v === 'hidden' }); },
    pulse() { if (isReduced()) return; nodes('.nt-glass--main .nt-ring').forEach(r => r.animate([{ transform: 'scale(1)', opacity: .7 }, { transform: 'scale(3.2)', opacity: 0 }], { duration: 900, easing: CSS_EASE.out })); },
    process(ms = 700) {
      store.set({ status: 'processing' });
      const shims = [...nodes('.nt-shimmer')];
      const done = () => store.set({ status: 'idle' });
      if (isReduced()) return new Promise(r => setTimeout(r, Math.min(ms, 300))).then(done);
      return Promise.all(shims.map(s => s.animate([{ transform: 'translateX(-100%) skewX(-30deg)', opacity: 1 }, { transform: 'translateX(200%) skewX(-30deg)', opacity: 1 }], { duration: ms, easing: 'linear' }).finished)).then(done, done);
    },
    flash(text, ms = 1600) {
      flashEl?.remove(); flashEl = h('div', 'nt-flash'); flashEl.textContent = text; flashEl.setAttribute('aria-hidden', 'true');
      main.g.append(flashEl); announce(text);
      const f = flashEl, red = isReduced();
      f.animate(red ? [{ opacity: 0 }, { opacity: 1 }] : [{ opacity: 0, transform: 'translate(-50%,-60%) scale(.6)' }, { opacity: 1, transform: 'translate(-50%,0) scale(1)' }], { duration: red ? 120 : 360, easing: CSS_EASE.knob, fill: 'both' });
      setTimeout(() => f.animate(red ? [{ opacity: 1 }, { opacity: 0 }] : [{ opacity: 1, transform: 'translate(-50%,0) scale(1)' }, { opacity: 0, transform: 'translate(-50%,-80%) scale(.5)' }], { duration: red ? 120 : 260, easing: CSS_EASE.swallow, fill: 'both' }).finished.then(() => f.remove(), () => f.remove()), ms);
    },
    destroy() { offs.forEach(f => f()); ro?.disconnect(); clearTimeout(clockT); clearInterval(localT); if (onMove) removeEventListener('pointermove', onMove); el.innerHTML = ''; },
  };
  render(store.get());
  if (store.get().band >= .98) { filTarget = 1; store.set({ fil: 1 }); }
  return api;
}

/* ---------------- popover (SPEC §3.5): the real menu-bar window ---------------- */
export const SETTINGS_DEFAULT = { on: false, corners: true, radius: 14, dynamic: true, builtInOnly: false, rotate: false, every: 3600,
  folder: '', loginItem: false, iconHidden: false, appearance: null };
const STATUS = {
  off: 'Turn on to blacken the menu bar so the notch blends in.',
  proc: 'Processing wallpaper…', procDyn: 'Processing dynamic wallpaper… this takes a few seconds.',
  on: 'Notch hidden. New wallpapers are handled automatically.', rest: 'Notch hidden.',
  restored: 'Wallpaper restored. Other Spaces get theirs back when you visit them.',
};
const TICK = `<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M2.6 6.3 5 8.7l4.6-5.6" fill="none" stroke="#fff" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const softwareVersion = () => { try { for (const s of document.querySelectorAll('script[type="application/ld+json"]')) { const m = s.textContent.match(/"softwareVersion"\s*:\s*"([^"]+)"/); if (m) return m[1]; } } catch {} return '1.0.2'; };

let popN = 0;
export function createPopover(el, { store, mirror = null, toast = null, appearance = null, version = softwareVersion() } = {}) {
  store = store || createStore({ ...SETTINGS_DEFAULT });
  const ev = emitter(), id = `ntp${++popN}`, offs = [];
  const cb = (name, label, note) => `<div class="nt-pop__opt" data-ctl="${name}"><label class="nt-pop__chk"><input type="checkbox" name="${name}"${note ? ` aria-describedby="${id}-${name}-n"` : ''}><span class="nt-pop__box">${TICK}</span><span>${label}</span></label>${note ? `<p class="nt-pop__note" id="${id}-${name}-n">${note}</p>` : ''}</div>`;
  el.classList.add('nt-pop');
  el.setAttribute('role', 'group'); el.setAttribute('aria-label', 'Notched menu bar window (demo)');
  el.innerHTML = `
    <div class="nt-pop__head"><span class="nt-pop__title" id="${id}-t">Notched</span>
      <button type="button" class="nt-pop__switch" role="switch" aria-checked="false" aria-label="Hide the notch" data-ctl="switch"><i></i></button></div>
    <div class="nt-pop__preview"></div>
    <p class="nt-pop__status" aria-live="polite"><i class="nt-pop__spin" aria-hidden="true"></i><span></span></p>
    <hr>
    ${cb('dynamic', 'Use dynamic wallpapers', 'Keeps time- and appearance-based wallpapers changing. Takes longer to process.')}
    <div class="nt-pop__rc">${cb('corners', 'Round corners')}
      <div class="nt-pop__seg" role="radiogroup" aria-label="Radius" data-ctl="radius"><i class="nt-pop__pill"></i>
        <button type="button" role="radio" data-r="10">Small</button><button type="button" role="radio" data-r="14">Medium</button><button type="button" role="radio" data-r="20">Large</button></div></div>
    ${cb('builtInOnly', 'Built-in display only')}
    ${cb('rotate', 'Rotate wallpapers', "macOS can't shuffle under the black bar, so Notched rotates your pictures itself.")}
    <div class="nt-pop__rot"><div><div class="nt-pop__rotrow">
      <button type="button" class="nt-pop__btn" data-ctl="folder">Choose Folder…</button>
      <select class="nt-pop__sel" aria-label="Every" data-ctl="every"><option value="300">5 min</option><option value="900">15 min</option><option value="1800">30 min</option><option value="3600">Hourly</option><option value="86400">Daily</option></select>
      <button type="button" class="nt-pop__btn" data-ctl="next">Next</button></div></div></div>
    <hr>
    ${cb('loginItem', 'Start at login')}
    ${cb('iconHidden', 'Hide menu bar icon', 'Open Notched again to bring it back.')}
    <hr>
    <div class="nt-pop__foot"><button type="button" class="nt-pop__btn" data-ctl="updates">Check for Updates…</button><span class="nt-pop__ver">v${version}</span><button type="button" class="nt-pop__btn" data-ctl="quit">Quit</button></div>`;
  const $ = s => el.querySelector(s);
  const sw = $('.nt-pop__switch'), statusEl = $('.nt-pop__status span'), seg = $('.nt-pop__seg'), radios = [...seg.querySelectorAll('[role=radio]')];
  const preview = createScreen($('.nt-pop__preview'), { mode: 'preview', follow: true, settings: store, clock: false, label: 'Preview' });
  const screens = () => [preview, mirror].filter(Boolean);
  const say = toast || (t => (mirror || preview).flash(t));

  // appearance
  const setAppearance = a => { a = a || (mq('(prefers-color-scheme: light)') ? 'light' : 'dark'); el.dataset.appearance = a; };
  setAppearance(appearance || store.get().appearance);

  // status line
  let statusKey = 'off', settleT;
  const setStatus = k => { statusKey = k; statusEl.textContent = STATUS[k]; el.classList.toggle('is-processing', k === 'proc' || k === 'procDyn'); };
  setStatus(store.get().on ? 'rest' : 'off');

  // reflect state into controls
  function sync(s) {
    sw.setAttribute('aria-checked', String(!!s.on));
    for (const k of ['dynamic', 'corners', 'builtInOnly', 'rotate', 'loginItem', 'iconHidden']) el.querySelector(`input[name=${k}]`).checked = !!s[k];
    radios.forEach((r, i) => { const on = +r.dataset.r === Math.round(s.radius); r.setAttribute('aria-checked', on); r.tabIndex = on ? 0 : -1; if (on) seg.style.setProperty('--i', i); r.disabled = !s.corners; });
    seg.classList.toggle('is-disabled', !s.corners);
    el.classList.toggle('is-rotating', !!s.rotate);
    $('.nt-pop__sel').value = String(s.every);
    $('[data-ctl=folder]').textContent = s.folder ? 'Sample wallpapers' : 'Choose Folder…';
    $('[data-ctl=next]').disabled = !(s.folder && s.on);
    el.querySelectorAll('.nt-pop__rot button, .nt-pop__rot select').forEach(c => { c.tabIndex = s.rotate ? 0 : -1; });
  }
  sync(store.get());
  offs.push(store.subscribe((s, ch) => { sync(s); ev.emit('change', s, ch); if (ch && (ch.has?.('dynamic') ?? ch.includes('dynamic'))) drift(); }));
  if (store.get().on) screens().forEach(sc => sc.setBand(1, { duration: 0 }));

  // the switch sequence (3.5): processing → shimmer → band sweeps out of the notch → status
  let seq = 0;
  async function setOn(on) {
    const my = ++seq; clearTimeout(settleT); store.set({ on });
    if (on) {
      const dyn = store.get().dynamic; setStatus(dyn ? 'procDyn' : 'proc');
      await Promise.all(screens().map(sc => sc.process(dyn ? 1400 : 700))); if (my !== seq) return;
      await Promise.all(screens().map(sc => sc.setBand(1, { duration: 700 }))); if (my !== seq) return;
      setStatus('on'); settleT = setTimeout(() => statusKey === 'on' && setStatus('rest'), 4000);
    } else {
      await Promise.all(screens().map(sc => sc.setBand(0, { duration: 600, ease: 'swallow' }))); if (my !== seq) return;
      setStatus('restored');
    }
  }

  // controls
  sw.addEventListener('click', () => setOn(!store.get().on));
  el.addEventListener('change', e => {
    const t = e.target;
    if (t.matches('input[type=checkbox]')) {
      store.set({ [t.name]: t.checked });
      if (t.name === 'builtInOnly' && mirror && !mirror._follows) mirror.setBuiltInOnly(t.checked);
    }
    if (t.matches('select')) store.set({ every: +t.value });
  });
  const pickRadius = (r, focus) => {
    store.set({ radius: r });
    if (mirror) { if (!mirror._follows) mirror.setRadius(r); mirror.flash(`Corners · ${r} pt`, 1200); }
    if (focus) radios.find(b => +b.dataset.r === r)?.focus();
  };
  seg.addEventListener('click', e => { const b = e.target.closest('[role=radio]'); if (b && !b.disabled) pickRadius(+b.dataset.r); });
  seg.addEventListener('keydown', e => {
    const d = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key]; if (!d) return; e.preventDefault();
    const i = radios.findIndex(b => b.getAttribute('aria-checked') === 'true');
    pickRadius(+radios[(i + d + 3) % 3].dataset.r, true);
  });
  $('[data-ctl=folder]').addEventListener('click', () => { store.set({ folder: 'samples' }); say('On your Mac, this opens a folder picker.'); });
  $('[data-ctl=next]').addEventListener('click', () => screens().forEach(sc => sc.setWallpaper('next', { transition: 'slide' })));
  $('[data-ctl=updates]').addEventListener('click', () => say(`You're on v${version}, the latest.`));
  $('[data-ctl=quit]').addEventListener('click', async () => {
    if (!isReduced()) await el.animate([{ transform: 'none', opacity: 1 }, { transform: 'translateY(-46%) scale(.04)', opacity: 0 }], { duration: 260, easing: CSS_EASE.swallow, fill: 'forwards' }).finished;
    say("It's a website. It can't quit.");
    await new Promise(r => setTimeout(r, isReduced() ? 900 : 1100));
    el.animate([{ transform: 'translateY(-46%) scale(.04)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: isReduced() ? 1 : 320, easing: CSS_EASE.knob, fill: 'forwards' }).finished.then(a => a?.cancel?.(), () => {});
  });

  // dynamic wallpapers: one day per 36 s while visible
  let raf, visible = true, t0, base;
  const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; drift(); }); io.observe(el);
  const onVis = () => drift(); document.addEventListener('visibilitychange', onVis);
  function drift() {
    cancelAnimationFrame(raf);
    if (!store.get().dynamic || !visible || document.hidden || isReduced()) return;
    t0 = performance.now(); base = preview.wallpaper.time;
    const step = now => { const t = (base + (now - t0) / 36000) % 1; screens().forEach(sc => sc.store.set({ time: t })); raf = requestAnimationFrame(step); };
    raf = requestAnimationFrame(step);
  }
  drift();

  return {
    el, store, preview,
    on: ev.on,
    set(patch) { if ('on' in patch && patch.on !== store.get().on) { const { on, ...rest } = patch; store.set(rest); return setOn(on); } store.set(patch); return Promise.resolve(); },
    setOn,
    setAppearance(a) { if (!isReduced()) el.animate([{ opacity: .6 }, { opacity: 1 }], { duration: 200 }); setAppearance(a); },
    highlight(name) { const c = el.querySelector(`[data-ctl="${name}"]`); if (!c) return; c.classList.remove('nt-hl'); void c.offsetWidth; c.classList.add('nt-hl'); setTimeout(() => c.classList.remove('nt-hl'), 1600); },
    destroy() { offs.forEach(f => f()); io.disconnect(); cancelAnimationFrame(raf); document.removeEventListener('visibilitychange', onVis); preview.destroy(); el.innerHTML = ''; },
  };
}
