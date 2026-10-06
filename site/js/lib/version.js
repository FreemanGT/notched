// fillVersion(): JSON-LD softwareVersion → every [data-version] (release.sh seds the JSON-LD only).
export function version() {
  for (const s of document.querySelectorAll('script[type="application/ld+json"]')) {
    const m = s.textContent.match(/"softwareVersion":"([^"]+)"/);
    if (m) return m[1];
  }
  return '';
}
export function fillVersion(root = document) {
  const v = version();
  if (v) root.querySelectorAll('[data-version]').forEach((n) => { n.textContent = `v${v}`; });
  return v;
}
