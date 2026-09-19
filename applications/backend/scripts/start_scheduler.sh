#!/usr/bin/env bash
# Start the scheduler process.
set -euo pipefail
cd "$(dirname "$0")/.."
exec python -m app.scheduler.scheduler
