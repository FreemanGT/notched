# Notched

macOS menu bar app that hides the MacBook notch by baking a black menu-bar band into a copy of the wallpaper.

## Commands

- `xcodegen generate` — regenerate `Notched.xcodeproj` from `project.yml` (the project file is gitignored)
- `xcodebuild -project Notched.xcodeproj -scheme Notched -derivedDataPath build build` — Debug build, ad-hoc signed
- `build/Build/Products/Debug/Notched.app/Contents/MacOS/Notched --selftest` — renderer checks
- `scripts/release.sh` — Developer ID archive, notarized DMG, Sparkle appcast, Vercel deploy, tag

## Skill routing

When the user's request matches an available skill, invoke it via the Skill tool. When in doubt, invoke the skill.

Key routing rules:
- Product ideas/brainstorming → invoke /office-hours
- Strategy/scope → invoke /plan-ceo-review
- Architecture → invoke /plan-eng-review
- Design system/plan review → invoke /design-consultation or /plan-design-review
- Full review pipeline → invoke /autoplan
- Bugs/errors → invoke /investigate
- QA/testing site behavior → invoke /qa or /qa-only
- Code review/diff check → invoke /review
- Visual polish → invoke /design-review
- Ship/deploy/PR → invoke /ship or /land-and-deploy
- Save progress → invoke /context-save
- Resume context → invoke /context-restore
- Author a backlog-ready spec/issue → invoke /spec
