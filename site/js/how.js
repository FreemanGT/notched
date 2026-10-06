// #how (SPEC §5.5): "It's just a picture." Contract: FOUNDATION.md.
// Desk: CSS 3D exploded view, scrubbed through --o orbit, --sep separation, --push dolly, --rim notch outline (all on .how__scene) + per-tag draw.
// Mobile / reduced: one interleaved column joined by a scroll-drawn line (CSS does the layout).
export default function init(root, ctx) {
  const { gsap, ScrollTrigger, mm, MQ, Component, lib } = ctx;
  const $$ = (s) => [...root.querySelectorAll(s)];
  const grid = root.querySelector('.how__grid'), view = root.querySelector('.how__view'), scene = root.querySelector('.how__scene');
  const planes = $$('.how__plane'), tags = $$('.how__tag'), lines = $$('.how__leaders line'), dots = $$('.how__dot'), steps = $$('.how__step');
  const stampBox = root.querySelector('.how__stamp'), stamp = stampBox.querySelector('span'), STAMP = stamp.textContent;
  const slabs = $$('.how__slab'), strip = root.querySelector('.how__plane--strip');
  const flashes = $$('.how__flash');
  const E = lib.EASE;

  // Static day paints: no loops (SPEC §8 budget: 4 static paints).
  if (Component) $$('[data-wp]').forEach((el) => Component.paintWallpaper(el, { preset: 'hills', time: 0.25 }));

  const scramble = () => {
    if (lib.reduced() || !gsap.plugins?.scrambleText) { stamp.textContent = STAMP; return; }
    gsap.to(stamp, { duration: 0.9, scrambleText: { text: STAMP, chars: '▮▯·', speed: 0.6 }, overwrite: true });
  };

  const flash = (el) => gsap.fromTo(el, { opacity: 0.9 }, { opacity: 0, duration: 0.22, ease: 'power2.out', overwrite: true });

  // Mobile + reduced: the joining line spans first step → last plane.
  const measureLine = () => {
    const top = steps[0].offsetTop, last = planes[3];
    grid.style.setProperty('--l0', `${top}px`);
    grid.style.setProperty('--lh', `${last.offsetTop + last.offsetHeight - top}px`);
  };

  mm.add(MQ, (c) => {
    const { desk, still, hover } = c.conditions;

    if (still || !desk) {
      const ro = new ResizeObserver(measureLine); ro.observe(grid); measureLine();
      if (still) { stamp.textContent = STAMP; return () => ro.disconnect(); }
      // mobile: line draws with scroll, planes rise, steps light, notch dissolves, stamp fades in
      gsap.fromTo(grid, { '--draw': 0 }, { '--draw': 1, ease: 'none', scrollTrigger: { trigger: grid, start: 'top 65%', end: 'bottom 75%', scrub: 0.4 } });
      planes.forEach((p) => gsap.from(p, { y: 56, opacity: 0, duration: 0.9, ease: E.out, scrollTrigger: { trigger: p, start: 'top 94%', once: true } }));
      steps.forEach((s) => ScrollTrigger.create({ trigger: s, start: 'top 72%', toggleClass: 'is-on' }));
      // the finished desktop's notch outline dissolves into the band as it crosses mid-screen
      gsap.fromTo(planes[3], { '--rim': 1 }, { '--rim': 0, ease: 'none', scrollTrigger: { trigger: planes[3], start: 'top 55%', end: 'top 20%', scrub: 0.4 } });
      // the stamp wraps on narrow phones: fade it in rather than scramble (a growing text would shift layout)
      gsap.from(stampBox, { opacity: 0, y: 12, duration: 0.6, ease: E.out, scrollTrigger: { trigger: stampBox, start: 'top 92%', once: true } });
      // 02: the band drops onto the copy (accelerating, scrubbed) and the card flashes white for a frame when it lands
      let landed = false;
      const drop = gsap.fromTo(slabs[0], { yPercent: -150 }, { yPercent: 0, ease: 'power2.in', scrollTrigger: { trigger: strip, start: 'top 88%', end: 'top 52%', scrub: 0.3 },
        onUpdate() { const p = this.progress(); if (!landed && p > 0.995) { landed = true; flash(flashes[1]); } else if (p < 0.9) landed = false; } });
      return () => { ro.disconnect(); drop.scrollTrigger?.kill(); drop.kill(); gsap.set(slabs[0], { clearProps: 'transform' });
        stamp.textContent = STAMP; grid.style.removeProperty('--draw'); planes[3].style.removeProperty('--rim'); };
    }

    // ---------------------------------------------------------------- desk
    const st = { o: 0, sep: 0, bake: 0, push: 0, rim: 1 }, VARS = Object.keys(st), d = tags.map(() => ({ v: 0 }));
    let baked = false, done = false, active = -2, hot = -1, tl = null;
    planes.forEach((p) => p.setAttribute('aria-pressed', 'false'));
    stamp.textContent = '';

    // Tags float at their plane's anchor height (kept ≥ 44px apart), leaders run anchor → tag.
    function layout() {
      const v = view.getBoundingClientRect();
      const a = dots.map((dot) => { const r = dot.getBoundingClientRect(); return [r.left + r.width / 2 - v.left, r.top + r.height / 2 - v.top]; });
      const y = a.map((p) => p[1] - 8);
      for (let i = 2; i >= 0; i--) y[i] = Math.max(y[i], y[i + 1] + 44);   // tag 4 is topmost
      tags.forEach((t, i) => {
        t.style.transform = `translate3d(0,${y[i].toFixed(1)}px,0)`;
        const x2 = t.offsetLeft - 4, y2 = y[i] + 8.5, ln = lines[i];
        ln.setAttribute('x1', a[i][0].toFixed(1)); ln.setAttribute('y1', a[i][1].toFixed(1));
        ln.setAttribute('x2', x2.toFixed(1)); ln.setAttribute('y2', y2.toFixed(1));
      });
    }

    function render() {
      for (const k of VARS) scene.style.setProperty(`--${k}`, st[k].toFixed(4));
      d.forEach(({ v }, i) => {
        tags[i].style.opacity = v;
        tags[i].style.clipPath = `inset(0 ${((1 - v) * 100).toFixed(1)}% 0 0)`;
        lines[i].style.strokeDashoffset = (1 - v).toFixed(3);
        dots[i].style.opacity = Math.min(1, v * 2);
      });
      if (st.sep > 0.01 || d.some((x) => x.v > 0)) layout();
      const p = tl ? tl.progress() : 0;
      // spread: copy+original = 01, strip = 02, desk = 03. Fold replays it: bake = 02, collapse = 03, notch gone = 04.
      const n = d.filter((x) => x.v > 0.5).length;
      const on = p >= 0.84 ? 3 : p >= 0.69 ? 2 : p >= 0.56 ? 1 : [-1, 0, 0, 1, 2][n];
      if (on !== active) { active = on; steps.forEach((s, k) => s.classList.toggle('is-on', k === on)); }
      if (baked !== st.bake > 0.98) { baked = !baked; if (baked) { flash(flashes[0]); gsap.fromTo(slabs[0], { opacity: 1 }, { keyframes: [{ opacity: 0.5, duration: 0.05 }, { opacity: 1, duration: 0.07 }], ease: 'none', overwrite: true }); } }
      if (!done && p >= 0.93) { done = true; stampBox.style.opacity = 1; scramble(); }
      else if (done && p < 0.9) { done = false; gsap.killTweensOf(stamp); stamp.textContent = ''; stampBox.style.opacity = 0; }
    }

    tl = gsap.timeline({
      defaults: { ease: 'none' }, onUpdate: render,
      scrollTrigger: { trigger: root, start: 'top top', end: 'bottom bottom', scrub: 0.4, onToggle: (self) => root.classList.toggle('is-live', self.isActive) },
    });
    tl.to(st, { o: 1, sep: 1, duration: 0.33, ease: E.inOut }, 0.1);            // orbit + separate
    d.forEach((x, i) => tl.to(x, { v: 1, duration: 0.07 }, 0.22 + i * 0.06));  // tags draw in sequence
    tl.to(d, { v: 0, duration: 0.05 }, 0.55);                                   // leaders retract
    tl.to(st, { bake: 1, duration: 0.08, ease: 'power4.in' }, 0.6);             // the band falls onto the copy, hard (flash on landing)
    tl.to(st, { o: 0, sep: 0, duration: 0.15, ease: E.inOut }, 0.69);           // the stack folds; the composite fills the desk plane
    tl.to(st, { push: 1, duration: 0.12, ease: E.inOut }, 0.82);                // last beat: dolly into the notch…
    tl.to(st, { rim: 0, duration: 0.1 }, 0.84);                                 // …and its outline dissolves into the band
    tl.set({}, {}, 1);                                                          // pad to 1 (hold on the finished desktop)

    // Toy: hovered/focused plane lifts +40px (CSS, knob ease). Keep leaders glued while it moves.
    let until = 0, raf = 0;
    const follow = () => { layout(); if (performance.now() < until) raf = requestAnimationFrame(follow); else raf = 0; };
    const kick = (i) => (on) => {
      hot = on ? i : hot === i ? -1 : hot;
      tags.forEach((t, k) => t.classList.toggle('is-hot', k === hot || planes[k].getAttribute('aria-pressed') === 'true'));
      until = performance.now() + 650; if (!raf) raf = requestAnimationFrame(follow);
    };
    const offs = [];
    planes.forEach((p, i) => {
      const k = kick(i);
      const enter = () => k(true), leave = () => k(false);
      const click = () => { p.setAttribute('aria-pressed', p.getAttribute('aria-pressed') === 'true' ? 'false' : 'true'); k(true); };
      const evs = [['focus', enter], ['blur', leave], ['click', click]];
      if (hover) evs.push(['pointerenter', enter], ['pointerleave', leave]);
      evs.forEach(([e, f]) => p.addEventListener(e, f));
      offs.push(() => evs.forEach(([e, f]) => p.removeEventListener(e, f)));
    });
    const onResize = () => { if (st.sep > 0.01) layout(); };
    addEventListener('resize', onResize);
    render();

    return () => {
      offs.forEach((f) => f()); removeEventListener('resize', onResize); cancelAnimationFrame(raf);
      root.classList.remove('is-live'); VARS.forEach((k) => scene.style.removeProperty(`--${k}`));
      planes.forEach((p) => p.removeAttribute('aria-pressed'));
      tags.forEach((t) => { t.style.opacity = t.style.clipPath = t.style.transform = ''; t.classList.remove('is-hot'); });
      dots.forEach((x) => (x.style.opacity = '')); lines.forEach((l) => (l.style.strokeDashoffset = ''));
      stampBox.style.opacity = ''; stamp.textContent = STAMP; steps.forEach((s) => s.classList.remove('is-on'));
      gsap.set([...slabs, ...flashes], { clearProps: 'opacity' });
    };
  });
}
