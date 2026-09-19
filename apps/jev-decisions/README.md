# jev-decisions

One-screen playground for [TypeSafe Jev (System One)](https://docs.typesafe.ai): paste unstructured text, get typed probabilistic decisions — category (choice), urgent (boolean / noul), priority (score) — plus an act-vs-escalate threshold readout.

Source bookmark: https://x.com/CompleteSkeptic/status/2099925682726002904

## Run

Requires **Bun**.

```bash
cd apps/jev-decisions
bun install
bun run dev
```

Open the Vite URL (default `http://127.0.0.1:5173`). The Bun API is proxied at `/api`.

Without a key the UI stays demoable in **fixture mode**: one-click samples (billing ticket, bug report, feature request) return baked probability bars. The API key never ships to the client.

```bash
bun test
bun run lint
```

## Environment

Copy `.env.example` to `.env` in this app directory (or export vars in the shell). The server reads them; do **not** use a `VITE_` prefix.

| Variable | Purpose |
| --- | --- |
| `TYPESAFE_API_KEY` | Preferred. Calls `@typesafe-ai/sdk` `TypeSafeClient.systemOne` (`jev-latest`). |
| `AI_GATEWAY_API_KEY` or `VERCEL_AI_GATEWAY_API_KEY` | Fallback. Vercel AI SDK `experimental_evaluate` with `typesafe-ai/jev` when the installed SDK exposes `gateway.evaluationModel`. |

If neither key is set, `/api/evaluate` uses the fixture / heuristic mock.

## Stack

Vite + React + TypeScript, shadcn/ui (lyra), Bun API, `@typesafe-ai/sdk`, optional `ai` evaluate fallback.
