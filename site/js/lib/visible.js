// whenVisible(el, onIn, onOut, rootMargin='10%') → unobserve(). One IntersectionObserver per rootMargin.
// Also fires onOut when the tab is hidden and onIn again when it returns (if still on screen).
const observers = new Map(), entries = new Map();

function observer(rootMargin) {
  if (!observers.has(rootMargin)) observers.set(rootMargin, new IntersectionObserver((list) => {
    for (const e of list) for (const rec of entries.get(e.target) || []) if (rec.rootMargin === rootMargin) {
      if (e.isIntersecting === rec.on) continue;
      rec.on = e.isIntersecting;
      if (document.hidden) continue;
      (rec.on ? rec.onIn : rec.onOut)?.();
    }
  }, { rootMargin }));
  return observers.get(rootMargin);
}

document.addEventListener('visibilitychange', () => {
  for (const recs of entries.values()) for (const r of recs) if (r.on) (document.hidden ? r.onOut : r.onIn)?.();
});

export function whenVisible(el, onIn, onOut, rootMargin = '10%') {
  const rec = { onIn, onOut, rootMargin, on: false };
  if (!entries.has(el)) entries.set(el, new Set());
  entries.get(el).add(rec);
  observer(rootMargin).observe(el);
  return () => {
    const set = entries.get(el); set?.delete(rec);
    if (!set?.size) { entries.delete(el); observers.forEach((o) => o.unobserve(el)); }
    else if (![...set].some((r) => r.rootMargin === rootMargin)) observers.get(rootMargin).unobserve(el);
  };
}
