// #try (SPEC §5.3): "Go on. Flip it." The popover writes the site-wide settings; the mirror follows them, and while
// #try is on screen the site's own menu bar (stores.hero.band) follows the mirror's band. Layout is reserved in try.css.
// The mirror and the window are built ONCE per page view; matchMedia only re-places them (a rebuild would replay the
// demo on the visitor's own switch).
export default function init(root, ctx) {
  const { gsap, ScrollTrigger, mm, MQ, settings: S, stores, lib, Component } = ctx;
  if (!Component) return;
  const $ = (s) => root.querySelector(s);
  const stage = $('[data-try-stage]'), box = $('[data-try-box]'), mirrorEl = $('[data-try-mirror]'), right = $('[data-try-right]'),
    wrap = $('[data-try-popwrap]'), popEl = $('[data-try-pop]'), wire = $('.try__wire'),
    plate = $('[data-try-plate]'), look = $('[data-try-look]');
  const hero = stores.hero;
  const WIDE = '(min-width: 900px)', FRAME = '(min-width: 1200px) and (min-height: 700px)';
  const isWide = () => matchMedia(WIDE).matches, isStill = () => matchMedia(MQ.still).matches;
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));

  const store = Component.createStore({ ...Component.SCREEN_DEFAULT, displays: isWide() ? 2 : 1 });
  const mirror = Component.createScreen(mirrorEl, { store, mode: 'display', interactive: true, parallax: isWide(), follow: true, settings: S, label: 'Notched, on a recreated screen' });
  const pop = Component.createPopover(popEl, { store: S, mirror, toast: (t) => (isWide() ? mirror.flash(t) : lib.toast(t)) });
  const sw = popEl.querySelector('.nt-pop__switch'), statusEl = popEl.querySelector('.nt-pop__status span');
  const glass = mirrorEl.querySelector('.nt-glass--main'), icon = glass.querySelector('.nt-mb__icon'), mb = glass.querySelector('.nt-mb');
  const offs = [];
  const ring = document.createElement('span'); ring.className = 'try__turn'; ring.setAttribute('aria-hidden', 'true'); ring.innerHTML = '<b>your turn</b>'; sw.append(ring);

  // the demo stops for good the moment the visitor reaches for the window (pointer or keyboard); it never turns anything off
  let touched = false, played = false;
  const stop = (e) => { if (e.target === root) return; touched = true; popEl.classList.remove('is-turn'); };
  stage.addEventListener('pointerdown', stop, true); root.addEventListener('keydown', stop, true); root.addEventListener('focusin', stop, true);

  // the "your turn" ring only animates while #try is on screen
  offs.push(lib.whenVisible(root, () => root.classList.add('is-vis'), () => root.classList.remove('is-vis')));

  // appearance: mono DARK | LIGHT under the window
  const btns = [...look.querySelectorAll('[data-look]')];
  const paintLook = (a) => btns.forEach((b) => { const on = b.dataset.look === a; b.setAttribute('aria-checked', on); b.tabIndex = on ? 0 : -1; });
  paintLook(S.state.appearance);
  const pickLook = (a, focus) => { S.set({ appearance: a }); pop.setAppearance(a); paintLook(a); if (focus) btns.find((b) => b.dataset.look === a).focus(); };
  const onLookClick = (e) => { const b = e.target.closest('[data-look]'); if (b) pickLook(b.dataset.look); };
  const onLookKey = (e) => { if (!/^Arrow/.test(e.key)) return; e.preventDefault(); pickLook(S.state.appearance === 'dark' ? 'light' : 'dark', true); };
  look.addEventListener('click', onLookClick); look.addEventListener('keydown', onLookKey);

  // live readout, one value per row (ScrambleText 300 ms on the values that changed)
  const RN = { 10: 'SMALL', 14: 'MEDIUM', 20: 'LARGE' };
  const vals = (s) => ({ band: s.on ? 'ON' : 'OFF', corners: s.corners ? `${RN[s.radius] || ''} ${s.radius} PT`.trim() : 'OFF', displays: s.builtInOnly ? 'BUILT-IN' : 'ALL' });
  const dds = Object.fromEntries([...plate.querySelectorAll('[data-k]')].map((d) => [d.dataset.k, d]));
  const last = {};
  const paintPlate = (s) => {
    for (const [k, t] of Object.entries(vals(s))) {
      const d = dds[k]; if (!d || last[k] === t) continue; const first = !(k in last); last[k] = t;
      d.classList.toggle('is-on', k === 'band' && s.on);
      if (first || isStill() || !window.ScrambleTextPlugin) d.textContent = t;
      else gsap.to(d, { duration: 0.3, scrambleText: { text: t, chars: 'ABCDEFGHIKLMNOPRSTUVWXYZ0123456789', speed: 1 }, overwrite: true });
    }
  };
  paintPlate(S.state);

  // focus pull: dim everything but the top-left corner (where the fillet lives)
  const pull = document.createElement('i'); pull.className = 'try__pull'; pull.setAttribute('aria-hidden', 'true'); glass.append(pull);

  offs.push(S.subscribe((s, ch) => {
    paintPlate(s);
    if (ch.has('builtInOnly') && isWide()) mirror.flash(s.builtInOnly ? 'Built-in display only' : 'All displays', 1200);
    if (isStill()) return;
    if (ch.has('on') && s.on) gsap.fromTo(box, { scale: 1 }, { keyframes: { scale: [1, 1.025, 1], easeEach: 'none' }, duration: 0.6, ease: lib.EASE.out, transformOrigin: '50% 0%', overwrite: true });
    if (ch.has('radius')) gsap.fromTo(pull, { opacity: 0 }, { keyframes: { opacity: [0, 1, 0] }, duration: 0.5, ease: 'sine.inOut', overwrite: true });
  }));
  let lastPreset = store.get().preset;
  offs.push(store.subscribe((s) => { if (s.preset !== lastPreset) { lastPreset = s.preset; mirror.flash('Wallpaper rotated', 1200); } }));

  // the site's menu bar follows the mirror's band while #try is on screen, and gets its own state back on the way out
  let saved = null, lastBand = store.get().band;
  const toHero = (v, d) => { gsap.killTweensOf(hero.state, 'band'); if (d && !isStill()) gsap.to(hero.state, { band: v, duration: d, ease: lib.EASE.out }); else hero.set({ band: v }); };
  offs.push(store.subscribe((s) => { if (s.band === lastBand) return; lastBand = s.band; if (saved != null) toHero(s.band); }));
  const follow = ScrollTrigger.create({ trigger: root, start: 'top 45%', end: 'bottom 55%', onToggle: ({ isActive }) => {
    if (isActive) { if (saved == null) saved = hero.state.band; toHero(store.get().band, 0.5); }
    else if (saved != null) { toHero(saved, 0.5); saved = null; }
  } });

  // nav icon → "#try" → highlight the switch
  const onHl = (e) => pop.highlight(e.detail?.name || 'switch');
  document.addEventListener('nt:highlight', onHl);

  // placement: the window hangs from the mirror's Notched icon, centred under it and kept inside the glass (not the bezel).
  // Scaled to the screen it sits on (340 pt on a 1512 pt screen, nudged up 15% to stay legible, floor .62).
  let mode = isWide() ? 'wide' : 'narrow', frame = matchMedia(FRAME).matches;
  const place = () => {
    if (mode === 'narrow') { wrap.style.setProperty('--pop-s', Math.min(1, wrap.clientWidth / 340).toFixed(4)); return; }
    const st = stage.getBoundingClientRect(), ir = icon.getBoundingClientRect(), mr = mb.getBoundingClientRect(), gr = glass.getBoundingClientRect();
    const inL = gr.left + glass.clientLeft, inR = inL + glass.clientWidth, inB = gr.top + glass.clientTop + glass.clientHeight, pt = glass.clientWidth / 1512;
    const top = mr.bottom + 6 * Math.max(pt, 0.5), h = popEl.offsetHeight || 610;
    let k = Math.min(1, Math.max(0.62, pt * 1.15));
    if (frame) k = Math.min(k, (inB - top - 10) / h);
    const ic = ir.left + ir.width / 2 - st.left, w = 340 * k, m = 8 * pt;
    const x = Math.max(inL - st.left + m, Math.min(ic - w / 2, inR - st.left - w - m));
    stage.style.setProperty('--pop-x', `${x}px`); stage.style.setProperty('--pop-y', `${top - st.top}px`);
    right.style.setProperty('--pop-k', k.toFixed(4));
    right.style.setProperty('--wire-x', `${ic - x}px`);
    right.style.setProperty('--wire-h', `${Math.max(4, top - ir.bottom)}px`);
  };
  const ro = new ResizeObserver(() => requestAnimationFrame(place));
  ro.observe(stage); ro.observe(popEl); ro.observe(box);
  place();
  stage.classList.add('is-open');

  // demo (once per page view): the mirror opens, the switch pulses, then the band drops out of the notch and STAYS.
  // Instant path: no "Processing…" wait (the visitor's own clicks still get the real sequence).
  let opened, open = () => {};
  opened = new Promise((r) => { open = r; });
  const bandItems = () => {
    const items = [...mirrorEl.querySelectorAll('.nt-band .nt-mb__l > *, .nt-band .nt-mb__r > *')];
    const cx = glass.getBoundingClientRect(); const c = cx.left + cx.width / 2;
    return items.map((n) => [n, Math.abs(n.getBoundingClientRect().left + n.offsetWidth / 2 - c)]).sort((a, b) => a[1] - b[1]).map((p) => p[0]);
  };
  const demoOn = async () => {
    S.set({ on: true });                                       // the switch flips (the popover syncs from the store)
    statusEl.textContent = 'Notch hidden. New wallpapers are handled automatically.';
    gsap.fromTo(bandItems(), { opacity: 0, y: -2 }, { opacity: 1, y: 0, duration: 0.24, stagger: 0.03, delay: 0.12, ease: 'power2.out', clearProps: 'opacity,transform' });
    await Promise.all([mirror, pop.preview].map((sc) => sc.setBand(1, { duration: 450, ease: 'out' })));
  };
  const demo = async () => {
    if (played) return; played = true;
    await opened;
    if (!touched) popEl.classList.add('is-turn');
    if (isStill()) return;
    await wait(420);
    if (touched || S.state.on) return;
    await demoOn();
  };

  let revealed = false;
  mm.add({ wide: WIDE, narrow: '(max-width: 899px)', frame: FRAME, still: MQ.still }, (c) => {
    const { wide, still } = c.conditions;
    mode = wide ? 'wide' : 'narrow'; frame = c.conditions.frame;
    mirror.setDisplays(wide ? 2 : 1, { duration: 0 });
    requestAnimationFrame(place);

    if (!revealed && !still && wide) {
      gsap.set(box, { clipPath: 'inset(0% 0% 100% 0%)' });
      gsap.set(popEl, { scaleY: 0.6, opacity: 0 });
      gsap.set(wire, { scaleY: 0 });
      stage.classList.remove('is-open');
      const tl = gsap.timeline({ paused: true, onComplete: () => { gsap.set(box, { clearProps: 'clipPath' }); open(); } })
        .to(box, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.6, ease: lib.EASE.sweep })
        .add(() => stage.classList.add('is-open'), 0.35)
        .to(wire, { scaleY: 1, duration: 0.2, ease: lib.EASE.out }, 0.35)
        .to(popEl, { scaleY: 1, opacity: 1, duration: 0.42, ease: lib.EASE.knob, clearProps: 'transform,opacity' }, 0.4);
      ScrollTrigger.create({ ...(frame ? { trigger: root, start: 'top 70%' } : { trigger: stage, start: 'top 80%' }), once: true, onEnter: () => { revealed = true; tl.play(); } });
    } else open();
    if (!played) ScrollTrigger.create({ ...(frame ? { trigger: root, start: 'top 35%' } : wide ? { trigger: stage, start: 'top 45%' } : { trigger: popEl, start: 'top 75%' }), once: true, onEnter: demo });

    return () => { stage.classList.add('is-open'); open(); };   // a rebuild mid-reveal leaves the mirror open, never hidden
  });

  return () => {
    mm.revert(); follow.kill(); ro.disconnect(); offs.forEach((f) => f());
    stage.removeEventListener('pointerdown', stop, true); root.removeEventListener('keydown', stop, true); root.removeEventListener('focusin', stop, true);
    if (saved != null) { toHero(saved, 0); saved = null; }
    document.removeEventListener('nt:highlight', onHl);
    look.removeEventListener('click', onLookClick); look.removeEventListener('keydown', onLookKey);
    pop.destroy(); mirror.destroy(); pull.remove(); root.classList.remove('is-vis');
    mirrorEl.className = 'try__screen'; gsap.set(box, { clearProps: 'all' }); mirrorEl.removeAttribute('style'); mirrorEl.removeAttribute('role'); mirrorEl.removeAttribute('aria-label');
    popEl.className = 'try__pop'; popEl.removeAttribute('style');
    stage.classList.remove('is-open');
  };
}
