#!/usr/bin/env bash
# Verify the backend image at $1 (a full ref, e.g. ghcr.io/restitius/fixo-backend@sha256:...)
# was signed by this repo's own GitHub Actions build.yml job, before a deploy
# workflow trusts it. Keyless cosign verification — no key material to manage
# or leak, trust is anchored to the GitHub OIDC identity of the workflow run
# that produced it.
set -euo pipefail

IMAGE_REF="${1:?usage: verify-image.sh <image-ref>}"

cosign verify \
  --certificate-identity-regexp "^https://github.com/Restitius/fixo-app/\.github/workflows/build\.yml@refs/heads/(main|dev)$" \
  --certificate-oidc-issuer "https://token.actions.githubusercontent.com" \
  "$IMAGE_REF"
