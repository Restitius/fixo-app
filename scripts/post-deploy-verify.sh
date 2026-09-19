#!/usr/bin/env bash
# Post-deploy verification gate for production. Polls the new revision's
# health/readiness for a bounded window; a non-zero exit here is the
# deploy-production.yml job's automatic-rollback trigger (see the
# `rollback` step there, which only runs `if: failure()` on this step).
set -euo pipefail

BASE_URL="${1:?usage: post-deploy-verify.sh <base-url>}"
ATTEMPTS="${2:-10}"
SLEEP_SECONDS="${3:-6}"

for i in $(seq 1 "$ATTEMPTS"); do
  if curl -fsS "${BASE_URL}/api/v1/health" > /dev/null \
     && curl -fsS "${BASE_URL}/api/v1/health/ready" > /dev/null; then
    echo "Healthy and ready after $i/$ATTEMPTS attempts."
    exit 0
  fi
  echo "Attempt $i/$ATTEMPTS: not ready yet, waiting ${SLEEP_SECONDS}s..."
  sleep "$SLEEP_SECONDS"
done

echo "::error::New revision never became healthy+ready within $((ATTEMPTS * SLEEP_SECONDS))s. Triggering rollback." >&2
exit 1
