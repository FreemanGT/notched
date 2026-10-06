// Site-wide prefs written by the #try popover (SPEC §2.4). localStorage is a per-viewer convenience only.
import { createStore } from './store.js';

const KEY = 'nt-settings';
const dark = matchMedia('(prefers-color-scheme: dark)');
const DEFAULTS = { on: false, corners: true, radius: 14, dynamic: true, builtInOnly: false, rotate: false, every: 3600, folder: '', loginItem: true, iconHidden: false, appearance: dark.matches ? 'dark' : 'light' };
const PERSIST = ['corners', 'radius', 'dynamic', 'builtInOnly', 'rotate', 'every', 'loginItem', 'iconHidden', 'appearance'];

let saved = {};
try { saved = JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch {}
const pick = (o) => Object.fromEntries(PERSIST.filter((k) => k in o).map((k) => [k, o[k]]));

export const settings = createStore({ ...DEFAULTS, ...pick(saved) });

const html = document.documentElement;
const apply = (s) => {
  html.style.setProperty('--r-site-pt', s.corners ? s.radius : 0);   // tokens.css: --r-site = --r-site-pt × --pt
  html.classList.toggle('icon-hidden', !!s.iconHidden);
};
apply(settings.state);
settings.subscribe((s) => {
  apply(s);
  try { localStorage.setItem(KEY, JSON.stringify(pick(s))); } catch {}
});
