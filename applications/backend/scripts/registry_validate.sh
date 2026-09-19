#!/usr/bin/env bash
# Validate governed definitions + architecture boundaries.
#   - loads the query registry manifest (validates SQL files + ownership)
#   - runs the architecture guard tests (ports/adapters/platform dependency rules)
set -euo pipefail
cd "$(dirname "$0")/.."

echo "==> Validating query registry..."
python - <<'PY'
from app.registries.registry_manager import RegistryManager
from app.startup.register_queries import load_query_registry

manager = RegistryManager()
issues = load_query_registry(manager.queries)
if issues:
    for issue in issues:
        print(f"  ERROR: {issue}")
    raise SystemExit(1)
print(f"  OK: {manager.queries.count()} governed queries registered and validated")
PY

echo "==> Validating architecture boundaries..."
python -m pytest tests/architecture -q

echo "registry validation complete"