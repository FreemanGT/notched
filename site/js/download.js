// #download (SPEC §5.8): the last black-out. The band takes the page; the notch descends into the wordmark,
// widens into a band across the cap height (the letters emerge white inside it) and dissolves; the CTA
// arrives and the requirements line types itself into a little menu bar.
// One scrubbed timeline over the whole track in vh units (start 'top bottom' → end 'bottom bottom').
export default function init(root, ctx) {
  const { gsap, mm, MQ, lib } = ctx;
  const { EASE } = lib;
  const $ = (s) => root.querySelector(s);
  const stage = $('.dl__stage'), strip = $('.dl__strip'), fils = root.querySelectorAll('.dl__fil');
  const inner = $('.dl__in'), word = $('.dl__word'), wm = $('.dl__wm'), notch = $('.dl__notch'), egg = $('.dl__egg');
  const eye = $('.dl__eye'), h2 = $('.dl__h'), act = $('.dl__act'), meta = $('.dl__meta'), type = $('.dl__type');

  // Hang the notch from the letters' real cap line (line-height .8 makes CSS guesses drift per font).
  const m = { fs: 1, cap: 0.7, capTop: 0.1 };
  const measure = () => {
    const cs = getComputedStyle(word), fs = parseFloat(cs.fontSize);
    const c = document.createElement('canvas').getContext('2d');
    c.font = `${cs.fontWeight} ${fs}px ${cs.fontFamily}`;
    const t = c.measureText('NOTCHED');
    const asc = t.fontBoundingBoxAscent, desc = t.fontBoundingBoxDescent, cap = t.actualBoundingBoxAscent;
    if (!fs || !asc || !cap) return;
    const lh = parseFloat(cs.lineHeight) || fs * 0.8;
    Object.assign(m, { fs, cap: cap / fs, capTop: ((lh - asc - desc) / 2 + asc - cap) / fs });
    word.style.setProperty('--cap-top', `${m.capTop}em`);
    word.style.setProperty('--cap-h', `${m.cap}em`);
  };
  measure();

  // The notch's resting size comes from the tokens (--notch-w/-h); a probe resolves them to px.
  const probe = document.createElement('i');
  probe.style.cssText = 'position:absolute;visibility:hidden;pointer-events:none;width:var(--notch-w);height:var(--notch-h)';
  probe.setAttribute('aria-hidden', 'true');
  stage.append(probe);

  mm.add(MQ, (c) => {
    const { desk, still, hover } = c.conditions;
    if (still) return;                                   // CSS renders the end state on black
    root.classList.add('is-live');
    const total = desk ? 230 : 190;                      // section height in vh
    const L = total - 100;                               // the pinned stretch: everything that matters happens here
    const at = (f) => 100 + L * f;
    const mb = () => strip.offsetHeight || 1;            // layout height, untouched by the scale
    const vh = () => stage.offsetHeight + 2;
    const rStart = () => {
      const v = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--r-site-pt'));
      return Number.isFinite(v) ? Math.max(0, Math.min(v, 20)) / 20 : 0.7;
    };
    const nW = () => probe.offsetWidth || 180, nH = () => probe.offsetHeight || 30;
    const bandW = () => wm.offsetWidth + m.fs * 0.16;
    const bandH = () => m.fs * (m.cap + 0.14);
    // From just under the menu bar down to the cap line (offsets ignore transforms, so refresh-safe).
    const drop = () => -(inner.offsetTop + word.offsetTop + m.fs * (m.capTop - 0.07) - mb() - 8);
    const clipFrom = () => `inset(-20% ${Math.max(0, (1 - nW() / wm.offsetWidth) * 50)}% -20% ${Math.max(0, (1 - nW() / wm.offsetWidth) * 50)}%)`;

    // Staggered children lose their from-state on refresh revert, so park them with set() + to().
    const rise = [h2, ...[...act.children].filter((n) => n !== meta)];
    gsap.set(eye, { opacity: 0, y: '6vh' });
    gsap.set(rise, { opacity: 0, y: 28 });
    gsap.set(meta, { opacity: 0 });
    gsap.set(type, { clipPath: 'inset(0 100% 0 0)' });
    gsap.set(wm, { clipPath: 'inset(-20% 50% -20% 50%)' });

    const tl = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: { trigger: root, start: 'top bottom', end: 'bottom bottom', scrub: 0.4, invalidateOnRefresh: true, onRefresh: measure },
    });
    tl.fromTo(strip, { scaleY: 1 }, { scaleY: () => vh() / mb(), ease: EASE.sweep, duration: 100 }, 0)
      .fromTo(fils, { y: mb, scale: rStart }, { y: vh, scale: 1, ease: EASE.sweep, duration: 100 }, 0)
      .to(eye, { opacity: 1, y: 0, ease: EASE.out, duration: 26 }, 70)
      // 1. the notch descends from under the menu bar into the wordmark
      .fromTo(notch, { opacity: 0, y: drop, width: nW, height: nH, borderRadius: '0px 0px 14px 14px' },
        { opacity: 1, duration: L * 0.05 }, at(0))
      .to(notch, { y: 0, ease: EASE.inOut, duration: L * 0.2 }, at(0))
      // 2. it widens into a band across the cap height; the letters emerge inside it
      .to(notch, { height: bandH, borderRadius: '10px 10px 10px 10px', ease: EASE.out, duration: L * 0.07 }, at(0.2))
      .to(notch, { width: bandW, ease: EASE.sweep, duration: L * 0.24 }, at(0.2))
      .fromTo(wm, { clipPath: clipFrom }, { clipPath: 'inset(-20% 0% -20% 0%)', ease: EASE.sweep, duration: L * 0.24 }, at(0.2))
      // 3. the band dissolves; the word stays
      .to(notch, { opacity: 0, scaleY: 1.25, filter: 'blur(6px)', ease: EASE.out, duration: L * 0.14 }, at(0.44))
      // 4. the CTA arrives, then the requirements type into the menu bar
      .to(rise, { opacity: 1, y: 0, ease: EASE.out, duration: L * 0.16, stagger: L * 0.03 }, at(0.5))
      .to(meta, { opacity: 1, ease: EASE.out, duration: L * 0.04 }, at(0.6))
      .to(type, { clipPath: 'inset(0 0% 0 0)', ease: `steps(${Math.max(12, type.textContent.length)})`, duration: L * 0.2 }, at(0.62))
      .set({}, {}, total);

    // Keyboard: tabbing into a still-faded CTA jumps the track to its end so focus lands on something visible.
    const onFocus = () => { const st = tl.scrollTrigger; if (st && st.progress < 0.85) window.scrollTo(0, st.end); };
    root.addEventListener('focusin', onFocus);

    // Egg (§6.8): hover the word and a tiny band slides across the old notch spot and back.
    let off = () => {};
    if (desk && hover) {
      const e = lib.cssEase('sweep');
      let anim;
      const run = () => {
        if (tl.progress() < 0.97 || anim?.playState === 'running') return;
        egg.style.visibility = 'visible';
        anim = egg.animate([
          { clipPath: 'inset(0 100% 0 0)', easing: e },
          { clipPath: 'inset(0 40% 0 0)', easing: e, offset: 0.3 },
          { clipPath: 'inset(0 0 0 60%)', easing: e, offset: 0.55 },
          { clipPath: 'inset(0 100% 0 0)' },
        ], { duration: 1200 });
        anim.onfinish = () => { egg.style.visibility = 'hidden'; };
      };
      word.addEventListener('pointerenter', run);
      off = () => { word.removeEventListener('pointerenter', run); anim?.cancel(); egg.style.visibility = ''; };
    }

    return () => { root.classList.remove('is-live'); root.removeEventListener('focusin', onFocus); off(); };
  });
  return () => { mm.revert(); probe.remove(); };
}
