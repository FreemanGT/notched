// Tiny reactive store. state has accessor props, so gsap.to(store.state, { band: 1 }) tweens it directly.
// Subscribers are batched to one rAF and receive (state, changedKeys:Set).
export function createStore(initial) {
  const data = { ...initial }, subs = new Set(), changed = new Set();
  let queued = false;
  const flush = () => { queued = false; const keys = new Set(changed); changed.clear(); subs.forEach((fn) => fn(state, keys)); };
  const write = (k, v) => {
    if (Object.is(data[k], v)) return;
    data[k] = v; changed.add(k);
    if (!queued) { queued = true; requestAnimationFrame(flush); }
  };
  const state = {};
  for (const k of Object.keys(initial)) Object.defineProperty(state, k, { enumerable: true, get: () => data[k], set: (v) => write(k, v) });
  return {
    state,
    get: () => ({ ...data }),
    set(patch) { for (const k in patch) { if (!(k in state)) Object.defineProperty(state, k, { enumerable: true, get: () => data[k], set: (v) => write(k, v) }); write(k, patch[k]); } },
    subscribe(fn, { now = false } = {}) { subs.add(fn); if (now) fn(state, new Set(Object.keys(data))); return () => subs.delete(fn); },
    /** Synchronous flush (tests, or when a frame must reflect a set() immediately). */
    flush,
  };
}
