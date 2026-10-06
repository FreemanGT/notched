// bandText(el, { origin }) — the house typographic tool (SPEC §2.4).
// Clones el's content into an aria-hidden, inert overlay (white text on a black bar) clipped by inset().
// set(p) 0..1 grows the bar from origin ('center' | 'left' | 'right'); setEdges(l, r) sets the
// uncovered fractions (0..1) from each side directly (e.g. an exit to the right: setEdges(p, 0)).
export function bandText(el, { origin = 'center' } = {}) {
  el.classList.add('bt-host');
  const ov = document.createElement('span');
  ov.className = 'bandtext';
  ov.setAttribute('aria-hidden', 'true');
  ov.inert = true;
  const refresh = () => {
    ov.innerHTML = '';
    for (const n of el.childNodes) if (n !== ov) ov.appendChild(n.cloneNode(true));
    ov.querySelectorAll('[id]').forEach((n) => n.removeAttribute('id'));
  };
  refresh();
  el.appendChild(ov);
  const setEdges = (l, r) => {
    ov.style.setProperty('--bt-l', `${(l * 100).toFixed(3)}%`);
    ov.style.setProperty('--bt-r', `${(r * 100).toFixed(3)}%`);
    if (l + r >= 0.9999) ov.setAttribute('data-off', ''); else ov.removeAttribute('data-off');
  };
  const set = (p) => {
    p = Math.min(1, Math.max(0, p));
    if (origin === 'left') setEdges(0, 1 - p);
    else if (origin === 'right') setEdges(1 - p, 0);
    else setEdges((1 - p) / 2, (1 - p) / 2);
  };
  set(0);
  return { el: ov, set, setEdges, refresh, destroy() { ov.remove(); el.classList.remove('bt-host'); } };
}
