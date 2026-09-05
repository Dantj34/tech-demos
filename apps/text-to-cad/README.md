# text-to-cad demo

Single-user web app: type a short natural-language part prompt, generate one solid with **build123d**, preview the GLB, download STL and/or GLB.

Inspired by [earthtojake/text-to-cad](https://github.com/earthtojake/text-to-cad) and the bookmark [text-to-cad v0.5](https://x.com/earthtojake/status/2096020381547008327).

## Generation path

**Constrained prompt → template mapper → Python build123d sidecar.**

Upstream text-to-cad is an agent-skills library, not an npm package. This demo does **not** install Cursor/Codex skills at runtime. A Bun server maps prompts onto a small catalog (`cube`, `cube_with_hole`, `cylinder`, `washer`, `bracket`, `flange`) and a Python sidecar builds a BREP solid, then exports `model.stl` + `model.glb`.

Examples: `a 20mm cube with a 5mm hole`, `a simple bracket`, `washer 25mm OD 8mm ID`.

Full LLM codegen of arbitrary build123d scripts is out of scope for this MVP.

## Run

Requires **Bun** and **Python 3.11+** (`python3-venv` on Debian/Ubuntu). First `bun run dev` creates `.venv` and installs `build123d` (large OpenCascade wheel).

```bash
cd apps/text-to-cad
bun install
bun run dev
```

Then open the Vite URL (default `http://localhost:5173`). The Bun API is proxied at `/api`.

```bash
bun test          # prompt mapper
bun run lint
```

## Stack

Vite + React + TypeScript, shadcn/ui (lyra), Bun API, build123d, react-three-fiber + drei.
