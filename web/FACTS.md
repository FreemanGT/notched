# Notched — product facts (law for every agent)

Source of truth: `Notched/*.swift`, `project.yml`, `README.md`, `site/llms.txt`. If this file and the Swift disagree, the Swift wins: flag it, never invent.

## What it is
- **Notched** is a free, open-source (MIT) macOS menu bar app that hides the MacBook camera notch.
- How: it saves a **copy** of your wallpaper with a **black strip the exact height of the menu bar** baked into the top, and sets that copy as the desktop picture. The menu bar turns black, its text turns white, and the notch disappears into the bezel.
- Made by **Yiftach Freeman**. Version **1.0.2** (build 3) — the release script rewrites `"softwareVersion":"…"` in the JSON-LD of `site/index.html` and the `- Version:` line in `site/llms.txt`, so keep both patterns exactly.
- Requirements: **macOS 14 or later, Apple silicon** (arm64 only). Built for MacBooks with a notch; also works on external displays.
- Distribution: signed with Developer ID and **notarized by Apple**; updates via Sparkle (EdDSA-signed, delta updates).

## Features (all real — nothing else exists)
- **Dynamic wallpapers keep moving**: time-of-day and light/dark (HEIC) wallpapers keep every frame and their `apple_desktop` schedule. The first pass takes a few seconds ("Processing dynamic wallpaper… this takes a few seconds."). Toggle: "Use dynamic wallpapers" (on by default).
- **Every display and Space**: each screen gets its own copy at its own pixel resolution. Option: "Built-in display only". Other Spaces are fixed up when you visit them (public APIs only).
- **Rounded corners** under the band (concave fillets at each end so the desktop reads as a rounded screen): Small / Medium / Large = **10 / 14 / 20 pt**. On by default, Medium default.
- **Watches in the background**: polls every **2 seconds**; change your wallpaper and the bar is redone within about two seconds.
- **Rotation**: macOS can't shuffle wallpapers under the black bar, so Notched rotates a folder itself — every 5 min, 15 min, 30 min, hourly (default) or daily, plus a "Next" button. A shuffle folder already set in System Settings is taken over automatically.
- **Undo**: switch it off and your original wallpaper comes back. Other Spaces get theirs back the next time you visit them while Notched is running.
- Leaves **Aerial, colour and other live wallpapers** alone (nothing still to edit).
- Placement matches macOS: fill, fit, stretch or center, as the user set it.
- **Start at login**, **Hide menu bar icon** ("Open Notched again to bring it back."), **Check for Updates…**, Quit.
- Menu bar icon: a small screen with a bar across the top (SF Symbol `menubar.rectangle`); while an update waits it shows a down-arrow variant and the menu offers "Update to Notched x.y…" (gentle reminders, no window popping up).
- First launch: a "Welcome to Notched" licence dialog (Agree / Quit).

## The real UI (the living hero recreates this)
- The menu-bar window (`SettingsView.swift`), 340 pt wide, 18 pt side insets, 20 pt top inset, system font:
  - Row: **"Notched"** (title3 semibold) … switch "Hide the notch".
  - **Screen preview**: the main screen in miniature (its current wallpaper, with the band once processed) with the notch drawn on top, 8 pt radius, separator border.
  - Status line (callout, secondary): "Turn on to blacken the menu bar so the notch blends in." / "Notch hidden. New wallpapers are handled automatically." / "Wallpaper restored. Other Spaces get theirs back when you visit them." / "Processing wallpaper…"
  - Divider. Checkbox "Use dynamic wallpapers" + caption "Keeps time- and appearance-based wallpapers changing. Takes longer to process."
  - Checkbox "Round corners" + segmented Small | Medium | Large.
  - Checkbox "Built-in display only".
  - Checkbox "Rotate wallpapers" + caption "macOS can't shuffle under the black bar, so Notched rotates your pictures itself." → folder button "Choose Folder…", picker (5 min / 15 min / 30 min / Hourly / Daily), "Next".
  - Divider. "Start at login". "Hide menu bar icon" + caption "Open Notched again to bring it back."
  - Divider. "Check for Updates…" … "v1.0.2" (tertiary) … "Quit".
- Real renders to pixel-match: `site/assets/popover-light.png`, `site/assets/popover-dark.png` (2x).
- Renderer geometry (`WallpaperRenderer.swift`): band = full width × menu-bar height, pure black; fillets = concave quarter-circles of radius r hanging under each end of the band.
- App icon art (Liquid Glass): `AppIcon.icon/Assets/hills.svg`, `band.svg`, `menu.svg`; renders in `site/assets/icon-256.png`, `icon-512.png`. These are ours — reuse freely.

## Privacy (exact)
- Original wallpaper files are never modified. Copies live in `~/Library/Application Support/Notched`.
- The only network request is a **daily update check** against `https://notched.vercel.app/downloads/appcast.xml`. **No analytics, no account.**
- The website has no analytics and no tracking. Its one form is the download email ask below; the app itself still collects nothing.

## Download email ask (client decision 2026-10-06 — overrides anything in specs/ or the client brief that says "no forms / no email gate")
- Every **Download for Mac** CTA opens a dialog that **asks for an email (required)**. A valid email → the DMG (`/download`) starts **at once**; the download **never waits on the network** — the POST fires and is forgotten, and if it fails the download still happens. Invalid/blank → inline message, no download. Provide a quiet "Didn't start? Download again" link in the done state.
- Copy must say what it's for: e.g. "Used only for Notched updates. Kept in the maker's Google Sheet, never shared or sold." No marketing promises beyond updates.
- **Phones/tablets** (can't open a .dmg): the CTA reads "Get it on your Mac"; the dialog has an **optional** email and one button "Send the link to my Mac" (Web Share sheet, else copy link), which also saves the email if given.
- Endpoint (live, shared with Claude Meter's list — client chose this): put it in `<meta name="nt-signup" content="https://script.google.com/macros/s/AKfycbyYJTV8Mm_N77moH5FPesW6b_7Khdt2XHBn9IvVHSbHGw43RxAkXjgibvvWu-QkzNuMRA/exec">`. POST `fetch(url, {method:"POST", mode:"no-cors", body:new URLSearchParams(fields)})` with fields `type: "mac"`, `email`, `name: ""`, `platform: navigator.userAgentData?.platform || navigator.platform`, `ref: "notched" + (document.referrer ? " · " + document.referrer : "")` (the `ref` prefix is how the maker tells Notched signups apart — keep it), and honeypot `company` read from a hidden input named `nt_hp` (never name the input "company": autofill fills it). Email regex `/^[^@\s]+@[^@\s]+\.[^@\s]+$/` (same as the sheet). Remember a submitted email in localStorage so returning visitors get one-click download.
- Reference implementation to adapt (logic, not look): `/Users/freemansmain/Ai Projects/Claude Meter/site/js/lib/signup.js` + `cta.js` (native `<dialog>`, focus return, Esc/backdrop close, inert page, honeypot, never-blocking download). Notched's dialog should grow out of the notch / black band in Notched's own visual language.
- The privacy section/FAQ may mention: the site asks for an email only to send Notched updates; the app makes no requests except the daily update check.

## Links / CTAs
- Primary CTA: **Download for Mac** → opens the email dialog above, which downloads `/download` (Vercel redirect to the current DMG; keep it). It's free.
- Secondary: source on GitHub `https://github.com/FreemanGT/notched`.
- Cross-promo (keep, small): **Claude Meter** by the same maker — "puts your Claude usage limits right in the MacBook notch" → `https://claudemeter.vercel.app/?ref=notched` (icon `site/assets/claude-meter.png`).
- Canonical: `https://notched.vercel.app/`. Keep `/llms.txt`, `/robots.txt`, `/sitemap.xml`, `/downloads/*` (appcast + DMG + deltas, served by `site/vercel.json` headers) working and untouched.
- Keep the FAQPage + SoftwareApplication JSON-LD (update wording only if facts allow).

## Legal / brand rules
- Footer must say **"Not affiliated with Apple."** and "© 2026 Yiftach Freeman". MIT licence.
- **No Apple logo**, no Apple wallpapers, no Apple product photography, no SF Pro font files, no copied Apple marketing imagery. "MacBook", "macOS", "Mac" used descriptively only. Draw laptops/screens/menu bars ourselves (HTML/CSS/SVG/WebGL); wallpapers must be original (procedural shaders/SVG/gradients, or the app icon's hills art).
- No other companies' marks except the GitHub glyph on the source link.
- No invented features, numbers, testimonials, user counts, star counts, press quotes or awards.
- Tone: plain, confident, a little wry; British/US mix already used ("colour") — pick US spelling consistently except keep product-UI strings verbatim.

## Identity (client decision)
- Notched gets **its own identity**, visibly distinct from the maker's Claude Meter site (that one uses cool bone-silver paper, Anybody + Instrument Serif + Geist Mono, teal/lavender). Don't reuse those fonts or that palette.
- The brand idea writes itself: **black band, bezel, the notch dissolving, wallpaper light**. Black is the hero colour.
