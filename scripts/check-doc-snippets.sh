#!/usr/bin/env bash
# Compiles or syntax-checks the API examples in docs-snippets/ (#126), so a
# snippet the /docs page shows at least builds. Each toolchain that isn't
# installed is skipped with a note; CI=true makes a missing one an error.
set -euo pipefail
cd "$(dirname "$0")/../docs-snippets"
work=$(mktemp -d)
trap 'rm -rf "$work"' EXIT
missing=0

have() {
  if command -v "$1" >/dev/null; then return 0; fi
  echo "skip: $1 is not installed"
  missing=1
  return 1
}

for f in */curl.sh; do bash -n "$f"; done
echo "ok: curl"

npx --no-install tsc -p tsconfig.json
echo "ok: typescript"

if have python3; then
  for f in */python.py; do python3 -m py_compile "$f"; done
  find . -name __pycache__ -type d -prune -exec rm -rf {} +
  echo "ok: python"
fi

if have go; then
  for d in */; do
    mkdir -p "$work/go/$d"
    cp "$d/main.go" "$work/go/$d/"
    (cd "$work/go/$d" && go mod init snippet >/dev/null 2>&1 && go vet ./...)
  done
  echo "ok: go"
fi

if have javac; then
  for d in */; do
    javac -d "$work/java/$d" "$d/Main.java"
  done
  echo "ok: java"
fi

if have php; then
  for f in */php.php; do php -l "$f" >/dev/null; done
  echo "ok: php"
fi

if have dotnet; then
  for d in */; do
    p="$work/cs/${d%/}"
    dotnet new console --framework net8.0 -o "$p" >/dev/null
    cp "$d/csharp.cs" "$p/Program.cs"
    dotnet build "$p" -warnaserror --nologo -v quiet >/dev/null
  done
  echo "ok: csharp"
fi

if [ "$missing" = 1 ] && [ "${CI:-}" = true ]; then
  echo "error: CI must check every language" >&2
  exit 1
fi
