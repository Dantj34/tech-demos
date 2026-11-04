# teardown — MVP plan

## Goal
Let one user open and play with teardown-style 3D machine simulators (take-apart, cutaways, live gauges, auto tour) in the browser, and optionally generate a new one from a short description.

## What teardown actually is
[elvarofficial/teardown](https://github.com/elvarofficial/teardown) (MIT) is a Claude Code skill. Claude writes a single offline HTML page: a three.js machine driven by one math model that also feeds the gauges, with subsystem buttons, cutaways, camera views and an idle auto tour. It ships three finished machines (`v8-live`, `cessna-live`, `strandbeest-live`), built with `node sims/build.mjs <name>` into `teardown-out/dist/*.html`. It is not a generic photo-to-3D model.

## Single-user MVP
**In**
- Gallery page listing the three bundled machines; clicking one opens its simulator full-screen (iframe or direct page)
- Build the bundled sims from the upstream repo at a pinned commit (vendor or fetch at build time; keep MIT LICENSE + attribution)
- Optional "Describe a machine" mode: text prompt (plus optional reference image) → server calls Claude with the upstream SKILL.md as instructions → returns one HTML page → shown in the viewer. Only enabled when `ANTHROPIC_API_KEY` is set server-side; otherwise a clear setup note
- Self-contained under `apps/teardown/`, starts with `bun install && bun run dev`

**Out**
- 60 fps film recording, procedural score, sound tooling (needs ffmpeg/Python)
- Multi-step review loops from the article
- Auth, persistence, multi-user

## Outcome-oriented tasks
1. Scaffold Vite + React + TS with Bun; `bunfig.toml` with `[install] minimumReleaseAge = 259200` before any install
2. shadcn/ui (minimal) gallery + viewer shell
3. Get the three bundled sims building and served as static pages
4. Optional generate route keeping the key server-side; sanitize/sandbox the generated HTML in an iframe
5. Smoke-test: open each bundled machine, use a subsystem button and a cutaway; screenshot + short video for the PR

## Stack
- **Bun** for runtime and packages (repo default)
- **Vite + React + TS** because this is a one-screen utility
- **shadcn/ui** for a minimal UI
- **teardown (upstream)** because it's the bookmarked tech; use its build script and shipped sims
- **three.js**, which the upstream sims already inline

## Deferred
- Film/score export
- Saving generated machines
- Cloudflare Pages wiring

## Source
https://x.com/Nyxera0x/status/2117320669838880781
