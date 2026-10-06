// #features (SPEC §5.4): six chapters scrub one sticky stage (desk) or play their own mini screens (mob).
// Every stage state is absolute per chapter: apply(i, p, S) writes everything chapter i cares about.
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const seg = (p, a, b) => clamp((p - a) / (b - a));
const lerp = (a, b, k) => a + (b - a) * k;
const io = (k) => (k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);   // inOut for camera moves
// every chapter sits at its own hour of the hills art (never flat midday blue)
const TIME = [null, .6, .58, null, null, .66];
const T0 = 1 / 12, T1 = .796;                       // 01's scrub: 06:00 → 21:40 on the dynamic clock
const CARDS = [['hills', .6], ['dunes', .12], ['tide', .86], ['ridge', .4]];   // 04/05 deck: dusk, dawn, night sea, late sun
const XWALL = [['tide', .86], ['ridge', .1]];      // 02 externals: left night, right dawn (main stays dusk)
const EVERY = ['5 min', '15 min', '30 min', 'Hourly', 'Daily'];
const EVERY_RO = ['5 MIN', '15 MIN', '30 MIN', 'HOUR', 'DAY'];
const RNAME = { 10: 'SMALL', 14: 'MEDIUM', 20: 'LARGE' };
const PHASES = ['dawn', 'day', 'dusk', 'night'];
const pad = (n) => String(n).padStart(2, '0');
// inverse of component.phaseFromClock: wallpaper time → wall-clock hour, so the figure and the menu-bar clock agree
const hourOf = (t) => { t = ((t % 1) + 1) % 1; return (t < .25 ? 5 + t * 12 : t < .5 ? 8 + (t - .25) * 36 : t < .75 ? 17 + (t - .5) * 12 : 20 + (t - .75) * 36) % 24; };
const clockOf = (t) => { const m = Math.round(hourOf(t) * 6) * 10 % 1440; return `${pad(Math.floor(m / 60))}:${pad(m % 60)}`; };
const WD = new Intl.DateTimeFormat(undefined, { weekday: 'short' }).format(new Date());
const hex = (c) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));
const mixHex = (a, b, w) => { const x = hex(a), y = hex(b); return `rgb(${x.map((v, i) => Math.round(lerp(v, y[i], w))).join(',')})`; };

let uid = 0;
export default function init(root, ctx) {
  const { gsap, ScrollTrigger, mm, MQ, settings, lib, Component } = ctx;
  if (!Component) return;
  const chapters = [...root.querySelectorAll('.chapter')];
  const rail = [...root.querySelectorAll('.feat__rail button')];
  const readout = root.querySelector('.feat__readout');
  const chip = root.querySelector('.feat__chip');
  const view = root.querySelector('.feat__view');
  const red = () => lib.reduced();

  // ---- one "stage context" S: a screen + its camera + figure/readout targets (the desk stage, or a mobile card)
  function makeS(el, cam, mode, fig, ro) {
    const store = Component.createStore({ ...Component.SCREEN_DEFAULT, band: 1, time: TIME[1], radius: settings.get().radius, fil: 1, ext: 1 });
    const screen = Component.createScreen(el, { mode, store, label: 'Feature preview', clock: false });
    const glass = el.querySelector('.nt-glass--main');
    // the 04/05 deck: four of our own pictures at four hours, dealt under the band (between wallpaper and menu bar)
    glass.firstElementChild.insertAdjacentHTML('afterend', `<div class="fx-deck" aria-hidden="true">${CARDS.map(() => '<div class="fx-card"></div>').join('')}</div>`);
    const cards = [...glass.querySelectorAll('.fx-card')];
    cards.forEach((c, i) => Component.paintWallpaper(c, { preset: CARDS[i][0], time: CARDS[i][1] }));
    // overlays that live in the main glass so they inherit --pt / --r: dimension arc (03) and 2 s ring (05)
    // 03 macro: a vector close-up of the band's left end (bezel, band, concave fillet), crisp at any size
    glass.insertAdjacentHTML('beforeend', `<div class="fx-macro" aria-hidden="true"><svg viewBox="0 0 400 300" preserveAspectRatio="xMinYMin slice">
      <defs><linearGradient id="fxm-${++uid}" x1="0" y1="0" x2=".3" y2="1"><stop offset="0" stop-color="#2B2153"/><stop offset=".55" stop-color="#8E3F72"/><stop offset="1" stop-color="#F08A5D"/></linearGradient></defs>
      <rect width="400" height="300" fill="url(#fxm-${uid})"/><circle cx="330" cy="250" r="90" fill="#FFB36B" opacity=".18"/>
      <path class="fx-macro__blk"/><text x="105" y="62">Notched</text>
      <path class="fx-macro__arc" pathLength="1"/><path class="fx-macro__r" pathLength="1"/>
      <g class="fx-macro__lbl"><rect width="166" height="30" rx="7"/><text x="10" y="20">RADIUS 14 PT</text></g></svg></div>`);
    glass.querySelector('.nt-mb:not(.nt-mb--on) .nt-mb__icon')?.insertAdjacentHTML('beforeend', `<svg class="fx-ring" viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="20" r="17" pathLength="1"/></svg>`);
    const S = { el, cam, screen, store, glass, fig, ro, mode, cur: -1, prev: 0, override: false, rTarget: store.get().radius, figV: null, roV: '', every: -1, cards, dk: 0, top: 0, deckOn: false,
      macro: glass.querySelector('.fx-macro'), ring: glass.querySelector('.fx-ring'), m: null };
    S.unclk = store.subscribe((s, ch) => { if (!S.deckOn && ch.includes('time')) setClock(S, s.time); if (ch.includes('radius')) macro(S); });
    macro(S);
    setClock(S, store.get().time);
    // geometry is read once and cached; any size change (view, --pt, radius) just drops the cache
    S.rz = new ResizeObserver(() => { S.m = null; });
    [cam.parentElement, glass, glass.querySelector('.nt-notch'), glass.querySelector('.nt-fil--l'), S.ring.parentElement].forEach((n) => n && S.rz.observe(n));
    return S;
  }
  // all scrub-path geometry, in cam px (offsetLeft ignores transforms, so this is stable mid-zoom)
  function geo(S) {
    if (S.m) return S.m;
    const v = S.cam.parentElement, fil = S.glass.querySelector('.nt-fil--l'), n = S.glass.querySelector('.nt-notch'), ic = S.ring.parentElement;
    const f = offsetIn(fil, S.cam), no = offsetIn(n, S.cam), io_ = offsetIn(ic, S.cam);
    return (S.m = { cx: v.clientWidth / 2 - S.cam.offsetLeft, cy: v.clientHeight / 2 - S.cam.offsetTop, w: S.cam.offsetWidth,
      fil: f, notch: { x: no.x + n.offsetWidth / 2, y: no.y }, ring: { x: io_.x + ic.offsetWidth / 2, y: io_.y + ic.offsetHeight / 2 } });
  }
  const killS = (S) => { if (!S) return; S.rz.disconnect(); S.unclk(); S.dkT?.kill(); S.screen.destroy(); if (S.mode === 'display' && S.cam && S.cam !== S.el) { S.el.className = 'feat__screen'; S.el.removeAttribute('style'); S.el.removeAttribute('role'); S.el.removeAttribute('aria-label'); } else S.el.remove(); };

  // camera: scale s about the focus point (cam px), moving that point k of the way to the view centre
  function camera(S, s, fx, fy, k = 0) {
    const { cx, cy } = geo(S);
    S.cam.style.transformOrigin = `${fx}px ${fy}px`;
    S.cam.style.transform = `translate3d(${(cx - fx) * k}px,${(cy - fy) * k}px,0) scale(${s})`;
  }
  // transform-free offsets (offsetLeft ignores transforms) of a node inside the cam
  function offsetIn(node, stop) {
    let x = 0, y = 0;
    for (let n = node; n && n !== stop; n = n.offsetParent) { x += n.offsetLeft + (n !== node ? n.clientLeft : 0); y += n.offsetTop + (n !== node ? n.clientTop : 0); }
    return { x, y };
  }

  // menu-bar clock: the stage's own fiction, always the hour its wallpaper shows
  function setClock(S, t) { const s = `${WD} ${clockOf(t)}`; if (S.clk === s) return; S.clk = s; S.el.querySelectorAll('.nt-mb__clock').forEach((n) => { n.textContent = s; }); }
  // deck position d: integer = settled on card d % 4; the fraction deals the next card in (shuffle: from the right; drop: from above)
  function deck(S, d, drop = false) {
    S.dk = d;
    const n = S.cards.length, b = Math.floor(d + 1e-6), k = io(clamp(d - b)), top = b % n, inc = (b + 1) % n;
    S.cards.forEach((c, i) => {
      const isTop = i === top, isInc = i === inc && k > 0;
      c.style.visibility = isTop || isInc ? '' : 'hidden';
      if (isTop) { c.style.zIndex = 1; c.style.transform = k > 0 ? `translate3d(${(-14 * k).toFixed(2)}%,0,0) scale(${(1 - .12 * k).toFixed(4)}) rotate(${(-3 * k).toFixed(2)}deg)` : ''; c.style.filter = k > 0 ? `brightness(${(1 - .45 * k).toFixed(3)})` : ''; c.classList.toggle('is-moving', k > 0); }
      if (isInc) { const q = 1 - k; c.style.zIndex = 2; c.style.filter = ''; c.classList.add('is-moving');
        c.style.transform = drop ? `translate3d(0,${(-112 * q).toFixed(2)}%,0) rotate(${(-6 * q).toFixed(2)}deg) scale(${lerp(.82, 1, k).toFixed(4)})`
          : `translate3d(${(116 * q).toFixed(2)}%,${(8 * q).toFixed(2)}%,0) rotate(${(10 * q).toFixed(2)}deg) scale(${lerp(.8, 1, k).toFixed(4)})`; }
    });
    S.top = k >= .5 ? inc : top;
    setClock(S, CARDS[S.top][1]);
    // the screen takes the visible card's hour, so menu text and spill follow it (1 ms: a tween cancels base()'s running one)
    if (S.topT !== S.top) { S.topT = S.top; S.screen.setTime(CARDS[S.top][1], { duration: 1 }); }
  }
  function deckTo(S, to, drop, dur = .8, done) { S.dkT?.kill(); const o = { d: S.dk }; S.dkT = gsap.to(o, { d: to, duration: red() ? 0 : dur, ease: 'none', onUpdate: () => deck(S, o.d, drop), onComplete: done }); }
  // 02: our own pictures over each external (left night, right dawn), each drawing its own band once it appears
  function extWalls(S) {
    S.el.querySelectorAll('.nt-glass--ext').forEach((g, j) => {
      if (g.querySelector('.fx-xwp') || !XWALL[j]) return;
      const d = document.createElement('div'); d.className = 'fx-xwp'; g.firstElementChild.after(d);
      Component.paintWallpaper(d, { preset: XWALL[j][0], time: XWALL[j][1] }); S.clk = null;
    });
    setClock(S, S.store.get().time);
  }

  // ---- figure + readout
  function figure(S, v, unit) {
    if (!S.fig || S.figV === v) return;
    S.figV = v;
    const el = S.fig.querySelector('.fig__v');
    // ponytail: at most one roll per 160 ms (trailing), so a fast scrub never stacks rolls
    clearTimeout(S.figT);
    const now = performance.now(), go = () => { S.figAt = performance.now(); lib.roll(el, v, { duration: .4 }); };
    if (now - (S.figAt || 0) >= 160) go(); else S.figT = setTimeout(go, 160 - (now - S.figAt));
    if (unit != null) S.fig.querySelector('.fig__u').textContent = unit;
  }
  function ro(S, html) { if (!S.ro || S.roV === html) return; S.roV = html; S.ro.innerHTML = html; }

  // ---- the six chapter states. `p` 0..1 across the chapter; `enter` true on the first frame of a chapter.
  const sc = (S) => S.screen;
  function base(S, i, enter) {
    const s = S.store.get();
    if (enter) {
      S.override = false;
      if (i !== 5 && s.fil < .99) sc(S).setFillets(1, { duration: red() ? 0 : 520 }).then(() => { if (S.cur !== 5) sc(S).setFillets(null); });
      else sc(S).setFillets(null);
      if (s.displays !== 1 && i !== 1) sc(S).setDisplays(1, { duration: 0 });
      if (i !== 1 && s.builtInOnly) sc(S).setBuiltInOnly(false);
      if (TIME[i] != null && Math.abs(s.time - TIME[i]) > .01) sc(S).setTime(TIME[i], { duration: red() ? 0 : 900 });
      sc(S).store.set({ corners: true, notchRim: null, menuText: 'auto' });
      if (i !== 2 && S.rTarget !== settings.get().radius) setR(S, settings.get().radius);
      S.deckOn = i === 3 || i === 4; S.el.classList.toggle('is-deck', S.deckOn); S.dkT?.kill(); S.topT = -1;
      if (!S.deckOn) setClock(S, TIME[i] ?? s.time);
      S.glass.style.setProperty('--lift', 0);
      S.glass.querySelectorAll('.nt-flash').forEach((n) => n.remove());
      S.macro.style.opacity = 0; S.ring.style.setProperty('--k', 1); S.ring.style.opacity = 0;
      S.el.classList.toggle('is-watching', i === 4);
      S.figV = null; S.every = -1; clearTimeout(S.figT);
      chip?.classList.toggle('is-on', S === desk && i === 1);
    }
  }
  // macro geometry: bezel x<60, band y<90, 1 pt = 3.75 units (a 24 pt menu bar = 90); fillet centre at (60+R, 90+R)
  function macro(S) {
    const r = S.store.get().radius, R = r * 3.75, cx = 60 + R, cy = 90 + R, q = S.macro;
    q.querySelector('.fx-macro__blk').setAttribute('d', `M0 0H400V90H${cx.toFixed(2)}A${R.toFixed(2)} ${R.toFixed(2)} 0 0 0 60 ${cy.toFixed(2)}V300H0Z`);
    q.querySelector('.fx-macro__arc').setAttribute('d', `M60 ${cy.toFixed(2)}A${R.toFixed(2)} ${R.toFixed(2)} 0 0 1 ${cx.toFixed(2)} 90`);
    q.querySelector('.fx-macro__r').setAttribute('d', `M${cx.toFixed(2)} ${cy.toFixed(2)}L${(cx - R * .7071).toFixed(2)} ${(cy - R * .7071).toFixed(2)}`);
    q.querySelector('.fx-macro__lbl').setAttribute('transform', `translate(${(cx + 14).toFixed(1)} ${(cy + 10).toFixed(1)})`);
  }
  function setR(S, r) { S.rTarget = r; sc(S).setRadius(r, { duration: red() ? 0 : 520 }); }
  function displays(S, n) { if (S.store.get().displays === n) return; sc(S).setDisplays(n, { duration: n > S.store.get().displays && !red() ? 900 : 0 }); }
  function builtIn(S, b) { if (!!S.store.get().builtInOnly === b) return; sc(S).setBuiltInOnly(b); }
  const crossed = (S, p, th) => S.prev < th && p >= th;

  const CH = [
    // 01 dynamic: band on, the day runs dawn → night under it
    (S, p) => {
      sc(S).setBand(1, { duration: 0 }); sc(S).setMenuText('white');
      if (!S.override) sc(S).setTime(lerp(T0, T1, p), { duration: 0 });
      if (crossed(S, p, .02) && !red()) sc(S).flash('Processing dynamic wallpaper… this takes a few seconds.', 2400);
      paint0(S);
    },
    // 02 displays: pull back, 1 → 2 → 3, then built-in only retracts the externals
    (S, p) => {
      sc(S).setBand(1, { duration: 0 });
      // one external (left) → frame 186% of the laptop, shifted right; two → 272%, centred
      const d2 = io(seg(p, .12, .32)), d3 = io(seg(p, .38, .58)), s = 1 - .48 * d2 - .16 * d3;
      S.cam.style.transformOrigin = '50% 50%';
      S.cam.style.transform = `translate3d(${(.43 * geo(S).w * s * d2 * (1 - d3)).toFixed(1)}px,0,0) scale(${s.toFixed(4)})`;
      displays(S, p < .2 ? 1 : p < .45 ? 2 : 3);
      extWalls(S);
      S.el.querySelectorAll('.nt-glass--ext').forEach((g, j) => g.style.setProperty('--bb', `calc(var(--band) * var(--eb) * ${io(seg(p, j ? .5 : .25, j ? .62 : .37)).toFixed(4)})`));
      if (!S.override) builtIn(S, p >= .7);
      paint1(S);
    },
    // 03 corners: push in on the left band end, radius steps 10 → 14 → 20 with the fillet overshoot, arc draws
    (S, p) => {
      sc(S).setBand(1, { duration: 0 });
      const k = io(seg(p, 0, .25));   // stays up to the end; the next chapter's base() clears it
      S.cam.style.transform = '';   // no raster zoom (it blurs); the vector macro grows out of the band's left end instead
      if (!S.override) { const r = p < .3 ? settings.get().radius : p < .55 ? 10 : p < .8 ? 14 : 20; if (r !== S.rTarget) setR(S, r); }
      S.macro.style.opacity = clamp(k * 1.4 - .2); S.macro.style.transform = `scale(${lerp(.3, 1, k).toFixed(4)})`;
      S.macro.style.setProperty('--k', 1 - seg(p, .22, .45));
      paint2(S);
    },
    // 04 rotation: hills → dunes → tide → ridge sliding under a band that never moves
    (S, p) => {
      sc(S).setBand(1, { duration: 0 });
      if (!S.override) deck(S, seg(p, .1, .28) + seg(p, .36, .54) + seg(p, .62, .8));
      const e = Math.min(4, Math.floor(p * 5));
      if (e !== S.every) { S.every = e; figure(S, EVERY[e]); }
      paint3(S);
    },
    // 05 watching: cut to a new picture with no band, a 2 s check, then the band comes back
    (S, p) => {
      if (S.override) return;
      // a new picture drops in (no band baked in yet), the 2 s check runs, the band is redrawn from the notch
      deck(S, 2 + seg(p, .06, .2), true);
      sc(S).setBand(p < .2 ? 1 : p < .6 ? 0 : io(seg(p, .62, .8)), { duration: 0 });
      if (crossed(S, p, .3)) sc(S).pulse();
      if (crossed(S, p, .6)) sc(S).process(700);
      const rk = seg(p, .3, .6);
      const ic = geo(S).ring, ck = io(seg(p, .22, .32)) * (1 - io(seg(p, .62, .74)));
      camera(S, lerp(1, S.mode === 'mini' ? 2 : 2.6, ck), ic.x, ic.y, ck * .7);
      S.ring.style.opacity = p >= .3 && p < .66 ? 1 : 0; S.ring.style.setProperty('--k', 1 - rk);
      figure(S, String(p < .3 ? 2 : Math.max(0, Math.ceil(2 - rk * 2 - 1e-6))), 'S');
      ro(S, `CHECKS EVERY 2 S <i class="fx-dot"></i>`);
    },
    // 06 off: fillets out first, the band swallowed back into the notch, push slightly to the notch
    (S, p) => {
      if (S.override) return;
      // fillets tuck in, then the whole band lifts off the top edge and the notch is back on the wallpaper
      sc(S).setFillets(1 - seg(p, .05, .18));
      const k = io(seg(p, .18, .6));
      if (p < .6) { sc(S).setBand(1, { duration: 0 }); S.glass.style.setProperty('--lift', k.toFixed(4)); sc(S).setNotchRim(k); }
      else { sc(S).setBand(0, { duration: 0 }); S.glass.style.setProperty('--lift', 0); sc(S).setNotchRim(null); }
      const n = geo(S).notch; camera(S, lerp(1, 1.15, io(seg(p, .1, .7))), n.x, n.y, 0);
      if (crossed(S, p, .62) && !red()) sc(S).flash('Wallpaper restored. Other Spaces get theirs back when you visit them.', 2200);
      ro(S, p < .6 ? 'SWITCHING OFF…' : 'ORIGINAL RESTORED');
    },
  ];

  function paint0(S) {
    const t = S.store.get().time % 1;
    figure(S, clockOf(t));
    setClock(S, t);
    const ph = Component.phaseName ? Component.phaseName(t) : PHASES[Math.round(t * 4) % 4];
    ro(S, 'PHASE ' + PHASES.map((x) => `<span${x === ph ? ' class="is-on"' : ''}>${x.toUpperCase()}</span>`).join(' → '));
    const range = S.toy?.querySelector('input[type=range]');
    if (range && !S.override) range.value = Math.round(clamp((t - T0) / (T1 - T0)) * 950);
    if (range) { range.setAttribute('aria-valuetext', `${ph[0].toUpperCase()}${ph.slice(1)}, ${clockOf(t)}`); sun(range); }
  }
  function paint1(S) {
    const s = S.store.get();
    figure(S, 'All');
    ro(S, `DISPLAYS ${s.displays} · BUILT-IN ONLY ${s.builtInOnly ? 'ON' : 'OFF'}`);
    const cb = S.toy?.querySelector('input[type=checkbox]'); if (cb) cb.checked = !!s.builtInOnly;
    chip?.classList.toggle('is-checked', !!s.builtInOnly);
  }
  function paint2(S) {
    const r = Math.round(S.rTarget);
    figure(S, String(r), 'PT');
    S.macro.querySelector('.fx-macro__lbl text').textContent = `RADIUS ${r} PT`;
    ro(S, `RADIUS ${r} PT · ${RNAME[r] || ''}`);
    S.toy?.querySelectorAll('[role=radio]').forEach((b) => { const on = +b.dataset.r === r; b.setAttribute('aria-checked', on); b.tabIndex = on ? 0 : -1; });
  }
  function paint3(S) {
    ro(S, `WALLPAPER ${S.top + 1}/4 · EVERY ${EVERY_RO[Math.max(0, S.every)]}`);
  }
  function sun(range) {
    const v = range.value / 950, w = range.closest('.toy-arc');
    w.style.setProperty('--v', v.toFixed(4));
    w.style.setProperty('--y', (1 - Math.sin(v * Math.PI)).toFixed(4));
  }

  function apply(S, i, p) {
    const enter = S.cur !== i;
    if (enter) { S.cur = i; base(S, i, true); S.prev = -1; S.toy = chapters[i].querySelector('.chapter__toy'); if (i !== 1 && i !== 2 && i !== 5) S.cam.style.transform = ''; }
    CH[i](S, p);
    S.prev = p;
  }

  // ---- toys (they drive whichever S owns this chapter right now)
  const toyS = (i) => (desk && !mobile ? (desk.cur === i ? desk : (apply(desk, i, 1), desk)) : cards[i]);
  chapters.forEach((ch, i) => {
    const toy = ch.querySelector('.chapter__toy');
    toy.addEventListener('input', (e) => {
      const S = toyS(i); if (!S) return;
      if (e.target.type === 'range') { S.override = true; S.screen.setTime(lerp(T0, T1, e.target.value / 950), { duration: 0 }); S.store.flush?.(); paint0(S); }
    });
    toy.addEventListener('change', (e) => {
      const S = toyS(i); if (!S || e.target.type !== 'checkbox') return;
      S.override = true; S.screen.setBuiltInOnly(e.target.checked); setTimeout(() => paint1(S), 0);
    });
    toy.addEventListener('click', (e) => {
      const b = e.target.closest('button'); if (!b) return;
      const S = toyS(i); if (!S) return;
      S.override = true;
      if (b.dataset.r) { const r = +b.dataset.r; setR(S, r); settings.set({ radius: r, corners: true }); if (S.cur === 2) { S.macro.style.opacity = 1; S.macro.style.transform = ''; S.macro.style.setProperty('--k', 0); } paint2(S); }
      else if (b.dataset.toy === 'next') deckTo(S, Math.floor(S.dk + 1e-6) + 1, false, .8, () => paint3(S));
      else if (b.dataset.toy === 'change') watchNow(S);
      else if (b.dataset.toy === 'on') {
        const on = S.store.get().band < .5; S.glass.style.setProperty('--lift', 0); S.screen.setNotchRim(null);
        if (on) { S.screen.setFillets(null); S.screen.setBand(1, { duration: red() ? 0 : 700 }).then(() => S.screen.setFillets(1, { duration: red() ? 0 : 520 })); }
        else { S.screen.setFillets(0, { duration: 160 }); S.screen.setBand(0, { duration: red() ? 0 : 600, ease: 'swallow' }); }
        b.textContent = on ? 'Switch it off again' : 'Switch it back on';
        ro(S, on ? 'BAND ON' : 'ORIGINAL RESTORED');
      }
    });
    // radiogroup arrows
    toy.querySelector('[role=radiogroup]')?.addEventListener('keydown', (e) => {
      const d = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key]; if (!d) return;
      e.preventDefault();
      const bs = [...toy.querySelectorAll('[role=radio]')], at = bs.findIndex((b) => b.getAttribute('aria-checked') === 'true');
      const nx = bs[(at + d + 3) % 3]; nx.focus(); nx.click();
    });
  });
  let watchT = [];
  function watchNow(S) {
    watchT.forEach(clearTimeout); watchT = [];
    deckTo(S, Math.floor(S.dk + 1e-6) + 1, true, .6); S.screen.setBand(0, { duration: red() ? 0 : 200 }); S.screen.pulse();
    if (red()) { S.screen.setBand(1, { duration: 0 }); figure(S, '0', 'S'); return; }
    S.ring.style.opacity = 1; S.ring.style.setProperty('--k', 1);
    S.ring.getBoundingClientRect();
    S.ring.style.transition = 'stroke-dashoffset 2s linear'; S.ring.style.setProperty('--k', 0);
    figure(S, '2', 'S');
    watchT.push(setTimeout(() => figure(S, '1', 'S'), 1000));
    watchT.push(setTimeout(() => {
      figure(S, '0', 'S'); S.ring.style.transition = ''; S.ring.style.opacity = 0;
      S.screen.process(700).then(() => S.screen.setBand(1, { duration: 700 }));
    }, 2000));
  }

  // rail
  rail.forEach((b, i) => b.addEventListener('click', () => { chapters[i].scrollIntoView({ block: 'center', behavior: red() ? 'instant' : 'smooth' }); chapters[i].querySelector('h3').focus({ preventScroll: true }); }));
  const setRail = (i) => rail.forEach((b, j) => { b.classList.toggle('is-on', i === j); b.toggleAttribute('aria-current', i === j); });

  let desk = null, mobile = false;
  const cards = [];

  mm.add(MQ, (c) => {
    const { desk: isDesk, still } = c.conditions;
    const wide = matchMedia('(min-width: 900px)').matches;
    // ---------- desk (and reduced on desk): one sticky stage
    if (wide) {
      mobile = false;
      const S = desk = makeS(root.querySelector('.feat__screen'), root.querySelector('.feat__cam'), 'display', null, readout);
      // spill: one radial gradient tinted from the stage's hour (a CSS var write, no blur re-raster)
      const spill = root.querySelector('.feat__spill'), PAL = Component.PALETTE, PH = ['dawn', 'day', 'dusk', 'night'];
      let sp = '';
      const tint = (t) => {
        const f = (((t % 1) + 1) % 1) * 4, a = PAL[PH[Math.floor(f) % 4]], b = PAL[PH[(Math.floor(f) + 1) % 4]], w = Math.round((f % 1) * 20) / 20;
        const v = `${mixHex(a.hz, b.hz, w)}|${mixHex(a.mid, b.mid, w)}`; if (v === sp) return; sp = v;
        const [x, y] = v.split('|'); spill.style.setProperty('--sa', x); spill.style.setProperty('--sb', y);
      };
      tint(S.store.get().time);
      const unsub = S.store.subscribe((s, ch) => { if (ch.includes('time')) tint(s.time); });
      let active = 0;
      const figIn = chapters.map((ch) => ch.querySelector('.chapter__in'));
      const fig = (i) => chapters[i].querySelector('.chapter__fig');
      if (!still) gsap.set(figIn.slice(1), { yPercent: 105 });
      const proxies = chapters.map(() => ({ p: 0 }));
      chapters.forEach((ch, i) => {
        // figure swap + active chapter
        ScrollTrigger.create({ trigger: ch, start: 'top 55%', end: 'bottom 45%',
          onToggle: (st) => {
            if (st.isActive) {
              active = i; setRail(i); S.fig = fig(i); S.figV = null;
              root.dataset.active = i;
              if (still) { apply(S, i, 1); return; }
              gsap.fromTo(figIn[i], { yPercent: 105 }, { yPercent: 0, duration: .5, ease: lib.EASE.out, overwrite: true });
              apply(S, i, proxies[i].p);
            } else if (!still) {
              gsap.to(figIn[i], { yPercent: st.direction > 0 ? -105 : 105, duration: .35, ease: lib.EASE.swallow, overwrite: true });
            }
          } });
        if (!still) gsap.to(proxies[i], { p: 1, ease: 'none',
          scrollTrigger: { trigger: ch, start: 'top 60%', end: 'bottom 40%', scrub: .4 },
          onUpdate: () => { if (active === i && !(S.override && S.cur === i)) apply(S, i, proxies[i].p); } });
      });
      S.fig = fig(0); setRail(0); root.dataset.active = 0;
      apply(S, 0, still ? 1 : 0);
      // pause the stage's loops off-screen
      const unvis = lib.whenVisible(view, () => view.classList.remove('is-off'), () => view.classList.add('is-off'));
      return () => { unsub(); unvis(); killS(S); desk = null; watchT.forEach(clearTimeout); gsap.set(figIn, { clearProps: 'transform' }); };
    }

    // ---------- mobile: each chapter is a card with its own mini screen, played once at 50% visible
    mobile = true;
    const offs = [];
    const playIO = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { const i = +e.target.dataset.ch; if (cards[i] && !cards[i].played) play(i); } }), { threshold: .5 });
    function create(i) {
      if (cards[i]) return;
      const host = chapters[i].querySelector('.chapter__screen');
      const inner = document.createElement('div'); host.append(inner);
      const S = cards[i] = makeS(inner, inner, i === 1 ? 'display' : 'mini', chapters[i].querySelector('.chapter__fig'), null);
      chapters[i].classList.add('has-screen');
      apply(S, i, still ? 1 : 0);
      if (still) { S.played = true; return; }
      let rp = chapters[i].querySelector('.chapter__replay');
      if (!rp) { rp = document.createElement('button'); rp.type = 'button'; rp.className = 'chapter__replay mono'; rp.textContent = '↺ Replay'; host.after(rp); rp.addEventListener('click', () => cards[i] && play(i)); }
    }
    function play(i) {
      const S = cards[i]; S.played = true; S.override = false; S.cur = -1;
      const pr = { p: 0 }; S.tl?.kill();
      apply(S, i, 0);
      S.tl = gsap.to(pr, { p: 1, duration: i === 4 ? 3 : 2.6, ease: 'none', onUpdate: () => !S.override && apply(S, i, pr.p) });
    }
    chapters.forEach((ch, i) => {
      offs.push(lib.whenVisible(ch, () => create(i), () => { cards[i]?.tl?.kill(); killS(cards[i]); cards[i] = null; ch.classList.remove('has-screen'); }, '150% 0px'));
      playIO.observe(ch);
    });
    return () => { playIO.disconnect(); offs.forEach((f) => f()); cards.forEach((S, i) => { S?.tl?.kill(); killS(S); cards[i] = null; }); root.querySelectorAll('.chapter__replay').forEach((b) => b.remove()); mobile = false; };
  });

  return () => { watchT.forEach(clearTimeout); };
}
