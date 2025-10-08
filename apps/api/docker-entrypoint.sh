#!/bin/sh
set -e

echo "==> Deploying... (node $(node -v))"
echo "PWD: $(pwd)"
echo "Listing runtime artifacts:"
ls -la .
echo "---- dist tree (top level) ----"
ls -la dist || true

# Run migrations (already compiled)
node dist/apps/api/src/scripts/migrate.js || node dist/src/scripts/migrate.js || node dist/scripts/migrate.js

echo "==> Resolving API entry file..."

# Candidates in priority order
CANDIDATES="
dist/apps/api/main.js
dist/apps/api/src/main.js
dist/main.js
"

ENTRY=""
for f in $CANDIDATES; do
  if [ -f "$f" ]; then
    ENTRY="$f"
    break
  fi
done

if [ -z "$ENTRY" ]; then
  echo "!!! Could not locate API entry among candidates:"
  echo "$CANDIDATES"
  echo "Printing detailed dist tree to debug:"
  ls -R dist || true
  exit 1
fi

echo "==> Starting API with: node $ENTRY"
exec node "$ENTRY"