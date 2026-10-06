// #features (SPEC §5.4): six chapters scrub one sticky stage (desk) or play their own mini screens (mob).
// Every stage state is absolute per chapter: apply(i, p, S) writes everything chapter i cares about.
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const seg = (p, a, b) => clamp((p - a) / (b - a));
const lerp = (a, b, k) => a + (b - a) * k;
const io = (k) => (k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);   // inOut for camera moves
const DAY = .3;
const PRESETS = ['hills', 'dunes', 'tide', 'ridge'];
const EVERY = ['5 min', '15 min', '30 min', 'Hourly', 'Daily'];
const EVERY_RO = ['5 MIN', '15 MIN', '30 MIN', 'HOUR', 'DAY'];
const RNAME = { 10: 'SMALL', 14: 'MEDIUM', 20: 'LARGE' };
const PHASES = ['dawn', 'day', 'dusk', 'night'];
const HOUR = { hills: DAY, dunes: .56, tide: .86, ridge: .1 };   // rotation/watching scenes: day, dusk, night sea, dawn

export default function init(root, ctx) {
  const { gsap, ScrollTrigger, mm, MQ, settings, lib, Component } = ctx;
  if (!Component) return;
  const chapters = [...root.querySelectorAll('.chapter')];
  const rail = [...root.querySelectorAll('.feat__rail button')];
  const readout = root.querySelector('.feat__readout');
  const chip = root.querySelector('.feat__chip');
  const view = root.querySelector('.feat__view');
  const red = () => lib.reduced();
  const clockOf = (t) => { const m = Math.round((360 + clamp(t / .95) * 940) / 20) * 20; return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`; };

  // ---- one "stage context" S: a screen + its camera + figure/readout targets (the desk stage, or a mobile card)
  function makeS(el, cam, mode, fig, ro) {
    const store = Component.createStore({ ...Component.SCREEN_DEFAULT, band: 1, time: DAY, radius: settings.get().radius, fil: 1, ext: 1 });
    const screen = Component.createScreen(el, { mode, store, label: 'Feature preview', clock: mode !== 'mini' });
    const glass = el.querySelector('.nt-glass--main');
    // overlays that live in the main glass so they inherit --pt / --r: dimension arc (03) and 2 s ring (05)
    glass.insertAdjacentHTML('beforeend', `<div class="fx-dim" aria-hidden="true"><svg viewBox="0 0 100 100"><path class="fx-dim__arc" pathLength="1" d="M0 100A100 100 0 0 1 100 0"/><path class="fx-dim__r" pathLength="1" d="M100 100L29.3 29.3"/><path class="fx-dim__t" d="M-14 100H8M100 -14V8"/></svg><b>R 14 PT</b></div>`);
    glass.querySelector('.nt-mb:not(.nt-mb--on) .nt-mb__icon')?.insertAdjacentHTML('beforeend', `<svg class="fx-ring" viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="20" r="17" pathLength="1"/></svg>`);
    const S = { el, cam, screen, store, glass, fig, ro, mode, cur: -1, prev: 0, override: false, rTarget: store.get().radius, figV: null, roV: '', every: -1, pre: 'hills',
      dim: glass.querySelector('.fx-dim'), dimLbl: glass.querySelector('.fx-dim b'), ring: glass.querySelector('.fx-ring'), m: null };
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
  const killS = (S) => { if (!S) return; S.rz.disconnect(); S.screen.destroy(); if (S.mode === 'display' && S.cam && S.cam !== S.el) { S.el.className = 'feat__screen'; S.el.removeAttribute('style'); S.el.removeAttribute('role'); S.el.removeAttribute('aria-label'); } else S.el.remove(); };

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
      if (i !== 0 && Math.abs(s.time - DAY) > .01) sc(S).setTime(DAY, { duration: red() ? 0 : 900 });
      sc(S).store.set({ corners: true, notchRim: null, menuText: 'auto' });
      if (i !== 2 && S.rTarget !== settings.get().radius) setR(S, settings.get().radius);
      if (i !== 3 && i !== 4 && S.pre !== 'hills') wall(S, 'hills', 'cut');
      S.glass.querySelectorAll('.nt-flash').forEach((n) => n.remove());
      S.dim.style.opacity = 0; S.ring.style.setProperty('--k', 1); S.ring.style.opacity = 0;
      S.el.classList.toggle('is-watching', i === 4);
      S.figV = null; S.every = -1; clearTimeout(S.figT);
      chip?.classList.toggle('is-on', S === desk && i === 1);
    }
  }
  function setR(S, r) { S.rTarget = r; sc(S).setRadius(r, { duration: red() ? 0 : 520 }); }
  function wall(S, id, transition = 'slide') {
    if (S.pre === id) return; S.pre = id; sc(S).setWallpaper(id, { transition: red() ? 'cut' : transition });
    if (S.cur === 3 || S.cur === 4) sc(S).setTime(HOUR[id], { duration: transition === 'cut' || red() ? 1 : 700 });   // 1 ms, not 0: only a tween cancels base()'s running time tween
  }
  function displays(S, n) { if (S.store.get().displays === n) return; sc(S).setDisplays(n, { duration: n > S.store.get().displays && !red() ? 900 : 0 }); }
  function builtIn(S, b) { if (!!S.store.get().builtInOnly === b) return; sc(S).setBuiltInOnly(b); }
  const crossed = (S, p, th) => S.prev < th && p >= th;

  const CH = [
    // 01 dynamic: band on, the day runs dawn → night under it
    (S, p) => {
      sc(S).setBand(1, { duration: 0 }); sc(S).setMenuText('white');
      if (!S.override) sc(S).setTime(p * .95, { duration: 0 });
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
      if (!S.override) builtIn(S, p >= .7);
      paint1(S);
    },
    // 03 corners: push in on the left band end, radius steps 10 → 14 → 20 with the fillet overshoot, arc draws
    (S, p) => {
      sc(S).setBand(1, { duration: 0 });
      const k = io(seg(p, 0, .25)) * (1 - io(seg(p, .9, 1)));
      const f = geo(S).fil;
      camera(S, lerp(1, 4.4, k), f.x, f.y, k * .8);   // SPEC says 3.2; at stage size the 14 pt fillet needs ~4.4 to read
      if (!S.override) { const r = p < .3 ? settings.get().radius : p < .55 ? 10 : p < .8 ? 14 : 20; if (r !== S.rTarget) setR(S, r); }
      S.dim.style.opacity = k; S.dim.style.setProperty('--k', 1 - seg(p, .22, .45));
      paint2(S);
    },
    // 04 rotation: hills → dunes → tide → ridge sliding under a band that never moves
    (S, p) => {
      sc(S).setBand(1, { duration: 0 });
      if (!S.override) wall(S, PRESETS[p < .2 ? 0 : p < .45 ? 1 : p < .7 ? 2 : 3]);
      const e = Math.min(4, Math.floor(p * 5));
      if (e !== S.every) { S.every = e; figure(S, EVERY[e]); }
      paint3(S);
    },
    // 05 watching: cut to a new picture with no band, a 2 s check, then the band comes back
    (S, p) => {
      if (S.override) return;
      if (p < .2) { wall(S, 'tide', 'cut'); sc(S).setBand(1, { duration: 0 }); }
      else { wall(S, 'dunes', 'cut'); sc(S).setBand(p < .6 ? 0 : io(seg(p, .62, .8)), { duration: 0 }); }
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
      sc(S).setFillets(1 - seg(p, .05, .18));
      sc(S).setBand(1 - CSS_SWALLOW(seg(p, .18, .6)), { duration: 0 });
      const n = geo(S).notch; camera(S, lerp(1, 1.15, io(seg(p, .1, .7))), n.x, n.y, 0);
      if (crossed(S, p, .62) && !red()) sc(S).flash('Wallpaper restored. Other Spaces get theirs back when you visit them.', 2200);
      ro(S, p < .6 ? 'SWITCHING OFF…' : 'ORIGINAL RESTORED');
    },
  ];
  const CSS_SWALLOW = (k) => k * k * k;

  function paint0(S) {
    const t = S.store.get().time % 1;
    figure(S, clockOf(t));
    const ph = Component.phaseName ? Component.phaseName(t) : PHASES[Math.round(t * 4) % 4];
    ro(S, 'PHASE ' + PHASES.map((x) => `<span${x === ph ? ' class="is-on"' : ''}>${x.toUpperCase()}</span>`).join(' → '));
    const range = S.toy?.querySelector('input[type=range]');
    if (range && !S.override) range.value = Math.round(clamp(t / .95) * 950);
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
    S.dimLbl.textContent = `R ${r} PT`;
    ro(S, `RADIUS ${r} PT · ${RNAME[r] || ''}`);
    S.toy?.querySelectorAll('[role=radio]').forEach((b) => { const on = +b.dataset.r === r; b.setAttribute('aria-checked', on); b.tabIndex = on ? 0 : -1; });
  }
  function paint3(S) {
    const k = PRESETS.indexOf(S.pre) + 1;
    ro(S, `WALLPAPER ${k}/4 · EVERY ${EVERY_RO[Math.max(0, S.every)]}`);
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
      if (e.target.type === 'range') { S.override = true; S.screen.setTime(e.target.value / 1000, { duration: 0 }); S.store.flush?.(); paint0(S); }
    });
    toy.addEventListener('change', (e) => {
      const S = toyS(i); if (!S || e.target.type !== 'checkbox') return;
      S.override = true; S.screen.setBuiltInOnly(e.target.checked); setTimeout(() => paint1(S), 0);
    });
    toy.addEventListener('click', (e) => {
      const b = e.target.closest('button'); if (!b) return;
      const S = toyS(i); if (!S) return;
      S.override = true;
      if (b.dataset.r) { const r = +b.dataset.r; setR(S, r); settings.set({ radius: r, corners: true }); S.dim.style.opacity = 1; S.dim.style.setProperty('--k', 0); paint2(S); }
      else if (b.dataset.toy === 'next') { const id = PRESETS[(PRESETS.indexOf(S.pre) + 1) % 4]; wall(S, id); paint3(S); }
      else if (b.dataset.toy === 'change') watchNow(S);
      else if (b.dataset.toy === 'on') {
        const on = S.store.get().band < .5;
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
    const next = PRESETS[(PRESETS.indexOf(S.pre) + 1) % 4];
    wall(S, next, 'cut'); S.screen.setBand(0, { duration: 0 }); S.screen.pulse();
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
      const spill = Component.paintWallpaper(root.querySelector('.feat__spill'), { preset: 'hills', time: DAY });
      let lastPre = 'hills';
      const unsub = S.store.subscribe((s, ch) => { if (ch.includes('time')) spill.setTime(s.time); if (s.preset !== lastPre) { lastPre = s.preset; spill.setPreset(s.preset, { transition: 'cut' }); } });
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
      return () => { unsub(); unvis(); spill.destroy(); killS(S); desk = null; watchT.forEach(clearTimeout); gsap.set(figIn, { clearProps: 'transform' }); };
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
