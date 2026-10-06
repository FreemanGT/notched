#!/usr/bin/env node
/*
  Notched QA — headless Chrome screenshots + error report.

  node web/qa.mjs [options]
    --url <u>          page to load (default http://localhost:4321/)
    --viewport <v>     desktop (1440×900) | mobile (390×844) | both (default) | WxH (e.g. 1024x768)
    --reduced          emulate prefers-reduced-motion: reduce
    --steps <N>        scroll the page in N equal steps (default: 400px steps, as SPEC §8)
    --wait <ms>        settle time per step (default 350)
    --out <dir>        output dir (default <scratchpad>/qa/<run-id>)
    --run <name>       run id used for the default out dir (default: timestamp)
    --frames <spec>    capture 10 frames at 60ms at each position; comma list of
                       <px> | <pct>% (of max scroll) | <sectionId>:<progress> (pinned section progress 0..1)
                       e.g. --frames stage:.26,stage:.72,wall:.42,finale:.75
    --only-frames      skip the step pass (frames only)
    --intro            let the intro play and capture it (14 frames from first paint; default: skipped)
    --overflow         check scrollWidth ≤ innerWidth at 320,375,390,768,1024,1440,1920
    --full             also save a full-page screenshot per viewport
    --t <0|.25|.5|.75> time-of-day override (appends ?t= to the url)
    --sheet            download-sheet checks (script.google.com is ABORTED: no test email reaches the live sheet)
  Prints console errors, page errors, failed requests, long tasks (>50ms after load) and exits 1 on errors.
  Look at the screenshots with the Read tool: "it ran" is not "it's right".
*/
import puppeteer from "puppeteer-core";
import { mkdirSync } from "node:fs";
import { join } from "node:path";

const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const SCRATCH = "/private/tmp/claude-501/-Users-freemansmain-Ai-Projects-Notched/fc959023-bd43-4ab1-9c6c-40abca6f8b97/scratchpad";

const args = process.argv.slice(2);
const flag = (k) => args.includes(`--${k}`);
const opt = (k, d) => { const i = args.indexOf(`--${k}`); return i >= 0 && args[i + 1] && !args[i + 1].startsWith("--") ? args[i + 1] : d; };

let url = opt("url", "http://localhost:4321/");
if (opt("t")) url += (url.includes("?") ? "&" : "?") + "t=" + opt("t");
const vpArg = opt("viewport", "both");
const reduced = flag("reduced");
const steps = opt("steps") ? parseInt(opt("steps"), 10) : 0;
const wait = parseInt(opt("wait", "350"), 10);
const run = opt("run", new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19));
const out = opt("out", join(SCRATCH, "qa", run));
const frames = (opt("frames", "") || "").split(",").filter(Boolean);
const VPS = { desktop: { width: 1440, height: 900 }, mobile: { width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 } };
const viewports = vpArg === "both" ? ["desktop", "mobile"] : [vpArg];
mkdirSync(out, { recursive: true });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const report = { errors: [], warnings: [], longTasks: [], overflow: [], shots: 0 };

const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ["--hide-scrollbars", "--force-color-profile=srgb"] });

async function openPage(vpName) {
  const page = await browser.newPage();
  const vp = VPS[vpName] || (() => { const [w, h] = vpName.split("x").map(Number); return { width: w, height: h }; })();
  await page.setViewport({ deviceScaleFactor: 1, ...vp });
  if (vp.isMobile) await page.setUserAgent("Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1");
  await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: reduced ? "reduce" : "no-preference" }]);
  const tag = `[${vpName}${reduced ? "/reduced" : ""}]`;
  page.on("console", (m) => {
    if (m.type() === "error" && /ERR_FAILED|ERR_ABORTED/.test(m.text()) && flag("sheet")) return;   // aborted sheet POSTs
    if (m.type() === "error") report.errors.push(`${tag} console: ${m.text()}`);
    else if (m.type() === "warn") report.warnings.push(`${tag} warn: ${m.text()}`);
  });
  page.on("pageerror", (e) => report.errors.push(`${tag} pageerror: ${e.message}`));
  page.on("requestfailed", (r) => { if (!/\.dmg$|\/download$|script\.google\.com/.test(r.url())) report.errors.push(`${tag} requestfailed: ${r.url()} ${r.failure()?.errorText}`); });
  page.on("response", (r) => { if (r.status() >= 400 && !r.url().endsWith(".dmg")) report.errors.push(`${tag} HTTP ${r.status()}: ${r.url()}`); });
  await page.evaluateOnNewDocument((skipIntro) => {
    if (skipIntro) try { sessionStorage.setItem("nt-intro", "1"); } catch {}
    window.__longTasks = [];
    addEventListener("load", () => {
      setTimeout(() => new PerformanceObserver((l) => l.getEntries().forEach((e) => window.__longTasks.push(Math.round(e.duration)))).observe({ type: "longtask" }), 1500);
    });
  }, !flag("intro"));
  if (flag("intro")) {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
    for (let f = 0; f < 14; f++) {
      await page.screenshot({ path: join(out, `${vpName}-intro-${String(f).padStart(2, "0")}.png`) });
      report.shots++;
      await sleep(70);
    }
  } else await page.goto(url, { waitUntil: "networkidle0", timeout: 30000 });
  await sleep(900);
  return { page, tag };
}

// Native scroll (no Lenis on this site).
const scrollTo = (page, y) => page.evaluate((y) => { window.scrollTo(0, y); window.ScrollTrigger?.update(); }, y);

async function resolvePos(page, spec) {
  return page.evaluate((spec) => {
    const max = document.documentElement.scrollHeight - innerHeight;
    if (/^\d+$/.test(spec)) return +spec;
    if (spec.endsWith("%")) return (parseFloat(spec) / 100) * max;
    const [id, p] = spec.split(":");
    const el = document.getElementById(id);
    // Sticky tracks: progress 0..1 maps top-top → bottom-bottom (SPEC §2.2: pins are CSS sticky).
    if (!el) return 0;
    const top = el.getBoundingClientRect().top + scrollY, travel = Math.max(0, el.offsetHeight - innerHeight);
    return top + parseFloat(p || 0) * (travel || el.offsetHeight);
  }, spec);
}

for (const vpName of viewports) {
  const { page, tag } = await openPage(vpName);
  const prefix = `${vpName}${reduced ? "-reduced" : ""}`;
  const max = await page.evaluate(() => document.documentElement.scrollHeight - innerHeight);
  console.log(`${tag} ${url} · scroll height ${max + (VPS[vpName]?.height || 0)}px`);

  if (!flag("only-frames")) {
    const ys = [];
    if (steps > 0) for (let i = 0; i <= steps; i++) ys.push(Math.round((max * i) / steps));
    else for (let y = 0; y < max; y += 400) ys.push(y);
    if (ys[ys.length - 1] !== max) ys.push(max);
    for (const [i, y] of ys.entries()) {
      await scrollTo(page, y);
      await sleep(wait);
      await page.screenshot({ path: join(out, `${prefix}-${String(i).padStart(3, "0")}-y${y}.png`) });
      report.shots++;
    }
  }

  for (const spec of frames) {
    const y = await resolvePos(page, spec);
    await scrollTo(page, Math.max(0, y - 200));
    await sleep(wait);
    await scrollTo(page, y);
    for (let f = 0; f < 10; f++) {
      await page.screenshot({ path: join(out, `${prefix}-frames-${spec.replace(/[:%.]/g, "_")}-${f}.png`) });
      report.shots++;
      await sleep(60);
    }
  }

  if (flag("full")) {
    await scrollTo(page, 0); await sleep(wait);
    await page.screenshot({ path: join(out, `${prefix}-full.png`), fullPage: true });
  }

  // A section whose height changes after its init shifts everything below it mid-scroll (main.js records h at init).
  const grew = await page.evaluate(() => [...(window.__nt?.sections || [])].filter(([id, s]) => s.h != null && document.getElementById(id)?.offsetHeight !== s.h).map(([id, s]) => `#${id} ${s.h}→${document.getElementById(id).offsetHeight}px`));
  if (grew.length) report.errors.push(`${tag} section height changed after init: ${grew.join(", ")}`);

  const lt = await page.evaluate(() => window.__longTasks);
  if (lt.length) report.longTasks.push(`${tag} ${lt.length} long tasks: ${lt.join(", ")}ms`);
  await page.close();
}

if (flag("overflow")) {
  for (const w of [320, 375, 390, 768, 1024, 1440, 1920]) {
    const page = await browser.newPage();
    await page.setViewport({ width: w, height: 900 });
    await page.evaluateOnNewDocument(() => { try { sessionStorage.setItem("nt-intro", "1"); } catch {} });
    await page.goto(url, { waitUntil: "networkidle0" });
    await sleep(600);
    const r = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, iw: innerWidth }));
    if (r.sw > r.iw) report.overflow.push(`${w}px: scrollWidth ${r.sw} > ${r.iw}`);
    await page.close();
  }
}

if (flag("sheet")) await sheetChecks().catch((e) => report.errors.push(`[sheet] crashed: ${e.message.split("\n")[0]}`));

async function sheetChecks() {
  const log = (ok, msg) => (ok ? console.log(`  ok   ${msg}`) : report.errors.push(`[sheet] FAIL ${msg}`));
  for (const vpName of ["desktop", "mobile"]) {
    const { page } = await openPage(vpName);
    await page.setRequestInterception(true);
    const reqs = [];
    page.on("request", (r) => {
      const u = r.url();
      if (/script\.google\.com/.test(u)) { reqs.push({ t: Date.now(), kind: "post" }); return r.abort(); }
      if (/\/download(\?|$)|\.dmg/.test(u)) { reqs.push({ t: Date.now(), kind: "download" }); return r.respond({ status: 204, body: "" }); }
      r.continue();
    });
    console.log(`[sheet/${vpName}]`);
    await page.evaluate(() => { try { localStorage.removeItem("nt-email"); } catch {} });
    const cta = await page.$('main [data-cta="mac"]') || await page.$('[data-cta="mac"]');
    const label = await page.evaluate(() => [...document.querySelectorAll('[data-cta="mac"] .cta__label')].map((n) => n.textContent));
    if (vpName === "mobile") log(label.every((l) => /Get it/.test(l)), `phone CTAs read "Get it on your Mac" (${label[0]})`);
    await page.evaluate(() => { const vis = [...document.querySelectorAll('[data-cta="mac"]')].filter((n) => n.offsetParent && !n.closest("dialog")); const el = vis.find((n) => n.closest("main")) || vis[0] || document.querySelector('[data-cta="mac"]'); window.__qaOpener = el; el.scrollIntoView({ block: "center" }); el.focus(); el.click(); });
    await sleep(800);
    const opened = await page.evaluate(() => !!document.querySelector("dialog.sheet[open]"));
    log(opened, "CTA opens the dialog");
    if (!opened) { await page.close(); continue; }
    await page.screenshot({ path: join(out, `sheet-${vpName}-open.png`) }); report.shots++;
    log(!reqs.some((r) => r.kind === "post"), "no fetch before submit");
    if (vpName === "desktop") {
      await page.evaluate(() => document.querySelector(".sheet form").requestSubmit());
      await sleep(400);
      log(await page.evaluate(() => /Add your email/.test(document.getElementById("sheet-err")?.textContent)), "blank submit shows the error");
      log(!reqs.some((r) => r.kind === "download"), "blank submit: no /download");
      await page.type("#sheet-email", "nope@");
      await page.evaluate(() => document.querySelector(".sheet form").requestSubmit());
      await sleep(400);
      log(await page.evaluate(() => /doesn't look right/.test(document.getElementById("sheet-err")?.textContent)), "invalid submit shows the error");
      await page.screenshot({ path: join(out, `sheet-desktop-error.png`) }); report.shots++;
      await page.evaluate(() => { document.getElementById("sheet-email").value = ""; });
      await page.type("#sheet-email", "qa@example.com");
      await page.evaluate(() => document.querySelector(".sheet form").requestSubmit());
      await sleep(1200);
      const d = reqs.findIndex((r) => r.kind === "download"), p = reqs.findIndex((r) => r.kind === "post");
      // a.click() navigations surface a tick after the synchronous fetch; "first" = never gated on the POST.
      log(d >= 0 && (p < 0 || Math.abs(reqs[d].t - reqs[p].t) < 150), `valid email: /download fires at once, not after the POST (download #${d}, post #${p})`);
      log(await page.evaluate(() => /On its way/.test(document.getElementById("sheet-title")?.textContent)), "macDone shows");
      await page.screenshot({ path: join(out, `sheet-desktop-done.png`) }); report.shots++;
      await page.keyboard.press("Escape"); await sleep(600);
      log(await page.evaluate(() => !document.querySelector("dialog.sheet[open]")), "Esc closes");
      log(await page.evaluate(() => document.activeElement === window.__qaOpener || !window.__qaOpener.offsetParent), "focus returns to the opener");
      const before = reqs.filter((r) => r.kind === "download").length;
      await page.evaluate(() => window.__qaOpener.click());
      await sleep(800);
      log(reqs.filter((r) => r.kind === "download").length > before, "stored email: second click downloads at once");
      log(await page.evaluate(() => /goes to qa@example.com/.test(document.querySelector(".sheet")?.textContent)), "returning view names the email");
    } else {
      log(await page.evaluate(() => /Get it on your Mac/.test(document.getElementById("sheet-title")?.textContent)), "macAway view");
      for (const w of [320, 390]) {
        await page.setViewport({ width: w, height: 800, isMobile: true, hasTouch: true });
        await sleep(300);
        const r = await page.evaluate(() => { const p = document.querySelector(".sheet__panel").getBoundingClientRect(); return { l: p.left, r: p.right, iw: innerWidth }; });
        log(r.l >= 0 && r.r <= r.iw, `${w}px: panel inside the viewport (${Math.round(r.l)}–${Math.round(r.r)})`);
        await page.screenshot({ path: join(out, `sheet-mobile-${w}.png`) }); report.shots++;
      }
    }
    await page.close();
  }
}

await browser.close();
console.log(`\nshots: ${report.shots} → ${out}`);
for (const k of ["errors", "longTasks", "overflow", "warnings"]) {
  if (!report[k].length) { console.log(`${k}: none`); continue; }
  console.log(`${k} (${report[k].length}):`);
  [...new Set(report[k])].slice(0, 40).forEach((l) => console.log("  " + l));
}
process.exit(report.errors.length || report.overflow.length ? 1 : 0);
