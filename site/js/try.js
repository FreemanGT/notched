// #try (SPEC §5.3): "Go on. Flip it." The popover writes the site-wide settings; the mirror follows them, and while
// #try is on screen the site's own menu bar (stores.hero.band) follows the mirror's band. Layout is reserved in try.css.
export default function init(root, ctx) {
  const { gsap, ScrollTrigger, mm, MQ, settings, stores, lib, Component } = ctx;
  if (!Component) return;
  const $ = (s) => root.querySelector(s);
  const stage = $('[data-try-stage]'), box = $('[data-try-box]'), mirrorEl = $('[data-try-mirror]'), right = $('[data-try-right]'),
    wrap = $('[data-try-popwrap]'), popEl = $('[data-try-pop]'), wire = $('.try__wire'),
    plate = $('[data-try-plate]'), look = $('[data-try-look]');
  const S = settings, hero = stores.hero;

  // any real input in the section ends the demo flip and the "your turn" ring
  let touched = false;
  const onInput = (e) => { if (!e.isTrusted) return; touched = true; popEl.classList.remove('is-turn'); };
  const EVS = ['pointerdown', 'keydown', 'focusin'];
  EVS.forEach((t) => root.addEventListener(t, onInput, true));

  mm.add({ wide: '(min-width: 900px)', narrow: '(max-width: 899px)', frame: '(min-width: 1200px) and (min-height: 700px)', still: MQ.still }, (c) => {
    const { wide, frame, still } = c.conditions;
    let dead = false;
    const store = Component.createStore({ ...Component.SCREEN_DEFAULT, displays: wide ? 2 : 1 });
    const mirror = Component.createScreen(mirrorEl, { store, mode: 'display', interactive: true, parallax: wide, follow: true, settings: S, label: 'Notched, on a recreated screen' });
    const pop = Component.createPopover(popEl, { store: S, mirror, toast: wide ? null : (t) => lib.toast(t) });
    const sw = popEl.querySelector('.nt-pop__switch');
    const offs = [];
    const ring = document.createElement('span'); ring.className = 'try__turn'; ring.setAttribute('aria-hidden', 'true'); ring.innerHTML = '<b>your turn</b>'; sw.append(ring);

    // appearance: mono DARK | LIGHT under the window
    const btns = [...look.querySelectorAll('[data-look]')];
    const paintLook = (a) => btns.forEach((b) => { const on = b.dataset.look === a; b.setAttribute('aria-checked', on); b.tabIndex = on ? 0 : -1; });
    paintLook(S.state.appearance);
    const pickLook = (a, focus) => { S.set({ appearance: a }); pop.setAppearance(a); paintLook(a); if (focus) btns.find((b) => b.dataset.look === a).focus(); };
    const onLookClick = (e) => { const b = e.target.closest('[data-look]'); if (b) pickLook(b.dataset.look); };
    const onLookKey = (e) => { if (!/^Arrow/.test(e.key)) return; e.preventDefault(); pickLook(S.state.appearance === 'dark' ? 'light' : 'dark', true); };
    look.addEventListener('click', onLookClick); look.addEventListener('keydown', onLookKey);

    // live plate (ScrambleText 300 ms)
    const RN = { 10: 'SMALL', 14: 'MEDIUM', 20: 'LARGE' };
    const plateText = (s) => `BAND ${s.on ? 'ON' : 'OFF'} · CORNERS ${s.corners ? `${RN[s.radius] || ''} ${s.radius} PT`.trim() : 'OFF'} · DISPLAYS ${s.builtInOnly ? 'BUILT-IN' : 'ALL'}`;
    let lastPlate = '';
    const paintPlate = (s) => {
      const t = plateText(s); if (t === lastPlate) return; const first = !lastPlate; lastPlate = t;
      if (first || still || !window.ScrambleTextPlugin) { plate.textContent = t; return; }
      gsap.to(plate, { duration: 0.3, scrambleText: { text: t, chars: 'ABCDEFGHIKLMNOPRSTUVWXYZ0123456789', speed: 1 }, overwrite: true });
    };
    paintPlate(S.state);

    // focus pull: dim everything but the top-left corner (where the fillet lives)
    const glass = mirrorEl.querySelector('.nt-glass--main');
    const pull = document.createElement('i'); pull.className = 'try__pull'; pull.setAttribute('aria-hidden', 'true'); glass.append(pull);

    offs.push(S.subscribe((s, ch) => {
      paintPlate(s);
      if (ch.has('builtInOnly') && wide) mirror.flash(s.builtInOnly ? 'Built-in display only' : 'All displays', 1200);
      if (still) return;
      if (ch.has('on') && s.on) gsap.fromTo(box, { scale: 1 }, { keyframes: { scale: [1, 1.025, 1], easeEach: 'none' }, duration: 0.6, ease: lib.EASE.out, transformOrigin: '50% 0%', overwrite: true });
      if (ch.has('radius')) gsap.fromTo(pull, { opacity: 0 }, { keyframes: { opacity: [0, 1, 0] }, duration: 0.5, ease: 'sine.inOut', overwrite: true });
    }));
    let lastPreset = store.get().preset;
    offs.push(store.subscribe((s) => { if (s.preset !== lastPreset) { lastPreset = s.preset; mirror.flash('Wallpaper rotated', 1200); } }));

    // the site's menu bar follows the mirror's band while #try is on screen, and gets its own state back on the way out
    let saved = null, lastBand = store.get().band;
    const toHero = (v, d) => { gsap.killTweensOf(hero.state, 'band'); if (d && !still) gsap.to(hero.state, { band: v, duration: d, ease: lib.EASE.out }); else hero.set({ band: v }); };
    offs.push(store.subscribe((s) => { if (s.band === lastBand) return; lastBand = s.band; if (saved != null) toHero(s.band); }));
    ScrollTrigger.create({ trigger: root, start: 'top 45%', end: 'bottom 55%', onToggle: ({ isActive }) => {
      if (isActive) { if (saved == null) saved = hero.state.band; toHero(store.get().band, 0.5); }
      else if (saved != null) { toHero(saved, 0.5); saved = null; }
    } });

    // nav icon → "#try" → highlight the switch
    const onHl = (e) => pop.highlight(e.detail?.name || 'switch');
    document.addEventListener('nt:highlight', onHl);

    // placement: the window hangs from the mirror's Notched icon, centred under it and kept inside the screen.
    // In the composed frame it is scaled (transform only) so it fits inside the built-in display.
    const icon = glass.querySelector('.nt-mb__icon'), mb = glass.querySelector('.nt-mb');
    const place = () => {
      if (!wide) { wrap.style.setProperty('--pop-s', Math.min(1, wrap.clientWidth / 340).toFixed(4)); return; }
      const st = stage.getBoundingClientRect(), ir = icon.getBoundingClientRect(), mr = mb.getBoundingClientRect(), gr = glass.getBoundingClientRect();
      const top = mr.bottom + 6, k = frame ? Math.min(1, (gr.bottom - top - 14) / (popEl.offsetHeight || 610)) : 1;
      const ic = ir.left + ir.width / 2 - st.left, w = 340 * k;
      const x = Math.max(0, Math.min(ic - w / 2, gr.right - st.left - w - 10));
      stage.style.setProperty('--pop-x', `${x}px`); stage.style.setProperty('--pop-y', `${top - st.top}px`);
      right.style.setProperty('--pop-k', k.toFixed(4));
      right.style.setProperty('--wire-x', `${ic - x}px`);
      right.style.setProperty('--wire-h', `${Math.max(4, top - ir.bottom)}px`);
    };
    const ro = new ResizeObserver(() => requestAnimationFrame(place));
    ro.observe(stage); ro.observe(popEl); ro.observe(box);
    place();
    stage.classList.add('is-open');

    // demo: flip the switch once (the mirror and this page's menu bar go black), flip it back, then hand over
    const wait = (ms) => new Promise((r) => setTimeout(r, ms));
    let entered = Promise.resolve();
    const turn = () => { if (!touched && !dead) popEl.classList.add('is-turn'); };
    const demo = async () => {
      await entered;
      if (still) return turn();
      await wait(250);
      const from = !!S.state.on;
      for (const v of [!from, from]) { if (touched || dead) return; await pop.set({ on: v }); if (v !== from) await wait(800); }
      turn();
    };

    if (!still && wide) {
      gsap.set(box, { clipPath: 'inset(0% 0% 100% 0%)' });
      gsap.set(popEl, { scaleY: 0.6, opacity: 0 });
      gsap.set(wire, { scaleY: 0 });
      stage.classList.remove('is-open');
      const tl = gsap.timeline({ paused: true })
        .to(box, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.6, ease: lib.EASE.sweep })
        .add(() => stage.classList.add('is-open'), 0.35)
        .to(wire, { scaleY: 1, duration: 0.2, ease: lib.EASE.out }, 0.35)
        .to(popEl, { scaleY: 1, opacity: 1, duration: 0.42, ease: lib.EASE.knob, clearProps: 'transform,opacity' }, 0.4);
      entered = new Promise((r) => tl.eventCallback('onComplete', () => { gsap.set(box, { clearProps: 'clipPath' }); r(); }));
      ScrollTrigger.create({ ...(frame ? { trigger: root, start: 'top 80%' } : { trigger: stage, start: 'top 85%' }), once: true, onEnter: () => tl.play() });
    }
    ScrollTrigger.create({ ...(frame ? { trigger: root, start: 'top 15%' } : wide ? { trigger: stage, start: 'top 35%' } : { trigger: popEl, start: 'top 70%' }), once: true, onEnter: demo });

    return () => {
      dead = true;
      offs.forEach((f) => f()); ro.disconnect();
      if (saved != null) { toHero(saved, 0); saved = null; }
      document.removeEventListener('nt:highlight', onHl);
      look.removeEventListener('click', onLookClick); look.removeEventListener('keydown', onLookKey);
      pop.destroy(); mirror.destroy(); pull.remove();
      mirrorEl.className = 'try__screen'; gsap.set(box, { clearProps: 'all' }); mirrorEl.removeAttribute('style'); mirrorEl.removeAttribute('role'); mirrorEl.removeAttribute('aria-label');
      popEl.className = 'try__pop'; popEl.removeAttribute('style');
      stage.classList.remove('is-open');
    };
  });
  return () => { mm.revert(); EVS.forEach((t) => root.removeEventListener(t, onInput, true)); };
}
