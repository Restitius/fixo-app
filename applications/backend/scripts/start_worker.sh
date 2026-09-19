#!/usr/bin/env bash
# Start the background job worker.
set -euo pipefail
cd "$(dirname "$0")/.."
exec python -m app.jobs.worker
