// The download sheet: the email ask (SPEC §4.7; FACTS "Download email ask" is law). Lazy-loaded by cta.js.
// The notch opens: a black band strip over the nav, and a panel that grows out of it.
import { DOWNLOAD, SITE, REPO, noMac, isTablet, storedEmail, startDownload } from './cta.js';
import { trapTab } from './trap.js';
import { version } from './version.js';
import { reduced, cssEase } from './motion.js';

const RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const ENDPOINT = () => document.querySelector('meta[name="nt-signup"]')?.content;
const fine = () => matchMedia('(pointer: fine)').matches;
const esc = (s) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const save = (email) => { try { email ? localStorage.setItem('nt-email', email) : localStorage.removeItem('nt-email'); } catch {} };

// Load the sheet stylesheet once (lazy, ~6 KB).
const cssReady = new Promise((res) => {
  if (document.querySelector('link[data-sheet-css]')) return res();
  const l = Object.assign(document.createElement('link'), { rel: 'stylesheet', href: '/css/sheet.css' });
  l.dataset.sheetCss = '';
  l.onload = l.onerror = () => res();
  document.head.append(l);
});

function post(email, form) {
  const url = ENDPOINT();
  if (!url) return;
  try {
    fetch(url, {
      method: 'POST', mode: 'no-cors', keepalive: true,
      body: new URLSearchParams({
        type: 'mac', email, name: '',
        platform: navigator.userAgentData?.platform || navigator.platform || '',
        ref: 'notched' + (document.referrer ? ' · ' + document.referrer : ''),
        company: form?.elements.nt_hp?.value || '',
      }),
    }).catch(() => {});
  } catch {}
}

const ARROW = (dir) => `<svg class="cta__arrow" aria-hidden="true"><use href="#i-arrow-${dir}"/></svg>`;
const CHECK = `<svg class="sheet-check" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10.5"/><path d="M7.5 12.4l3 3 6-6.4"/></svg>`;
const FINE = `<p class="sheet-fine">Used only for Notched updates. <a href="#privacy" data-sheet-hash>Kept in the maker's Google Sheet, never shared or sold.</a></p>`;
const HP = `<div class="sheet-hp" aria-hidden="true" inert><label>Leave this empty <input name="nt_hp" type="text" tabindex="-1" autocomplete="off"></label></div>`;

const VIEWS = {
  mac: (v) => `
    <p class="sheet-kicker">DOWNLOAD · v${v} · FREE</p>
    <h2 id="sheet-title" class="sheet-title" tabindex="-1">Notched is one email away.</h2>
    <p id="sheet-lede" class="sheet-lede">Leave your email and the download starts at once. The app checks for updates by itself either way.</p>
    <form class="sheet-form" novalidate data-form="mac">
      <div class="sheet-field"><label for="sheet-email">Email</label>
        <input id="sheet-email" name="email" type="email" required autocomplete="email" inputmode="email" autocapitalize="off" spellcheck="false" placeholder="you@example.com" aria-describedby="sheet-err"></div>
      ${HP}
      <p id="sheet-err" class="sheet-err" aria-live="assertive"></p>
      <button class="cta cta--lg cta--full" type="submit">${ARROW('down')}<span class="cta__label">Download for Mac</span></button>
      <p class="sheet-meta">Free · macOS 14+ · Apple silicon</p>
    </form>
    ${FINE}`,
  macDone: (v, { email } = {}) => `
    <p class="sheet-kicker sheet-kicker--ok">${CHECK}NOTCHED · v${v}</p>
    <h2 id="sheet-title" class="sheet-title" tabindex="-1">On its way.</h2>
    ${email ? `<p class="sheet-who">Update news goes to ${esc(email)}. <button type="button" class="sheet-text" data-act="forget">Not you?</button></p>` : ''}
    <p id="sheet-lede" class="sheet-lede">Open the disk image and drag Notched to Applications. Open it, agree to the license, then click its icon in the menu bar (a small screen with a bar across the top) and flip the switch.</p>
    <p class="sheet-fine">Didn't start? <a href="${DOWNLOAD}" data-act="again">Download again</a></p>
    ${email ? '' : '<button type="button" class="sheet-text" data-act="forget">Use a different email</button>'}
    <div class="sheet-row">
      <a class="gh-link" href="${REPO}" target="_blank" rel="noopener"><svg aria-hidden="true"><use href="#i-github"/></svg>Source on GitHub</a>
      <button type="button" class="pill-ghost sheet-done" data-act="close">Done</button>
    </div>`,
  macAway: (v) => `
    <p class="sheet-kicker">MAC APP · v${v}</p>
    <h2 id="sheet-title" class="sheet-title" tabindex="-1">Get it on your Mac.</h2>
    <p id="sheet-lede" class="sheet-lede">Notched installs on a Mac, not this ${isTablet() ? 'tablet' : 'phone'}. Send yourself the link and open it there.</p>
    <form class="sheet-form" novalidate data-form="away">
      <div class="sheet-field"><label for="sheet-email">Email · optional, for updates</label>
        <input id="sheet-email" name="email" type="email" autocomplete="email" inputmode="email" autocapitalize="off" spellcheck="false" placeholder="you@example.com" aria-describedby="sheet-err"></div>
      ${HP}
      <p id="sheet-err" class="sheet-err" aria-live="assertive"></p>
      <button class="cta cta--lg cta--full" type="submit">${ARROW('up')}<span class="cta__label">Send the link to my Mac</span></button>
      <p class="sheet-meta">notched.vercel.app</p>
    </form>
    ${FINE}`,
  macAwayDone: (v, { how = 'copied', showUrl = false } = {}) => `
    <p class="sheet-kicker sheet-kicker--ok">${CHECK}${{ copied: 'Link copied', shared: 'Shared', saved: 'Email saved' }[how]}</p>
    <h2 id="sheet-title" class="sheet-title" tabindex="-1">Open it on your Mac.</h2>
    <p id="sheet-lede" class="sheet-lede">${how === 'copied' ? 'Paste the link into a note or a message to yourself. ' : ''}On your Mac, go to notched.vercel.app and download it there.</p>
    ${showUrl ? `<p class="sheet-url"><input readonly value="${SITE}" aria-label="Link to Notched" onfocus="this.select()"></p>` : ''}
    <div class="sheet-row">
      <button type="button" class="pill-ghost" data-act="again-away">Send it again</button>
      <button type="button" class="pill-ghost sheet-done" data-act="close">Done</button>
    </div>`,
};

let dlg, shell, panel, body, band, glint, probe, fils = [], opener = null, firstMac = true, pendingHash = '', busy = false, wasBlack = false;

function build() {
  dlg = document.createElement('dialog');
  dlg.className = 'sheet';
  dlg.setAttribute('aria-labelledby', 'sheet-title');
  dlg.setAttribute('aria-describedby', 'sheet-lede');
  dlg.innerHTML = `
    <div class="sheet__band" aria-hidden="true" inert><i class="sheet__glint"></i><i class="sheet__fil sheet__fil--l"></i><i class="sheet__fil sheet__fil--r"></i></div>
    <div class="sheet__shell"><div class="sheet__panel"><div class="sheet__scroll">
      <div class="sheet__head"><span class="sheet__app"><svg viewBox="0 0 16 11" aria-hidden="true"><use href="#i-notched"/></svg>Notched</span>
        <button type="button" class="sheet__x" aria-label="Close" data-act="close"><svg viewBox="0 0 14 14" aria-hidden="true"><path d="M2 2l10 10M12 2 2 12"/></svg></button></div>
      <div class="sheet__body"></div>
    </div></div></div>
    <svg class="sheet__cam" viewBox="0 0 10 10" aria-hidden="true"><circle cx="5" cy="5" r="3.5" fill="#0B0F1A" stroke="#24304A" stroke-width="1.5"/><circle cx="4.1" cy="4.1" r=".75" fill="#7C8BB0"/></svg>
    <i class="sheet__probe" aria-hidden="true"></i>`;
  document.body.append(dlg);
  shell = dlg.querySelector('.sheet__shell');
  panel = dlg.querySelector('.sheet__panel');
  probe = dlg.querySelector('.sheet__probe');
  body = dlg.querySelector('.sheet__body');
  band = dlg.querySelector('.sheet__band');
  glint = dlg.querySelector('.sheet__glint');
  fils = [...dlg.querySelectorAll('.sheet__fil')];

  dlg.addEventListener('click', (e) => {
    if (e.target === dlg) return close();
    const act = e.target.closest('[data-act]')?.dataset.act;
    const hash = e.target.closest('[data-sheet-hash]');
    if (hash) { e.preventDefault(); pendingHash = hash.getAttribute('href'); return close(); }
    if (act === 'close') return close();
    if (act === 'forget') { save(''); return show('mac', {}, { focusField: true }); }
    if (act === 'again-away') return show('macAway', {}, { focusField: true });
    if (act === 'again') { e.preventDefault(); startDownload(); }
  });
  dlg.addEventListener('cancel', (e) => { e.preventDefault(); close(); });
  dlg.addEventListener('input', (e) => { if (e.target.name === 'email') setErr(''); });
  dlg.addEventListener('submit', onSubmit);
  trapTab(dlg);
}

function setErr(msg) {
  const err = dlg.querySelector('#sheet-err'), input = dlg.querySelector('input[name=email]');
  if (!err) return;
  err.textContent = msg;
  input.toggleAttribute('aria-invalid', !!msg);
  if (msg) input.setAttribute('aria-invalid', 'true');
  if (msg && !reduced()) input.closest('.sheet-field').animate([{ transform: 'translateX(0)' }, { transform: 'translateX(-3px)' }, { transform: 'translateX(3px)' }, { transform: 'translateX(-3px)' }, { transform: 'translateX(0)' }], { duration: 240 });
}

function onSubmit(e) {
  e.preventDefault();
  const form = e.target, email = form.elements.email.value.trim();
  if (form.dataset.form === 'mac') {
    if (!email) return setErr('Add your email and the download starts.');
    if (!RE.test(email)) return setErr("That email doesn't look right. Check it and try again.");
    // Strictly this order, synchronously: download first (keeps the gesture), then fire-and-forget POST.
    startDownload();
    post(email, form);
    save(email);
    if (reduced()) return show('macDone', { email });
    // The panel retracts up into the notch as the download starts, then drops again with the next steps.
    busy = true;
    glint.animate([{ transform: 'scaleX(1)', opacity: 0 }, { transform: 'scaleX(1)', opacity: 1, offset: 0.3, easing: cssEase('sweep') }, { transform: 'scaleX(0)', opacity: 1 }], { duration: 560 });
    lift().then(() => { show('macDone', { email }, { first: true }); drop(60, -60); }).finally(() => { busy = false; });
    return;
  }
  // away: optional email, then share → clipboard → visible URL.
  if (email && !RE.test(email)) return setErr("That email doesn't look right. Check it and try again.");
  if (email) { post(email, form); save(email); }
  const data = { title: 'Notched', text: 'Notched: hide the MacBook notch. Download it on your Mac.', url: SITE };
  const fallback = () => navigator.clipboard?.writeText(SITE)
    .then(() => show('macAwayDone', { how: 'copied' }))
    .catch(() => show('macAwayDone', { how: email ? 'saved' : 'copied', showUrl: true }))
    ?? show('macAwayDone', { how: email ? 'saved' : 'copied', showUrl: true });
  if (navigator.share) {
    navigator.share(data).then(() => show('macAwayDone', { how: 'shared' }), (err) => { if (err?.name !== 'AbortError') fallback(); });
  } else fallback();
}

/** Render a view; tween the panel height old → new; focus title (or the field on the first fine-pointer mac render). */
function show(name, opts = {}, { focusField = false, first = false } = {}) {
  const v = version() || '';
  const from = first ? 0 : panel.offsetHeight;
  body.innerHTML = VIEWS[name](v, opts);
  const field = body.querySelector('input[name=email]');
  const wantField = field && fine() && (focusField || (name === 'mac' && firstMac));
  if (name === 'mac') firstMac = false;
  (wantField ? field : body.querySelector('#sheet-title'))?.focus({ preventScroll: true });
  if (reduced() || first) return;
  const to = panel.offsetHeight;
  if (from && from !== to) panel.animate([{ height: `${from}px` }, { height: `${to}px` }], { duration: 400, easing: cssEase('out') });
  rise(0);
}

function rise(delay) {
  [...body.children].forEach((n, i) => n.animate([{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }], { duration: 320, delay: delay + i * 30, easing: cssEase('out'), fill: 'backwards' }));
}

// The notch opens. The band (a copy of the nav, turned black) keeps the menu bar and the camera on screen; the nav's
// notch widens along the band, then drops to the panel's full height, with 10 → 20 pt fillets where it meets the
// band. A lit outline (the shell, 1 px outside the panel) traces the shape and cools to a hairline. Close reverses it.
const NOTCH = 'inset(0 calc(50% - var(--notch-w) / 2) calc(100% - var(--notch-h)) round 0 0 10px 10px)';
const BAND = 'inset(0 0 0 0 round 0 0 0 0)';
const MORPH = 550, SPLIT = 0.36, LIT = 'rgb(255 181 71 / .85)', HAIR = '#2E2E2E';
const stop = () => [panel, shell, ...fils].forEach((n) => n.getAnimations().forEach((a) => a.cancel()));

function shapes() {
  const w = panel.offsetWidth, h = panel.offsetHeight, mb = band.offsetHeight;
  const nw = probe.offsetWidth || 185, nh = probe.offsetHeight || 32;
  const L = Math.max(0, (w - nw) / 2), B = Math.max(0, h - nh), r = nh * 9 / 32;
  const clip = (o) => [   // o = 0 for the panel, 1 for the outline around it
    `inset(0px ${L}px ${B}px ${L}px round 0px 0px ${r + o}px ${r + o}px)`,
    `inset(0px 0px ${B}px 0px round 0px 0px ${r + o}px ${r + o}px)`,
    o ? `inset(${mb}px 0px 0px 0px round 0px 0px 29px 29px)` : 'inset(0px 0px 0px 0px round 0px 0px 28px 28px)',
  ];
  return { p: clip(0), s: clip(1) };
}

/** dir 1: notch → panel (open). dir -1: panel → notch (close). Resolves when the shape lands. */
function morph(dir, delay = 0) {
  stop();
  const { p, s } = shapes();
  if (dir > 0) {
    const o = { duration: MORPH, delay, fill: 'backwards' };
    const k = (c, i, x = {}) => ({ clipPath: c[i], ...x });
    const e1 = cssEase('sweep'), e2 = cssEase('out');
    shell.animate([k(s, 0, { backgroundColor: LIT, easing: e1 }), k(s, 1, { backgroundColor: LIT, offset: SPLIT, easing: e2 }), k(s, 2, { backgroundColor: HAIR })], o);
    fils.forEach((f) => f.animate([{ transform: 'scale(0)' }, { transform: 'scale(0)', offset: SPLIT }, { transform: 'scale(.5)', offset: 0.7, easing: cssEase('fillet') }, { transform: 'scale(1)' }], o));
    return panel.animate([k(p, 0, { easing: e1 }), k(p, 1, { offset: SPLIT, easing: e2 }), k(p, 2)], o).finished;
  }
  const o = { duration: 400, delay, fill: 'forwards' }, at = 1 - SPLIT;
  const e1 = cssEase('swallow'), e2 = cssEase('sweep');
  shell.animate([{ clipPath: s[2], backgroundColor: HAIR, easing: e1 }, { clipPath: s[1], backgroundColor: LIT, offset: at, easing: e2 }, { clipPath: s[0], backgroundColor: LIT }], o);
  fils.forEach((f) => f.animate([{ transform: 'scale(1)' }, { transform: 'scale(0)', offset: 0.5 }, { transform: 'scale(0)' }], o));
  return panel.animate([{ clipPath: p[2], easing: e1 }, { clipPath: p[1], offset: at, easing: e2 }, { clipPath: p[0] }], o).finished;
}

function drop(delay, settle = 120) { morph(1, delay); rise(delay + MORPH + settle); }
const lift = () => morph(-1);

// The band is the real menu bar, turned black: a static copy of the nav, so its text and notch stay put.
function copyNav() {
  band.querySelector('.nav')?.remove();
  const nav = document.getElementById('nav');
  wasBlack = !!nav?.classList.contains('is-black');
  if (!nav) return;
  const c = nav.cloneNode(true);
  c.removeAttribute('id');
  c.classList.add('is-black');
  c.querySelectorAll('[id],[data-cta],[data-nav-notch],[data-clock],[data-time-cycle],[data-nav-icon],[data-menu-open],[data-nav-app]')
    .forEach((n) => ['id', 'data-cta', 'data-nav-notch', 'data-clock', 'data-time-cycle', 'data-nav-icon', 'data-menu-open', 'data-nav-app'].forEach((a) => n.removeAttribute(a)));
  ['transform', 'translate', 'opacity', 'visibility'].forEach((pr) => c.style.removeProperty(pr));
  band.prepend(c);
}

export async function openSignup(el, { viaPointer = false, downloaded = false } = {}) {
  await cssReady;
  if (!dlg) build();
  if (dlg.open || busy) return;
  opener = el;
  pendingHash = '';
  const view = noMac() ? 'macAway' : downloaded ? 'macDone' : 'mac';
  const html = document.documentElement;
  html.classList.add('sheet-open');
  copyNav();
  dlg.showModal();
  show(view, view === 'macDone' ? { email: storedEmail() } : {}, { first: true, focusField: viaPointer });
  if (reduced()) { dlg.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 120 }); return; }
  // A menu bar that isn't black yet goes black first, spreading out of the notch (the product's trick).
  const d = wasBlack ? 0 : 200;
  if (!wasBlack) band.animate([{ clipPath: NOTCH }, { clipPath: BAND }], { duration: 260, easing: cssEase('sweep'), fill: 'backwards' });
  glint.animate([{ transform: 'scaleX(0)', opacity: 1, easing: cssEase('sweep') }, { transform: 'scaleX(1)', opacity: 1, offset: 0.4 }, { transform: 'scaleX(1)', opacity: 0 }], { duration: 700, delay: d });
  drop(d);
}

export async function close() {
  if (!dlg?.open || busy) return;
  busy = true;
  try {
    if (reduced()) await dlg.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 120 }).finished;
    else {
      dlg.classList.add('is-closing');
      await lift();
      if (!wasBlack) await band.animate([{ clipPath: BAND }, { clipPath: NOTCH }], { duration: 200, easing: cssEase('sweep'), fill: 'forwards' }).finished;
    }
  } catch {}
  dlg.close();
  dlg.classList.remove('is-closing');
  dlg.getAnimations({ subtree: true }).forEach((a) => a.cancel());
  document.documentElement.classList.remove('sheet-open');
  busy = false;
  if (pendingHash) document.querySelector(pendingHash)?.scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth' });
  else {
    opener?.focus({ preventScroll: true });
    if (document.activeElement !== opener) document.getElementById('main')?.focus({ preventScroll: true });   // opener hidden (nav pill, closed menu sheet)
  }
}
