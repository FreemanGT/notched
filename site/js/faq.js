// #faq (SPEC §5.7). Contract: FOUNDATION.md. The accordion itself is CSS + native <details>;
// JS only stages the entrance. No opacity tweens: every frame shows text at full ink or under the bar.
export default function init(root, ctx) {
  const { gsap, mm, MQ, lib } = ctx;
  const rows = [...root.querySelectorAll('.faq__row')];
  const [first, ...rest] = rows;

  mm.add(MQ, (c) => {
    if (c.conditions.still) return;
    const split = lib.splitLines(root.querySelector('.faq__title'), {
      onSplit: (s) => gsap.from(s.lines, { yPercent: 105, duration: 0.7, stagger: 0.06, ease: lib.EASE.out,
        scrollTrigger: { trigger: root, start: 'top 80%', once: true } }),
    });
    // Already on screen at init (reload mid-page, #faq link): leave the list finished.
    if (root.getBoundingClientRect().top <= innerHeight) return () => split.revert();

    if (first?.open) first.classList.add('is-pre');
    rest.forEach((r) => r.classList.add('is-wipe'));
    const STEP = 0.035, IN = 0.18, OUT = 0.22;
    const tl = gsap.timeline({ scrollTrigger: { trigger: root.querySelector('.faq__list'), start: 'top 88%', once: true } });
    tl.fromTo(rows, { '--hl': 0 }, { '--hl': 1, duration: 0.45, stagger: STEP, ease: lib.EASE.sweep }, 0)
      .call(() => first?.classList.remove('is-pre'), null, 0);
    rest.forEach((r, i) => {
      const t = (i + 1) * STEP;
      tl.fromTo(r, { '--bx': 0 }, { '--bx': 1, duration: IN, ease: lib.EASE.sweep }, t)
        .call(() => r.classList.add('is-lit'), null, t + IN)
        .to(r, { '--bx': 0, duration: OUT, ease: lib.EASE.sweep }, t + IN + 0.03)
        .call(() => r.classList.remove('is-wipe', 'is-lit'), null, t + IN + 0.03 + OUT);
    });

    return () => { split.revert(); first?.classList.remove('is-pre'); rest.forEach((r) => r.classList.remove('is-wipe', 'is-lit')); };
  });
}
