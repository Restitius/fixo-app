#!/usr/bin/env bash
# Load reference/seed data through governed commands.
set -euo pipefail
cd "$(dirname "$0")/.."
exec python -m app.commands.cli database.seed
