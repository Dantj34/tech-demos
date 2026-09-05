# Agent instructions — tech-demos sticky monorepo

This is a **sticky monorepo**. Never create a new GitHub repository for a demo.

## Scope

- Only touch `apps/<kebab-slug>/` for a given demo. Each app is self-contained: `bun install && bun run dev`.
- Before building: follow `skills/project-planning/SKILL.md` and write `apps/<slug>/PLAN.md`.
- Never re-propose bookmarks already listed in `tracking/seen-bookmarks.json`.

## Runtime & UI

- Use the **Bun** runtime.
- Every app needs a `bunfig.toml` with `[install] minimumReleaseAge = 259200` **before** install.
- When UI applies, default to **shadcn/ui** with a minimalist preset.

## Pull requests

- One PR per demo.
- Every PR must attach **both** at least one screenshot **and** at least one video of the running app.

## Deploy (Cloudflare Pages)

- One Cloudflare Pages project; path per `apps/<slug>/`.
- Repo secrets: `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`.
