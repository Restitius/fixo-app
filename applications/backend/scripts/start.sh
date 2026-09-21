#!/usr/bin/env bash
# Start the API (development reload mode).
set -euo pipefail
cd "$(dirname "$0")/.."
PORT="${PORT:-8000}"
exec uvicorn app.main:app --reload --host 0.0.0.0 --port "$PORT"
