// #privacy (SPEC §5.6). The notch hangs from the black above, spreads into the band, the concave fillets step 10/14/20 pt;
// then each statement row is swept into a full-width black menu bar.
export default function init(root, ctx) {
  const { gsap, mm, MQ, lib } = ctx;
  const strip = root.querySelector('.pv__strip');
  const rv = root.querySelector('.pv__rv');
  const rows = [...root.querySelectorAll('.pv__row')];
  const lede = root.querySelector('.pv__lede');
  // WallpaperManager radii 10 / 14 / 20 pt; --rmax is 20 pt, so the scale is r / 20.
  const STEPS = [[0, ''], [.5, '10 PT · SMALL'], [.7, '14 PT · MEDIUM'], [1, '20 PT · LARGE']];

  mm.add(MQ, (c) => {
    if (c.conditions.still) { strip.style.setProperty('--pv-s', 1); strip.style.setProperty('--pv-x', 1); rv.textContent = STEPS[3][1]; return; }

    // Transition in: the band draws out from the centre, then the corners click Small → Medium → Large like the
    // app's segmented control: each step springs (fillet ease overshoots, like the app's corner spring).
    const k = { s: 0 };
    let cur = -1, tw;
    const paintS = () => strip.style.setProperty('--pv-s', Math.max(0, k.s).toFixed(4));
    const step = (i) => {
      if (i === cur) return;
      cur = i;
      if (STEPS[i][1]) rv.textContent = STEPS[i][1];
      strip.style.setProperty('--pv-o', i ? 1 : 0);
      tw?.kill();
      tw = gsap.to(k, { s: STEPS[i][0], duration: i ? .6 : .2, ease: i ? lib.EASE.fillet : 'power2.in', onUpdate: paintS });
    };
    const out = gsap.parseEase(lib.EASE.out);
    // Notch alone (0–.2), band spreads out of it (.2–.55), corners click in (.6 / .72 / .86).
    const setP = (p) => {
      strip.style.setProperty('--pv-x', out(Math.min(1, Math.max(0, (p - .2) / .35))).toFixed(4));
      step(p < .6 ? 0 : p < .72 ? 1 : p < .86 ? 2 : 3);
    };
    k.s = 0; paintS(); setP(0);
    const st0 = gsap.timeline({ scrollTrigger: { trigger: root, start: 'top bottom', end: 'top 30%', scrub: true,
      onUpdate: (st) => setP(st.progress) } });

    // Statements: hairline draws, then the row becomes a menu bar: black sweeps left → right, letters and status flip white.
    const bands = rows.map((row) => {
      const rule = row.querySelector('.pv__rule');
      const bt = lib.bandText(row, { origin: 'left' });
      const k = { p: 0 };
      bt.set(0);
      gsap.timeline({ defaults: { ease: 'none' },
        scrollTrigger: { trigger: row, start: 'top 75%', end: 'top 45%', scrub: true } })
        .fromTo(rule, { scaleX: 0 }, { scaleX: 1, duration: .45, ease: lib.EASE.out }, 0)
        .to(k, { p: 1, duration: 1, ease: lib.EASE.sweep, onUpdate: () => bt.set(k.p) }, 0);
      return bt;
    });

    // Lede rises line by line once.
    const split = lib.splitLines(lede, { onSplit: (s) => gsap.from(s.lines, {
      yPercent: 105, duration: lib.DUR.reveal, ease: lib.EASE.out, stagger: .06,
      scrollTrigger: { trigger: lede, start: 'top 85%', once: true } }) });

    return () => { tw?.kill(); st0.kill(); bands.forEach((b) => b.destroy()); split.revert(); };
  });
}
