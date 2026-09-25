#!/bin/sh
#
# Fails if a built bundle holds anything that must not be public. The dashboard
# image is public, and dist/ is also what pdfthumb.com serves to everyone.
#
# Usage: scripts/check-public-bundle.sh [dist-dir]
#
# POSIX sh: it also runs inside the Docker build stage (node:22-alpine).

set -eu

DIST="${1:-dist}"
[ -d "$DIST" ] || { echo "FAIL: no bundle at $DIST" >&2; exit 1; }

failures=0
fail() {
  echo "FAIL: $*" >&2
  failures=$((failures + 1))
}

# Source maps would ship the source; .env files hold secrets.
found="$(find "$DIST" -type f \( -name '*.map' -o -name '.env' -o -name '.env.*' \))"
[ -z "$found" ] || fail "files that must not ship: $found"

# Key and secret shapes:
#   pdfthumb_            PDF Thumbnail Pro API keys
#   AIza                 Google API keys
#   -----BEGIN           PEM private keys and certificates
#   sk_live_ sk_test_    Stripe secret keys
#   whsec_               Stripe webhook secrets
hits="$(grep -rlE 'pdfthumb_|AIza[0-9A-Za-z_-]{20}|-----BEGIN|sk_(live|test)_|whsec_' "$DIST" || true)"
[ -z "$hits" ] || fail "secret-shaped strings in: $hits"

if [ "$failures" -ne 0 ]; then
  echo "$failures check(s) failed: this bundle must not be published" >&2
  exit 1
fi
echo "bundle at $DIST holds no maps, env files or secret-shaped strings"
