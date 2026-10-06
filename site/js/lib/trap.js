/** Keep Tab / Shift+Tab inside a dialog: wrap from the last focusable to the first and back. */
export function trapTab(dlg) {
  dlg.addEventListener('keydown', (e) => {
    if (e.key !== 'Tab') return;
    const f = [...dlg.querySelectorAll('a[href],button:not([disabled]),input:not([type=hidden]):not([tabindex="-1"])')].filter((n) => n.offsetParent && !n.closest('[inert]'));
    if (!f.length) return;
    const [a, z] = [f[0], f[f.length - 1]];
    if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); }
    else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); }
  });
}
