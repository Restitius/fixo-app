#!/usr/bin/env bash
# Verify a signed frontend build-output tarball (produced by build.yml's
# frontend-artifact job, downloaded by a deploy workflow) before it is
# unpacked and handed to `wrangler deploy`. Same trust anchor as
# verify-image.sh: the artifact must have been signed by this repo's own
# build.yml, not hand-assembled or tampered with in transit.
set -euo pipefail

TARBALL="${1:?usage: verify-frontend-artifact.sh <tarball> <signature> <certificate>}"
SIGNATURE="${2:?usage: verify-frontend-artifact.sh <tarball> <signature> <certificate>}"
CERTIFICATE="${3:?usage: verify-frontend-artifact.sh <tarball> <signature> <certificate>}"

cosign verify-blob \
  --certificate-identity-regexp "^https://github.com/Restitius/fixo-app/\.github/workflows/build\.yml@refs/heads/(main|dev)$" \
  --certificate-oidc-issuer "https://token.actions.githubusercontent.com" \
  --signature "$SIGNATURE" \
  --certificate "$CERTIFICATE" \
  "$TARBALL"

sha256sum -c "${TARBALL}.sha256"
