// onClock(fn) → unsub. fn(text, date) now and on every minute boundary. One shared timer; client-only.
const fmt = new Intl.DateTimeFormat(undefined, { weekday: 'short', hour: '2-digit', minute: '2-digit' });
const subs = new Set();
let timer = 0;
export const formatClock = (d = new Date()) => fmt.format(d).replace(',', '');
const tick = () => {
  const d = new Date(), text = formatClock(d);
  subs.forEach((fn) => fn(text, d));
  clearTimeout(timer);
  if (subs.size && !document.hidden) timer = setTimeout(tick, 60000 - (d.getSeconds() * 1000 + d.getMilliseconds()) + 20);
};
document.addEventListener('visibilitychange', () => { if (!document.hidden && subs.size) tick(); else clearTimeout(timer); });
export function onClock(fn) {
  subs.add(fn);
  fn(formatClock(), new Date());
  if (subs.size === 1) tick();
  return () => { subs.delete(fn); if (!subs.size) clearTimeout(timer); };
}
