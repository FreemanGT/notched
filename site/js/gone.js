// #gone: the manifesto (SPEC §5.2). Each line of each paragraph is inked by a bandText reading band
// (origin left, p 0→1, sweep) scrubbed over the section. "black" gets its pill and "Flip one switch."
// its underline as the band passes them. Reduced motion: CSS shows the finished poster; nothing runs.
import { bandText } from './lib/bandtext.js';
import { splitLines } from './lib/split.js';
import { EASE } from './lib/motion.js';

export default function init(root, ctx) {
  const { gsap, mm, MQ } = ctx;
  const ps = [...root.querySelectorAll('.gone__p')];
  const stage = root.querySelector('.gone__stage'), land = root.querySelector('.gone__land');
  const housing = root.querySelector('.gone__housing'), leak = root.querySelector('.gone__leak'), beam = root.querySelector('.gone__beam');

  mm.add(MQ, (c) => {
    const { still, mob } = c.conditions;
    if (still) return;
    root.classList.add('is-live');
    let tl, queued = false;
    // the hero's hills sink and darken into the bezel while the section slides up (no dead black frame)
    const sink = gsap.fromTo(land, { yPercent: 0, scaleY: 1, opacity: 1 }, { yPercent: 55, scaleY: .55, opacity: 0, ease: 'none',
      scrollTrigger: { trigger: root, start: 'top bottom', end: 'top 15%', scrub: .4 } });
    const setY = gsap.quickSetter(beam, 'y', 'px'), setS = gsap.quickSetter(leak, 'scaleY');

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
      // the light leak: a beam drops from the menu bar and walks down the copy, one line per band pass
      const sTop = stage.getBoundingClientRect().top, H = stage.offsetHeight || innerHeight;
      const mb = document.getElementById('nav')?.offsetHeight || 37;
      const B = { y: mb };
      const drawLeak = () => { setY(B.y); setS(B.y / H); };
      tl = gsap.timeline({
        defaults: { ease: EASE.sweep },
        scrollTrigger: { trigger: root, start: mob ? 'top 55%' : 'top 50%', end: 'bottom bottom', scrub: .4 },
      });
      tl.fromTo(beam, { opacity: 0 }, { opacity: 1, duration: .3, ease: 'none' }, 0)
        .to(B, { y: () => meta[0].ln.getBoundingClientRect().top - sTop, duration: .6, ease: 'power2.in', onUpdate: drawLeak }, 0);
      let t = .6;
      meta.forEach((m, i) => {
        const o = { p: 0 }, dur = Math.max(.45, m.w / avg);
        const r = m.ln.getBoundingClientRect(), next = meta[i + 1]?.ln.getBoundingClientRect();
        tl.to(B, { y: r.bottom - sTop, duration: dur, ease: 'none', onUpdate: drawLeak }, t);
        if (next) tl.to(B, { y: next.top - sTop, duration: next && meta[i + 1].pi !== m.pi ? .5 : .06, ease: 'none', onUpdate: drawLeak }, t + dur);
        tl.to(o, {
          p: 1, duration: dur,
          onUpdate() {
            const p = o.p;
            m.band.set(p);
            m.ln.style.setProperty('--x', `${(p * m.w).toFixed(1)}px`);
            m.ln.style.setProperty('--c', Math.max(0, Math.min(1, p * 7, (1 - p) * 7)).toFixed(3));
            if (i === pillLine) root.classList.toggle('is-pill', p >= pillAt);
            if (i === linkLine) root.classList.toggle('is-link', p >= linkAt);
          },
        }, t);
        t += dur + (meta[i + 1] && meta[i + 1].pi !== m.pi ? .5 : .06);
      });
      // the housing's rim dissolves as the copy inks (black is what the notch was all along); the beam fades out at the end
      tl.fromTo(housing, { opacity: .9, scale: 1 }, { opacity: 0, scale: 1.06, duration: t * .85, ease: 'power1.in', transformOrigin: '50% 0' }, .3)
        .to(beam, { opacity: 0, duration: .5, ease: 'none' }, t - .3)
        .to({}, { duration: t * .1 }, t);   // hold the inked poster before the stage lets go
    };
    const queue = () => { if (!queued) { queued = true; queueMicrotask(build); } };

    // the link's paragraph keeps its lines exposed to AT (a focusable link can't sit in aria-hidden)
    const splits = ps.map((p) => splitLines(p, { mask: false, onSplit: queue, ...(p.querySelector('a') ? { aria: 'none' } : {}) }));
    queue();

    return () => {
      tl?.scrollTrigger?.kill(); tl?.kill(); sink.scrollTrigger?.kill(); sink.kill();
      gsap.set([land, housing, leak, beam], { clearProps: 'all' });
      splits.forEach((s) => s.revert());
      root.classList.remove('is-live', 'is-pill', 'is-link');
    };
  });
  return () => mm.revert();
}
