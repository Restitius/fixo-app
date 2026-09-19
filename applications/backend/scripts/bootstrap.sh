#!/usr/bin/env bash
# FIXO-APP bootstrap: virtualenv + dependencies + .env seed.
set -euo pipefail
cd "$(dirname "$0")/.."

if [ ! -d .venv ]; then
  echo "[bootstrap] creating virtualenv..."
  python -m venv .venv
fi

# shellcheck disable=SC1091
source .venv/bin/activate

echo "[bootstrap] installing dependencies..."
pip install --upgrade pip > /dev/null
pip install -r requirements.txt

if [ ! -f .env ]; then
  cp .env.example .env
  echo "[bootstrap] seeded .env from .env.example"
fi

echo "[bootstrap] done. Activate with: source .venv/bin/activate"
echo "[bootstrap] NOTE(Windows): use scripts via Git Bash/WSL, or run the equivalent commands manually."
