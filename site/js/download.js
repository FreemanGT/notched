// #download (SPEC §5.8): the finale bookends the hero. The stage rises as a screen-top at night (menu-bar band,
// notch, fillets over the hills). Pinned, the band drops and the letters of NOTCHED pour out of the notch into it,
// the CTA drops from under the band like the download sheet, and the requirements type into a little menu bar.
// Scrubbed with transforms (+ one clip-path) only: nothing here touches layout per frame.
export default function init(root, ctx) {
  const { gsap, mm, MQ, lib, Component } = ctx;
  const { EASE } = lib;
  const $ = (s) => root.querySelector(s);
  const band = $('.dl__band'), ink = $('.dl__ink'), fils = root.querySelectorAll('.dl__fil');
  const wm = $('.dl__wm'), letters = [...wm.children], eye = $('.dl__eye'), h2 = $('.dl__h');
  const tab = $('.dl__tab'), tfils = root.querySelectorAll('.dl__tfil'), low = $('.dl__low'), meta = $('.dl__meta'), type = $('.dl__type');

  // The hero's hills, at night (one static paint).
  if (Component) Component.paintWallpaper($('.dl__wp'), { preset: 'hills', time: 0.75 });

  mm.add(MQ, (c) => {
    const { desk, still, hover } = c.conditions;
    if (still) return;                                   // CSS renders the finished poster
    const total = desk ? 200 : 170, L = total - 100;     // section height in vh; L = the pinned stretch
    const at = (f) => 100 + L * f;
    const MB = () => document.querySelector('.nav')?.offsetHeight || 37;
    const H = () => band.offsetHeight || 1;
    const rStart = () => {
      const v = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--r-site-pt'));
      return Number.isFinite(v) ? Math.max(0, Math.min(v, 20)) / 20 : 0.7;
    };
    // Each letter starts parked inside the notch: centred, tucked up under the menu bar, tiny.
    const lx = (i) => (band.offsetWidth / 2) - (letters[i].offsetLeft + letters[i].offsetWidth / 2);   // offsets are band-relative
    const ly = () => -(wm.parentNode.offsetTop + wm.offsetHeight * 0.5) + MB() * 0.55;

    // The letters run off one numeric proxy (painted here), so a refresh can never strand them half-set.
    const n = letters.length, mid = (n - 1) / 2, EACH = 0.1, DUR = 1 - EACH * Math.ceil(mid);
    const ease = gsap.parseEase(EASE.inOut), pour = { p: 0 };
    let geo = [];
    const measure = () => { const y = ly(); geo = letters.map((_, i) => ({ x: lx(i), y })); };
    const paint = () => letters.forEach((el, i) => {
      const k = ease(Math.min(1, Math.max(0, (pour.p - Math.abs(i - mid) * EACH) / DUR))), g = geo[i];
      gsap.set(el, { x: g.x * (1 - k), y: g.y * (1 - k), scale: 0.16 + 0.84 * k, opacity: Math.min(1, k * 2.5) });
    });
    measure(); paint();

    gsap.set([eye, h2], { opacity: 0, y: 18 });
    gsap.set(tfils, { scale: 0 });
    gsap.set([...low.children].filter((n) => n !== meta), { opacity: 0, y: 22 });
    gsap.set(meta, { opacity: 0 });
    gsap.set(type, { clipPath: 'inset(0 100% 0 0)' });

    const tl = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: { trigger: root, start: 'top bottom', end: 'bottom bottom', scrub: 0.4, invalidateOnRefresh: true, onRefresh: () => { measure(); paint(); } },
    });
    // 1. the band drops from menu-bar height; the fillets ride its edge and grow to Large
    tl.fromTo(ink, { scaleY: () => MB() / H() }, { scaleY: 1, ease: EASE.sweep, duration: L * 0.42 }, at(0))
      .fromTo(fils, { y: () => MB() - H(), scale: rStart }, { y: 0, scale: 1, ease: EASE.sweep, duration: L * 0.42 }, at(0))
      // 2. the letters pour out of the notch, centre first
      // the CTA tab rides the band's edge, tucked behind it
      .fromTo(tab, { y: () => MB() - H() - tab.offsetHeight }, { y: () => -tab.offsetHeight, ease: EASE.sweep, duration: L * 0.42 }, at(0))
      .fromTo(pour, { p: 0 }, { p: 1, duration: L * 0.32, onUpdate: paint }, at(0.12))
      .to(eye, { opacity: 1, y: 0, ease: EASE.out, duration: L * 0.14 }, at(0.3))
      .to(h2, { opacity: 1, y: 0, ease: EASE.out, duration: L * 0.16 }, at(0.4))
      // 3. the CTA drops from under the band, fillets snapping in where it meets it
      .to(tab, { y: 0, ease: EASE.out, duration: L * 0.16 }, at(0.5))
      .to(tfils, { scale: 1, ease: EASE.fillet, duration: L * 0.08 }, at(0.6))
      // 4. the small print, then the requirements type into the menu bar
      .to([...low.children].filter((n) => n !== meta), { opacity: 1, y: 0, ease: EASE.out, duration: L * 0.14, stagger: L * 0.03 }, at(0.6))
      .to(meta, { opacity: 1, ease: EASE.out, duration: L * 0.04 }, at(0.58))
      .to(type, { clipPath: 'inset(0 0% 0 0)', ease: `steps(${Math.max(12, type.textContent.length)})`, duration: L * 0.18 }, at(0.62))
      .set({}, {}, total);

    // Keyboard: tabbing into a still-hidden CTA jumps the track to its end so focus lands on something visible.
    const onFocus = () => { const st = tl.scrollTrigger; if (st && st.progress < 0.85) window.scrollTo(0, st.end); };
    root.addEventListener('focusin', onFocus);

    // Egg (§6.8): hover the word and the letters hop back toward the notch, centre first.
    let off = () => {};
    if (desk && hover) {
      let busy = false;
      const run = () => {
        if (busy || tl.progress() < 0.97) return;
        busy = true;
        gsap.to(letters, { yPercent: -14, duration: 0.18, ease: 'power2.out', yoyo: true, repeat: 1, stagger: { each: 0.035, from: 'center' }, onComplete: () => { busy = false; } });
      };
      wm.addEventListener('pointerenter', run);
      off = () => { wm.removeEventListener('pointerenter', run); gsap.set(letters, { yPercent: 0 }); };
    }

    return () => { root.removeEventListener('focusin', onFocus); off(); gsap.set(letters, { clearProps: 'all' }); };
  });
  return () => mm.revert();
}
