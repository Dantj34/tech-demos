# tech-demos

Sticky monorepo for weekday X-bookmark tech demos. One repo, many self-contained apps — never spin up a new GitHub repo per demo.

## Layout

| Path | Purpose |
|------|---------|
| `AGENTS.md` | Cursor cloud agent instructions for this monorepo |
| `skills/` | Shared agent skills (e.g. project planning) |
| `apps/` | Demo apps, each under `apps/<kebab-slug>/` |
| `tracking/` | Bookmark tracking (`seen-bookmarks.json`) |

See `AGENTS.md` for workflow, Bun/`bunfig.toml` rules, PR media requirements, and Cloudflare Pages deploy notes.

## License

MIT
