#!/usr/bin/env bash
set -euo pipefail

echo "==> Deploying..."
node dist/apps/api/src/scripts/migrate.js

echo "==> Starting API..."
node dist/apps/api/main.js