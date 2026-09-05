# text-to-cad — MVP plan

## Goal
Let one user type a short natural-language part prompt, generate a single CAD mesh, preview it in the browser, and download STL or GLB.

## Generation path (chosen)
**Constrained prompt → template mapper → build123d Python sidecar.**

text-to-cad itself is an agent-skills library (not an npm package). This demo is inspired by that stack — Python **build123d** / OpenCascade, STL + GLB export — but does **not** install Cursor/Codex skills at runtime.

A Bun server parses the prompt into a small catalog of part kinds (`cube`, `cube_with_hole`, `cylinder`, `washer`, `bracket`, `flange`) plus millimeter parameters, then a Python sidecar builds a BREP solid and exports `model.stl` + `model.glb`.

Examples the mapper handles: “a 20mm cube with a 5mm hole”, “a simple bracket”, “30mm washer 8mm ID”.

This is the MVP path. Full LLM codegen of arbitrary build123d scripts is deferred (too heavy / brittle for the cloud VM).

## Single-user MVP
**In**
- One prompt input → one generation job
- In-browser 3D preview of the resulting mesh (GLB)
- STL and GLB download
- Self-contained app under `apps/text-to-cad/` — `bun install && bun run dev`
- Minimal UI: prompt, generate, preview, download, plus an interpretation of the mapped part

**Out**
- Full CAD editor / parametric timeline
- Multi-part assemblies
- Cloud GPU / remote inference accounts
- Auth, multi-user, persistence beyond the current session
- Installing text-to-cad agent skills at runtime
- Mobile polish

## Outcome-oriented tasks
1. Scaffold with `bunx create-vite` (React + TypeScript), add root `bunfig.toml` with `[install] minimumReleaseAge = 259200` before any install
2. Wire shadcn/ui (minimalist) for prompt form + buttons
3. Bun API + Python build123d sidecar; prompt mapper returns mesh bytes / file URLs
4. react-three-fiber + drei viewer for GLB preview
5. STL/GLB download buttons for the last successful generation
6. Smoke-test end-to-end: prompt → mesh → preview → download; capture screenshot + short video for the PR

## Stack (one-line rationale)
- **Bun** — repo default runtime/package manager
- **Vite + React + TS** — one-screen utility; lighter than a full Next/TanStack app
- **shadcn/ui (lyra)** — opinionated minimal UI without inventing components
- **build123d sidecar** — same CAD kernel family as text-to-cad; real BREP + STL/GLB
- **@react-three/fiber + drei** — boring, well-documented mesh preview with React lifecycle

## Deferred
- LLM codegen of free-form build123d scripts — mapper is enough for a reliable demo
- STEP/DXF/3MF export paths beyond STL/GLB
- Prompt history / gallery — session-only is enough
- Cloudflare Pages deploy wiring — can follow after the PR validates

## Source bookmark
https://x.com/earthtojake/status/2096020381547008327

Upstream: https://github.com/earthtojake/text-to-cad
