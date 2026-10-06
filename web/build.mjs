#!/usr/bin/env node
// node web/build.mjs — stitches web/index.html + web/sections/<id>.html → site/index.html.
// Also: one <link> per section stylesheet, and FAQPage JSON-LD parsed from #faq <details>.
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { createHash } from "node:crypto";

const here = dirname(fileURLToPath(import.meta.url));
const site = join(here, "..", "site");
export const SECTIONS = ["hero", "gone", "try", "features", "how", "privacy", "faq", "download"];
// Version single source: MARKETING_VERSION in ../project.yml (SPEC §8).
const VERSION = (readFileSync(join(here, "..", "project.yml"), "utf8").match(/MARKETING_VERSION:\s*"?([\d.]+)/) || [])[1] || "1.0.2";

let html = readFileSync(join(here, "index.html"), "utf8");
const missing = [];

html = html.replace(/<!-- @section:([a-z-]+) -->/g, (_, id) => {
  const f = join(here, "sections", `${id}.html`);
  if (!existsSync(f)) {
    missing.push(id);
    return `<section id="${id}" class="s s--${id}" data-section="${id}" aria-label="${id}"></section>`;
  }
  return readFileSync(f, "utf8").trim();
});

// Version: JSON-LD softwareVersion + every [data-version] fallback text (version.js re-syncs at runtime).
html = html
  .replace(/"softwareVersion":"[^"]*"/, `"softwareVersion":"${VERSION}"`)
  .replace(/(<([a-z0-9]+)\b[^>]*\sdata-version(?:=""|)[^>]*>)[^<]*(<\/\2>)/g, `$1v${VERSION}$3`)
  .replaceAll("%VERSION%", VERSION);

html = html.replace("<!-- @section-css -->", SECTIONS
  .filter((id) => existsSync(join(site, "css", `${id}.css`)))
  .map((id) => `<link rel="stylesheet" href="/css/${id}.css">`).join("\n"));

// <link rel=modulepreload> for what first paint needs: main.js's static graph, the hero and the product
// component. Below-the-fold section modules load on demand (main.js idle-loads them top to bottom).
const js = join(site, "js");
const graph = new Set();
const walk = (rel) => {
  if (graph.has(rel) || !existsSync(join(js, rel))) return;
  graph.add(rel);
  const src = readFileSync(join(js, rel), "utf8");
  const dir = dirname(rel);
  for (const [, spec] of src.matchAll(/\bfrom\s*["'](\.{1,2}\/[^"']+\.js)["']/g)) walk(join(dir, spec));
};
["main.js", "hero.js", "lib/component.js"].forEach(walk);
html = html.replace("<!-- @modulepreload -->", [...graph].filter((f) => f !== "main.js" && f !== "lib/signup.js")   // signup.js is lazy (first CTA intent)
  .map((f) => `<link rel="modulepreload" href="/js/${f}">`).join("\n"));

// FAQPage JSON-LD from the #faq section's <details>, so the text is identical to the page.
const text = (s) => s
  .replace(/<svg[\s\S]*?<\/svg>/g, "")
  .replace(/<(script|style)[\s\S]*?<\/\1>/g, "")
  .replace(/<[^>]+>/g, " ")
  .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;|&rsquo;/g, "’")
  .replace(/&#8209;|\u2011/g, "-")   // non-breaking hyphens are typography: crawlers should see "API-key", "sign-in"
  .replace(/\s+/g, " ").trim();
const faqSection = (html.match(/<section[^>]*id="faq"[\s\S]*?<\/section>/) || [""])[0];
const qa = [...faqSection.matchAll(/<details[^>]*>([\s\S]*?)<\/details>/g)].map(([, inner]) => {
  const summary = (inner.match(/<summary[^>]*>([\s\S]*?)<\/summary>/) || ["", ""])[1];
  const q = summary.match(/class="[^"]*\bfaq__q\b[^"]*"[^>]*>([\s\S]*?)<\/(?:span|h3|p|div)>/);
  const question = text(q ? q[1] : summary).replace(/^\d{1,3}%\s*/, "");
  const answer = text(inner.replace(/<summary[\s\S]*?<\/summary>/, ""));
  return { question, answer };
}).filter((x) => x.question && x.answer);

html = html.replace("<!-- @faq-jsonld -->", qa.length
  ? `<script type="application/ld+json">${JSON.stringify({
      "@context": "https://schema.org", "@type": "FAQPage",
      mainEntity: qa.map((x) => ({ "@type": "Question", name: x.question, acceptedAnswer: { "@type": "Answer", text: x.answer } })),
    }).replace(/</g, "\\u003c")}</script>`
  : "");

// Drop links to stylesheets that don't exist yet (e.g. product.css before the product agent lands).
html = html.replace(/<link rel="stylesheet" href="\/(css\/[\w-]+\.css)">\n?/g, (m, f) => existsSync(join(site, f)) ? m : "");

// One render-blocking stylesheet: concatenate every head stylesheet (in order) into css/site.css. The sources stay
// in css/ (sections edit them; component-lab.html links them directly). sheet.css stays lazy (signup.js).
const sheets = [];
html = html.replace(/<link rel="stylesheet" href="\/(css\/[\w-]+\.css)">\n?/g, (m, f) => { sheets.push(f); return sheets.length === 1 ? "<!-- @site-css -->\n" : ""; });
const css = `/* Built by web/build.mjs from ${sheets.join(", ")}. Edit those, not this. */\n` + sheets.map((f) => `/* ---- ${f} */\n${readFileSync(join(site, f), "utf8")}`).join("\n");
writeFileSync(join(site, "css", "site.css"), css);
html = html.replace("<!-- @site-css -->", `<link rel="stylesheet" href="/css/site.css?v=${createHash("sha1").update(css).digest("hex").slice(0, 8)}">`);

writeFileSync(join(site, "index.html"), html);
const h1 = (html.match(/<h1[\s>]/g) || []).length;
console.log(`built site/index.html · v${VERSION} · ${(html.length / 1024).toFixed(1)} KB · ${qa.length} FAQ entries · ${h1} <h1> · ${graph.size - 1} modulepreloads · css/site.css from ${sheets.length} files`);
if (missing.length) console.error(`\x1b[31mWARNING: missing section files → empty placeholders: ${missing.join(", ")}\x1b[0m`);
if (h1 !== 1) console.error(`\x1b[31mWARNING: expected exactly one <h1>, found ${h1}\x1b[0m`);
if (qa.length && qa.length !== 8) console.error(`\x1b[33mnote: FAQ has ${qa.length} entries (SPEC says 8)\x1b[0m`);
