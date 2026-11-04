# teardown

One-screen gallery of the three bundled [elvarofficial/teardown](https://github.com/elvarofficial/teardown) machines (MIT). Each is a single offline HTML page: three.js, take-apart, cutaways, live gauges, subsystem buttons, auto tour.

This is **not** a generic photo-to-3D model. Upstream is a Claude Code skill; this demo vendors the live kit at commit `a91262ac1109051e014662d42ecb0b7bc1f113b1` and builds `v8-live`, `cessna-live`, and `strandbeest-live`.

Optional **Describe a machine** mode calls Claude and/or an OpenAI model server-side with the upstream `SKILL.md` and shows the returned HTML in a sandboxed iframe. It is on when `ANTHROPIC_API_KEY` and/or `OPENAI_API_KEY` is set. If both are set, the gallery shows a provider picker. The gallery itself does not need a key.

OpenAI uses the [Responses API](https://developers.openai.com/api/docs/api-reference/responses/create). The default model is `gpt-6.1-sol` (checked 2026-11-04 against [OpenAI’s model catalog](https://developers.openai.com/api/docs/models/gpt-6.1-sol)). Override with `OPENAI_MODEL`. Older Codex snapshots such as `gpt-5-codex` were retired on 2026-07-23.

The same skill can also be installed into the Codex CLI with `npx skills add elvarofficial/teardown -g -a codex` (untested upstream).

## Run

```bash
cd apps/teardown
bun install
bun run dev
```

Open the Vite URL (default `http://127.0.0.1:5173`). The Bun API is proxied at `/api`.

Optional generate — copy `.env.example` to `.env`, or pass keys on the command line. Never prefix them with `VITE_`.

```bash
ANTHROPIC_API_KEY=sk-ant-… bun run dev
OPENAI_API_KEY=sk-… bun run dev
ANTHROPIC_API_KEY=sk-ant-… OPENAI_API_KEY=sk-… bun run dev
```

```bash
bun test
bun run lint
bun run build:sims   # rebuild public/sims/*.html from vendor/teardown
```

Film recording, procedural score, ffmpeg, and Python sound tooling from upstream are omitted.

## Stack

Vite + React + TypeScript, shadcn/ui (lyra), Bun API, vendored teardown live sims (esbuild + three.js).
