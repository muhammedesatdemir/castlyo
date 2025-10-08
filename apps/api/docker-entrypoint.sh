#!/bin/sh
set -e

echo "==> Deploying... (node $(node -v))"

# Optional: guard to show where we are
echo "PWD: $(pwd)"
ls -la .

# Run migrations (they must fail fast with exit 1 if missing)
node dist/apps/api/src/scripts/migrate.js

echo "==> Starting API..."
exec node dist/apps/api/main.js