#!/usr/bin/env bash
# Idempotent bootstrap for the tech-demos monorepo Cloud Agent environment.
# Installs the system + language toolchains the demos need, then refreshes
# the text-to-cad app's Bun and Python (build123d) dependencies.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# --- System packages for the build123d Python sidecar -----------------------
if ! dpkg -s python3-venv >/dev/null 2>&1 || ! dpkg -s build-essential >/dev/null 2>&1; then
  sudo apt-get update -qq
  sudo apt-get install -y --no-install-recommends \
    python3-venv python3-dev build-essential
fi

# --- Bun runtime ------------------------------------------------------------
if ! command -v bun >/dev/null 2>&1; then
  curl -fsSL https://bun.sh/install | bash
fi
export BUN_INSTALL="${BUN_INSTALL:-$HOME/.bun}"
export PATH="$BUN_INSTALL/bin:$PATH"

# Make bun/bunx resolvable for non-login shells (e.g. environment terminals).
sudo ln -sf "$BUN_INSTALL/bin/bun" /usr/local/bin/bun
sudo ln -sf "$BUN_INSTALL/bin/bunx" /usr/local/bin/bunx

# --- text-to-cad app dependencies ------------------------------------------
cd "$REPO_ROOT/apps/text-to-cad"
bun install
# Creates .venv and installs build123d (large OpenCascade wheel on first run).
bun run setup:python

echo "tech-demos environment ready (bun $(bun --version), $(python3 --version))."
