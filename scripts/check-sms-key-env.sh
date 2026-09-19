#!/usr/bin/env bash
# Guard against a live Swala SMS key reaching a non-production environment,
# or a sandbox key reaching production — either is a real incident, not a
# theoretical one (a "sandbox" key silently misrouting production traffic,
# or a "live" key burning real SMS credit / hitting real customers from a
# non-prod deploy). Key format confirmed this session against the real
# SwalaSmsProvider integration: swl_live_... / swl_test_...
set -euo pipefail

TARGET_ENV="${1:?usage: check-sms-key-env.sh <staging|production>}"
API_KEY="${SWALA_SMS_API_KEY:-}"
MODE="${SWALA_SMS_MODE:-}"

if [[ -z "$API_KEY" ]]; then
  echo "SWALA_SMS_API_KEY is not set for this deploy — nothing to check (SMS disabled deploys are fine)."
  exit 0
fi

case "$TARGET_ENV" in
  production)
    if [[ "$API_KEY" != swl_live_* ]]; then
      echo "::error::Production deploy is using a non-live Swala SMS key (expected swl_live_*)." >&2
      exit 1
    fi
    if [[ "$MODE" != "live" ]]; then
      echo "::error::Production deploy has SWALA_SMS_MODE=$MODE, expected 'live'." >&2
      exit 1
    fi
    ;;
  staging)
    if [[ "$API_KEY" == swl_live_* ]]; then
      echo "::error::Staging deploy is using a LIVE Swala SMS key. Refusing to deploy." >&2
      exit 1
    fi
    if [[ "$MODE" == "live" ]]; then
      echo "::error::Staging deploy has SWALA_SMS_MODE=live. Refusing to deploy." >&2
      exit 1
    fi
    ;;
  *)
    echo "::error::Unknown target environment: $TARGET_ENV" >&2
    exit 1
    ;;
esac

echo "SMS key/mode consistent with $TARGET_ENV."
