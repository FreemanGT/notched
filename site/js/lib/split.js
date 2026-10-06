// SplitText wrappers (masks, autoSplit). Split copies are aria-hidden; the real text stays for AT.
// Each returns the SplitText instance (call .revert() in cleanup). Use inside onSplit for autoSplit tweens:
//   splitLines(h, { onSplit: (s) => gsap.from(s.lines, { yPercent: 105 }) })  // return the tween so it re-runs on resplit
const ST = () => { const S = window.SplitText; window.gsap.registerPlugin(S); return S; };
function make(el, type, opts) {
  const s = ST().create(el, { type, mask: type.split(',')[0].trim(), autoSplit: true, aria: 'auto', ...opts });
  return s;
}
export const splitChars = (el, opts = {}) => make(el, 'chars', { charsClass: 'ch', ...opts });
export const splitWords = (el, opts = {}) => make(el, 'words', { wordsClass: 'wd', ...opts });
export const splitLines = (el, opts = {}) => make(el, 'lines', { linesClass: 'ln', ...opts });
