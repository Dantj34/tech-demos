# text-to-cad — MVP plan

## Goal
Let one user type a short natural-language part prompt, generate a single CAD mesh via text-to-cad, preview it in the browser, and download STL or GLB.

## Single-user MVP
**In**
- One prompt input → one generation job
- Prefer the real text-to-cad / earthtojake open-source library or agent-skill package if it installs cleanly under Bun; otherwise a thin adapter that calls its documented CLI/API
- In-browser 3D preview of the resulting mesh (GLB preferred for preview; STL download also available)
- Self-contained app under `apps/text-to-cad/` — `bun install && bun run dev` from that folder
- Minimal UI: prompt, generate, preview, download

**Out**
- Full CAD editor / parametric timeline
- Multi-part assemblies
- Cloud GPU / remote inference accounts
- Auth, multi-user, persistence beyond the current session
- Mobile polish

## Outcome-oriented tasks
1. Scaffold with `bunx create-vite` (React + TypeScript), add root `bunfig.toml` with `[install] minimumReleaseAge = 259200` before any install
2. Wire shadcn/ui (minimalist) for prompt form + buttons
3. Integrate text-to-cad generation path (library or CLI) and expose a local server action/API route that returns mesh bytes or a file path
4. Add a Three.js / react-three-fiber (or equivalent prebuilt) viewer for GLB preview
5. Add STL/GLB download buttons for the last successful generation
6. Smoke-test end-to-end: prompt → mesh → preview → download; capture screenshot + short video for the PR

## Stack (one-line rationale)
- **Bun** — repo default runtime/package manager
- **Vite + React + TS** — one-screen utility; lighter than a full Next/TanStack app
- **shadcn/ui** — opinionated minimal UI without inventing components
- **text-to-cad (earthtojake / OSS)** — the bookmarked tech under demo; use the published package/CLI if available
- **Three.js / R3F (or model-viewer)** — boring, well-documented mesh preview

## Deferred
- STEP/DXF/3MF export paths beyond STL/GLB — MVP only needs preview + one downloadable solid
- Prompt history / gallery — session-only is enough
- Cloudflare Pages deploy wiring — can follow after the PR validates

## Source bookmark
https://x.com/earthtojake/status/2096020381547008327
