# teardown

One-screen gallery of the three bundled [elvarofficial/teardown](https://github.com/elvarofficial/teardown) machines (MIT). Each is a single offline HTML page: three.js, take-apart, cutaways, live gauges, subsystem buttons, auto tour.

This is **not** a generic photo-to-3D model. Upstream is a Claude Code skill; this demo vendors the live kit at commit `a91262ac1109051e014662d42ecb0b7bc1f113b1` and builds `v8-live`, `cessna-live`, and `strandbeest-live`.

Optional **Describe a machine** mode calls Claude server-side with the upstream `SKILL.md` and shows the returned HTML in a sandboxed iframe. It is off unless `ANTHROPIC_API_KEY` is set. The gallery does not need a key.

## Run

```bash
cd apps/teardown
bun install
bun run dev
```

Open the Vite URL (default `http://127.0.0.1:5173`). The Bun API is proxied at `/api`.

Optional generate:

```bash
ANTHROPIC_API_KEY=sk-ant-… bun run dev
```

Put the key in `.env` if you prefer. Never prefix it with `VITE_`.

```bash
bun test
bun run lint
bun run build:sims   # rebuild public/sims/*.html from vendor/teardown
```

Film recording, procedural score, ffmpeg, and Python sound tooling from upstream are omitted.

## Stack

Vite + React + TypeScript, shadcn/ui (lyra), Bun API, vendored teardown live sims (esbuild + three.js).
