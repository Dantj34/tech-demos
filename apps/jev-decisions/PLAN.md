# jev-decisions — MVP plan

## Goal
Let one user paste unstructured text (support ticket / email / PR blurb) and get typed Jev (TypeSafe System One) decisions with calibrated probabilities they can act on.

## Single-user MVP
**In**
- Paste/edit a state blob (plain text)
- Fixed question set: category (choice), urgency (boolean/noul), priority/score, optional act-vs-escalate threshold
- Call Jev via `@typesafe-ai/sdk` (`TypeSafeClient.systemOne`) or Vercel AI SDK `experimental_evaluate` + `typesafe-ai/jev`
- Show selected answers + probability bars (and confidence when available)
- Env: `TYPESAFE_API_KEY` (or AI Gateway key); clear empty-state if missing
- Self-contained under `apps/jev-decisions/` — `bun install && bun run dev`

**Out**
- Free-form chat / prose generation
- User-authored question DSL editor (v2)
- Auth, multi-user, persistence, real ticket system integrations
- Fine-tuning / calibration pipelines

## Outcome-oriented tasks
1. Scaffold Vite + React + TS with Bun; `bunfig.toml` `minimumReleaseAge = 259200` before install
2. shadcn/ui minimalist: state textarea, Run button, results cards
3. Server route that calls Jev with fixed questions; never expose the API key to the client
4. Render choice/boolean/score answers with probability bars + optional escalate threshold
5. Sample fixtures (billing ticket, bug report, feature request) for one-click demos
6. Smoke E2E + screenshot + short video for the PR

## Stack
- **Bun** — monorepo default
- **Vite + React + TS** — one-screen utility
- **shadcn/ui** — minimal UI
- **`@typesafe-ai/sdk`** (preferred) or **AI SDK `experimental_evaluate`** — official Jev clients
- **Node server / Vite API** — keep `TYPESAFE_API_KEY` server-side

## Deferred
- Custom question builder UI
- Batch evaluate / CSV
- Cloudflare Pages wiring

## Source
https://x.com/CompleteSkeptic/status/2099925682726002904
