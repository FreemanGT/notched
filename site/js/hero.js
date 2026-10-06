// #hero: "Black out the notch." (SPEC §5.1). Writes stores.hero.{band, progress, time}; the nav, bezel
// and fillets read them. Contract: FOUNDATION.md.
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const pad3 = (n) => String(n).padStart(3, '0');

export default function init(root, ctx) {
  const { gsap, SplitText, mm, MQ, settings, stores, lib, Component } = ctx;
  const store = stores.hero, html = document.documentElement;
  const $ = (s) => root.querySelector(s);
  const stage = $('.hero__stage'), content = $('.hero__content'), wall = $('.hero__wall');
  const word = $('[data-swallow]'), bar = $('.hero__bar'), cap = $('.hero__cap');
  const hint = $('.hero__hint'), toggle = $('[data-hero-toggle]');
  const notch = document.querySelector('[data-nav-notch]'), navEl = document.getElementById('nav');
  const offs = [];

  // The screen: wallpaper, parallax, aria state. Its menu bar/notch are drawn by the nav (hero.css hides them),
  // so the notch toys live on the nav notch below. ponytail: interactive:false, the screen's own hit sits under the nav.
  const screen = Component?.createScreen($('[data-hero-screen]'), { store, mode: 'viewport', interactive: false, parallax: true, follow: true, settings, clock: false, label: 'MacBook screen' });

  // ---- band = max(scroll, drag); time = page time, pulled to night by the scrub ----
  const P = { sb: 0, night: 0, r: 0 };
  let drag = 0, lastT = -1;
  const writeBand = () => store.set({ band: Math.max(P.sb, drag) });
  const writeTime = () => {
    const t0 = stores.time.state.t, d = 0.5 - ((t0 + 0.75) % 1);   // shortest step to night (.75); a half-turn goes forward (day → dusk → night)
    const t = (((t0 + P.night * d) % 1) + 1) % 1;
    if (Math.abs(t - lastT) > 4e-4) { lastT = t; store.set({ time: t }); }
    const ph = lib.phaseOf(t);
    if (root.dataset.phase !== ph) root.dataset.phase = ph;
  };
  offs.push(stores.time.subscribe(writeTime, { now: true }));

  // ---- spec plate (desk) ----
  const plate = { band: $('[data-plate="band"]'), corners: $('[data-plate="corners"]'), clock: $('[data-plate="clock"]') };
  let pb = -1, pbT = 0, pbTimer = 0;
  const phase = () => lib.phaseOf(store.state.time === 'local' ? stores.time.state.t : store.state.time).toUpperCase();
  const plateBand = () => {
    const v = Math.round(clamp(store.state.band) * 100);
    if (v === pb) return;
    const now = performance.now();
    clearTimeout(pbTimer);
    if (now - pbT < 90 && v !== 100 && v !== 0) { pbTimer = setTimeout(plateBand, 90); return; }   // rate-limit the roller
    pb = v; pbT = now; lib.roll(plate.band, `${pad3(v)}%`, { duration: 0.3 });
  };
  let pc = '', scrubR = null;
  const plateCorners = () => {
    const s = settings.state, r = scrubR == null ? (s.corners ? s.radius : 0) : scrubR, v = `${r ? `${r} PT` : 'OFF'} · ${phase()}`;
    if (v !== pc) { pc = v; lib.roll(plate.corners, v); }
  };
  offs.push(store.subscribe(() => { plateBand(); plateCorners(); syncToggle(); }, { now: true }));
  offs.push(settings.subscribe(plateCorners));
  offs.push(lib.onClock((t) => lib.roll(plate.clock, t.toUpperCase())));

  // ---- band on/off by hand (toggle, notch drag release, reduced notch click): the fillet tween ----
  // Turning it off also lowers the scroll's share (P.sb); the scrub takes it back on the next scroll past the sweep.
  const dragO = { v: 0 };
  function setBand(on) {
    dropHint();
    gsap.killTweensOf(dragO);
    const to = on ? 1 : 0, write = (v) => { drag = clamp(v); if (!on) P.sb = Math.min(P.sb, drag); writeBand(); };
    if (lib.reduced()) { dragO.v = to; write(to); return; }
    dragO.v = clamp(store.state.band);
    gsap.to(dragO, { v: to, duration: on ? 0.52 : 0.6, ease: on ? lib.EASE.fillet : lib.EASE.swallow,
      onUpdate: () => write(dragO.v), onComplete: () => { if (on) { toasted = false; hidden(); } } });
  }

  // ---- drag hint: attached to the notch from frame 1, gone for good after the first drag or toggle ----
  function dropHint() {
    if (!hint?.isConnected) return;
    gsap.to(hint, { autoAlpha: 0, duration: 0.3, onComplete: () => hint.remove() });
  }

  // ---- the notch as an object (the nav's notch is this screen's notch) ----
  let toasted = false;
  const hidden = () => { if (!toasted) { toasted = true; lib.toast('Notch hidden.'); } };
  if (notch) {
    notch.style.touchAction = 'none';   // shared node: only enables touch drag
    notch.style.cursor = 'grab';
    let y0 = null, d0 = 0, moved = false, swallowClick = false;
    const mb = () => document.getElementById('nav')?.offsetHeight || 37;
    // A pull on a black band replays the black-out from 0 (the pull is the scrub).
    const down = (e) => { y0 = e.clientY; d0 = clamp(store.state.band); if (d0 >= 0.999) d0 = 0; moved = false; notch.setPointerCapture?.(e.pointerId); };
    const move = (e) => {
      if (y0 == null) return;
      const dy = e.clientY - y0;
      if (Math.abs(dy) > 4) moved = true;
      if (!moved || lib.reduced()) return;
      let p = d0 + dy / (3 * mb());
      if (p > 1) p = 1 + Math.sqrt(p - 1) * 0.08;
      p = Math.max(0, p);
      gsap.killTweensOf(dragO); intro?.kill();
      drag = dragO.v = clamp(p); P.sb = Math.min(P.sb, drag); writeBand();
      gsap.set(notch, { xPercent: -50, x: 0, scaleX: 1 - 0.08 * clamp(p), scaleY: 1 + 0.3 * clamp(p), transformOrigin: '50% 0' });
      dropHint();
    };
    const up = () => {
      if (y0 == null) return;
      y0 = null;
      if (!moved) return;
      swallowClick = true; setTimeout(() => { swallowClick = false; }, 0);
      gsap.to(notch, { scaleX: 1, scaleY: 1, duration: 0.26, ease: 'back.out(2)' });
      if (!lib.reduced()) setBand(drag > 0.4);
    };
    // A drag is not a click: stop the nav's blink/toast handler before it sees the click.
    const click = (e) => {
      if (swallowClick && notch.contains(e.target)) { e.stopPropagation(); e.preventDefault(); return; }
      if (lib.reduced() && notch.contains(e.target)) setBand(store.state.band < 0.5);
    };
    notch.addEventListener('pointerdown', down);
    notch.addEventListener('pointermove', move);
    notch.addEventListener('pointerup', up);
    notch.addEventListener('pointercancel', up);
    document.addEventListener('click', click, true);
    offs.push(() => {
      notch.removeEventListener('pointerdown', down); notch.removeEventListener('pointermove', move);
      notch.removeEventListener('pointerup', up); notch.removeEventListener('pointercancel', up);
      document.removeEventListener('click', click, true);
    });
  }

  // ---- "Show the notch" / "Hide the notch": the keyboard/click path to the same black-out, every motion mode ----
  function syncToggle() {
    const v = clamp(store.state.band) >= 0.5 ? 'Show the notch' : 'Hide the notch';
    if (toggle && toggle.textContent !== v) toggle.textContent = v;
  }
  toggle?.addEventListener('click', () => { intro?.kill(); setBand(store.state.band < 0.5); });

  // ---- intro (SPEC §4.3, round 1): the black-out IS the intro. Hold ~0.5 s on the light bar (notch sticking out),
  // then the band spills from the notch both ways (nav bandText, origin centre), text goes white, rim dissolves,
  // fillets land at band-on (base.css), BAND plate counts 0→100. The headline lands after (hero.css, .is-intro).
  // Any input finishes it at once.
  let intro = null;
  const full = html.classList.contains('intro--full'), quick = html.classList.contains('intro--quick');
  if ((full || quick) && !lib.reduced()) {
    if (full) root.classList.add('is-intro');
    dragO.v = 0;
    intro = gsap.to(dragO, { v: 1, duration: full ? 0.8 : 0.4, delay: full ? Math.max(0, 1.75 - performance.now() / 1000) : 0, ease: lib.EASE.sweep,
      onUpdate: () => { drag = clamp(dragO.v); writeBand(); }, onComplete: () => gsap.delayedCall(0.6, dropHint) });
    const skip = () => { if (intro?.isActive() || intro?.progress() === 0) intro.progress(1); root.classList.remove('is-intro'); };
    const evs = ['pointerdown', 'keydown', 'wheel', 'touchstart'];
    evs.forEach((t) => addEventListener(t, skip, { once: true, passive: true }));
    offs.push(() => { intro?.kill(); evs.forEach((t) => removeEventListener(t, skip)); });
  }

  // ---- "Try the switch" ----
  root.querySelector('a[href="#try"]')?.addEventListener('click', (e) => {
    const t = document.getElementById('try'); if (!t) return;
    e.preventDefault(); t.scrollIntoView({ behavior: lib.reduced() ? 'auto' : 'smooth' });
    document.dispatchEvent(new CustomEvent('nt:highlight', { detail: { name: 'switch' } }));
  });

  // ---- the scroll ----
  mm.add(MQ, (c) => {
    const { desk, still } = c.conditions;
    if (still) {
      P.sb = 1; P.night = 0; drag = 1;
      store.set({ band: 1, progress: 1 });
      screen?.setRadius(settings.state.radius, { duration: 0 });
      writeTime(); syncToggle();
      return;
    }

    // Swallow targets: desk splits the chars; phones swallow the whole word. Deltas are layout offsets
    // (transform-free) from the stage, to the notch's centre, recomputed on every refresh.
    const split = desk ? SplitText.create(word, { type: 'chars', charsClass: 'hero__ch', aria: 'none' }) : null;
    const parts = split ? split.chars : [word];
    const fixWidths = () => parts.forEach((el) => { el.style.width = ''; el.style.width = `${el.offsetWidth}px`; });
    fixWidths();   // wdth 100→75 must not reflow the line: the bar and the period hold their places
    const centre = (el) => {
      let x = el.offsetWidth / 2, y = el.offsetHeight / 2, n = el;
      while (n && n !== stage) { x += n.offsetLeft; y += n.offsetTop; n = n.offsetParent; }
      return { x, y };
    };
    const notchY = () => (notch?.offsetHeight || 32) / 2;
    const dx = (el) => stage.clientWidth / 2 - centre(el).x;
    const dy = (el) => notchY() - centre(el).y;

    const tl = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: { trigger: root, start: 'top top', end: 'bottom bottom', scrub: 0.5, invalidateOnRefresh: true, onRefreshInit: fixWidths, onRefresh: () => requestAnimationFrame(tick) },
      onUpdate: tick,
    });

    // Round 2 beats (desk + mob, one timeline):
    // .00 → .04  the hint steps aside
    // .04 → .22  band 0→1 (if a toggle turned it off) and, at the same speed, the redaction bar sweeps across "notch"; it stays
    // .06 → .30  corners 0 → 14 pt (Medium)
    // .28 → .46  the letters lift out of the bar and drop up into the camera housing; the housing gulps them
    // .46 → .58  the caption sweeps open: "Gone. Well, it's still there. You just can't see it."
    // .50 → .66  corners 14 → 20 pt (Large)
    // .10 → .80  the light runs on to night (shortest way round from the visitor's time)
    // .55 → .92  the camera pulls back: the full-bleed wallpaper becomes a framed screen under the black bar
    const SWEEP = 0.04, LIFT = 0.28, GULP = 0.46;
    if (hint) tl.to(hint, { opacity: 0, duration: 0.04 }, 0);
    tl.to(P, { sb: 1, duration: 0.18, ease: lib.EASE.sweep }, SWEEP)
      .fromTo(bar, { clipPath: 'inset(0% 100% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.18, ease: lib.EASE.sweep }, SWEEP)
      .to(P, { r: 14, duration: 0.24, ease: lib.EASE.fillet }, 0.06)
      .to(P, { r: 20, duration: 0.16, ease: lib.EASE.fillet }, 0.5)
      .to(P, { night: 1, duration: 0.7, ease: 'power1.inOut' }, 0.1);

    // the letters sit under the bar (z below it): they rise out of its top edge, pinch into slivers, and are pulled into the housing
    parts.forEach((el, i) => {
      const at = LIFT + Math.abs(i - (parts.length - 1) / 2) * (desk ? 0.008 : 0);
      tl.fromTo(el, { fontVariationSettings: '"opsz" 96, "wdth" 100' }, { fontVariationSettings: '"opsz" 96, "wdth" 75', scaleY: 0.3, scaleX: 0.5, duration: 0.07, ease: 'power2.out', immediateRender: false }, at + 0.03)
        .to(el, { x: () => dx(el), y: () => dy(el), duration: GULP - 0.012 - at, ease: 'power2.in' }, at)
        .to(el, { opacity: 0, duration: 0.012 }, GULP - 0.014);
    });
    if (notch) tl.to(notch, { scaleX: 1.3, scaleY: 1.18, transformOrigin: '50% 0', duration: 0.02, ease: 'power2.out' }, GULP - 0.006)
      .to(notch, { scaleX: 1, scaleY: 1, duration: 0.05, ease: 'back.out(2.6)' }, GULP + 0.014);
    tl.fromTo(cap, { clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0% 0 0)', duration: 0.12, ease: lib.EASE.sweep }, GULP);

    // the pull-back (Apple's scale-out beat): the wallpaper shrinks about the band line, its rim lights, the far ridges settle
    const S = desk ? 0.8 : 0.88;
    root.querySelectorAll('.hero__ridge').forEach((r, i) => tl.to(r, { yPercent: -(i + 1) * 1.6, duration: 0.8 }, 0.1));
    tl.fromTo(wall, { scale: 1, '--pull': 0 }, { scale: S, '--pull': 1, duration: 0.37, ease: 'power2.inOut' }, 0.55)
      .fromTo($('.hero__dim'), { opacity: 0 }, { opacity: 0.18, duration: 0.37 }, 0.55)
      .fromTo($('.hero__spill'), { opacity: 0.22 }, { opacity: 0.1, duration: 0.25 }, 0.67)
      .to(content, { y: () => -0.06 * innerHeight, duration: 0.25 }, 0.75)
      // the poster at 1 keeps "Black out / the ████." and the caption; the rest steps back
      .to(root.querySelectorAll('.hero__chips, .hero__toggle, .hero__lede, .hero__actions, .hero__note, .hero__plate'), { opacity: 0, duration: 0.1 }, 0.9);

    let past = false, navOwned = null;
    function tick() {
      // A refresh reverts tl to 0 to measure and restores it silently: writing that 0 would leave the global bar grey.
      if (ctx.ScrollTrigger.isRefreshing) return;
      const p = tl.progress();
      store.set({ band: Math.max(P.sb, drag), progress: p });
      writeTime();
      // .50: threshold, both ways, not scrubbed. Nav scrambles itself from band/progress.
      if (p >= GULP && !past) { past = true; hidden(); }
      else if (p < GULP && past) past = false;
      // corners: the wallpaper's own fillets carry the scrub; the nav's stay at 0 until the hero is done (then settings.radius)
      const r = Math.round(P.r * 10) / 10;
      root.style.setProperty('--hr', r);
      const own = p < 0.999;
      if (navEl && own !== navOwned) { navOwned = own; own ? navEl.style.setProperty('--r-site-pt', '0') : navEl.style.removeProperty('--r-site-pt'); }
      const rr = p < 0.999 ? (P.r < 7 ? 0 : P.r < 17 ? 14 : 20) : null;
      if (rr !== scrubR) { scrubR = rr; plateCorners(); }
    }
    tick();

    return () => { split?.revert(); gsap.set([bar, word], { clearProps: 'all' }); if (notch) gsap.set(notch, { scaleX: 1, scaleY: 1 }); navEl?.style.removeProperty('--r-site-pt'); root.style.removeProperty('--hr'); scrubR = null; past = false; };
  });

  return () => { offs.forEach((f) => f()); screen?.destroy?.(); mm.revert(); };
}
