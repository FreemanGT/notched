// #faq (SPEC §5.7). Contract: FOUNDATION.md. The accordion itself is CSS + native <details>;
// JS only stages the entrance and keeps ScrollTrigger honest when a row changes the page height.
export default function init(root, ctx) {
  const { gsap, ScrollTrigger, mm, MQ, lib } = ctx;
  const rows = [...root.querySelectorAll('.faq__row')];
  const first = rows[0];

  mm.add(MQ, (c) => {
    if (c.conditions.still) return;
    // Below the fold at init: hold the first row's sweep for the entrance (no height change, so no CLS).
    const staged = first?.open && root.getBoundingClientRect().top > innerHeight;
    if (staged) first.classList.add('is-pre');

    const split = lib.splitLines(root.querySelector('.faq__title'), {
      onSplit: (s) => gsap.from(s.lines, { yPercent: 105, duration: 0.7, stagger: 0.06, ease: lib.EASE.out,
        scrollTrigger: { trigger: root, start: 'top 80%', once: true } }),
    });
    const tl = gsap.timeline({ scrollTrigger: { trigger: root.querySelector('.faq__list'), start: 'top 85%', once: true } });
    tl.from(rows, { y: 24, opacity: 0, duration: 0.6, stagger: 0.06, ease: lib.EASE.out })
      .fromTo(rows, { '--hl': 0 }, { '--hl': 1, duration: 0.7, stagger: 0.06, ease: lib.EASE.sweep }, 0);
    if (staged) tl.call(() => first.classList.remove('is-pre'), null, 0.35);

    return () => { split.revert(); first?.classList.remove('is-pre'); };
  });

}
