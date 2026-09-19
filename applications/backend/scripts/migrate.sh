#!/usr/bin/env bash
# Apply pending database migrations.
set -euo pipefail
cd "$(dirname "$0")/.."
exec alembic upgrade head
