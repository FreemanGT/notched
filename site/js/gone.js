// #gone: the manifesto (SPEC §5.2). Each line of each paragraph is inked by a bandText reading band
// (origin left, p 0→1, sweep) scrubbed over the section. "black" gets its pill and "Flip one switch."
// its underline as the band passes them. Behind the copy, the zoomed menu bar (--k) darkens with every
// inked line and is #000 exactly when "black" inks; the notch's rim then wipes up into the bezel while
// "notch was all along." inks. Reduced motion: CSS shows the finished poster; nothing runs.
import { bandText } from './lib/bandtext.js';
import { splitLines } from './lib/split.js';
import { EASE } from './lib/motion.js';

export default function init(root, ctx) {
  const { gsap, mm, MQ } = ctx;
  const ps = [...root.querySelectorAll('.gone__p')];
  const land = root.querySelector('.gone__land');
  const notch = root.querySelector('.gone__notch'), rims = root.querySelectorAll('.gone__rim, .gone__lens');
  const setK = (k) => root.style.setProperty('--k', k.toFixed(3));
  // r 0..1: the rim fades and is wiped up into the bezel (the fill goes too; the bar is black by then)
  const setR = (r) => {
    rims.forEach((n) => { n.style.opacity = (1 - r).toFixed(3); });
    notch.style.clipPath = `inset(0 0 ${(r * 100).toFixed(2)}% 0)`;
  };

  mm.add(MQ, (c) => {
    const { still, mob } = c.conditions;
    if (still) return;
    root.classList.add('is-live');
    let tl, queued = false;
    // the hero's hills sink and darken into the bezel while the section slides up (no dead black frame)
    const sink = gsap.fromTo(land, { yPercent: 0, scaleY: 1, opacity: 1 }, { yPercent: 55, scaleY: .55, opacity: 0, ease: 'none',
      scrollTrigger: { trigger: root, start: 'top bottom', end: 'top 15%', scrub: .4 } });

    const build = () => {
      queued = false;
      tl?.scrollTrigger?.kill(); tl?.kill();
      root.querySelectorAll('.bandtext').forEach((n) => n.remove());   // a rebuild without a re-split must not stack overlays
      root.classList.remove('is-pill', 'is-link');
      const lines = [];
      splits.forEach((s, pi) => s.lines.forEach((ln) => lines.push({ ln, pi })));
      if (!lines.length) return;
      // thresholds: fraction of a line the band has covered when it passes the target's right edge
      const at = (ln, el) => {
        const r = ln.getBoundingClientRect();
        return r.width ? (el.getBoundingClientRect().right - r.left) / r.width + .01 : 1;
      };
      let pillLine = -1, pillAt = 1, linkLine = -1, linkAt = 1;
      const meta = lines.map(({ ln, pi }, i) => {
        // SplitText's deepSlice leaves empty fragments of nested elements (an empty, focusable <a>): drop them
        ln.querySelectorAll('.gone__link, .gone__pill').forEach((n) => { if (!n.textContent.trim()) n.remove(); });
        const pill = ln.querySelector('.gone__pill'), link = ln.querySelector('.gone__link');
        if (pill) { pillLine = i; pillAt = at(ln, pill); }
        if (link) { linkLine = i; linkAt = at(ln, link); }
        return { ln, pi, w: ln.offsetWidth, band: bandText(ln, { origin: 'left' }) };
      });
      const avg = meta.reduce((a, m) => a + m.w, 0) / meta.length || 1;
      // the bar darkens one share per inked line and reaches #000 exactly as "black" inks
      const kSpan = pillLine >= 0 ? pillLine + pillAt : meta.length;
      setK(0); setR(0);
      tl = gsap.timeline({
        defaults: { ease: EASE.sweep },
        scrollTrigger: { trigger: root, start: mob ? 'top 55%' : 'top 50%', end: 'bottom bottom', scrub: .4 },
      });
      let t = .4;
      meta.forEach((m, i) => {
        const o = { p: 0 }, dur = Math.max(.45, m.w / avg);
        tl.to(o, {
          p: 1, duration: dur,
          onUpdate() {
            const p = o.p;
            m.band.set(p);
            m.ln.style.setProperty('--x', `${(p * m.w).toFixed(1)}px`);
            m.ln.style.setProperty('--c', Math.max(0, Math.min(1, p * 7, (1 - p) * 7)).toFixed(3));
            if (pillLine < 0 || i <= pillLine) setK(Math.min(1, (i + Math.min(p, i === pillLine ? pillAt : 1)) / kSpan));
            if (i === pillLine) { root.classList.toggle('is-pill', p >= pillAt); setR(Math.max(0, (p - pillAt) / (1 - pillAt || 1)) * .35); }
            if (i === pillLine + 1 && pillLine >= 0) setR(.35 + .65 * p);
            if (i === linkLine) root.classList.toggle('is-link', p >= linkAt);
          },
        }, t);
        t += dur + (meta[i + 1] && meta[i + 1].pi !== m.pi ? .5 : .06);
      });
      tl.to({}, { duration: t * .1 }, t);   // hold the inked poster before the stage lets go
    };
    const queue = () => { if (!queued) { queued = true; queueMicrotask(build); } };
    // keyboard: tabbing into a still-ghosted line jumps the track to its end so focus lands on inked copy (as #download)
    const onFocus = () => { const st = tl?.scrollTrigger; if (st && st.progress < 0.9) window.scrollTo(0, st.end); };
    root.addEventListener('focusin', onFocus);

    // the link's paragraph keeps its lines exposed to AT (a focusable link can't sit in aria-hidden)
    const splits = ps.map((p) => splitLines(p, { mask: false, onSplit: queue, ...(p.querySelector('a') ? { aria: 'none' } : {}) }));
    queue();

    return () => {
      root.removeEventListener('focusin', onFocus);
      tl?.scrollTrigger?.kill(); tl?.kill(); sink.scrollTrigger?.kill(); sink.kill();
      gsap.set([land, notch, ...rims], { clearProps: 'all' });
      root.style.removeProperty('--k');
      splits.forEach((s) => s.revert());
      root.classList.remove('is-live', 'is-pill', 'is-link');
    };
  });
  return () => mm.revert();
}
