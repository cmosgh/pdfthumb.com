#!/bin/sh
# CI, e2e and the image build must run the same Node. .nvmrc is the single
# source (both workflows read it via node-version-file); the Dockerfile's
# build stage can't read it, so this fails when its node tag drifts, e.g.
# after a Dependabot base-image bump that didn't touch .nvmrc.
set -eu

cd "$(dirname "$0")/.."

want=""
[ -f .nvmrc ] && want=$(tr -d ' \n' < .nvmrc)
if [ -z "$want" ]; then
  echo "::error::.nvmrc is missing or empty" >&2
  exit 1
fi

got=$(sed -n 's/^FROM .*node:\([^@ -]*\)-alpine@.*AS build$/\1/p' Dockerfile)
if [ "$got" != "$want" ]; then
  echo "::error::Dockerfile build stage runs node ${got:-<unpinned>}, .nvmrc says $want" >&2
  exit 1
fi

for wf in .github/workflows/build.yml .github/workflows/playwright.yml; do
  if ! grep -q 'node-version-file: .nvmrc' "$wf"; then
    echo "::error::$wf doesn't take its Node version from .nvmrc" >&2
    exit 1
  fi
done

echo "Node $want everywhere: .nvmrc, Dockerfile, build and e2e workflows"
