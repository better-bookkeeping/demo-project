#!/usr/bin/env sh

set -e

# Default to production when not explicitly set
if [ -z "${VITE_ENVIRONMENT:-}" ]; then
  VITE_ENVIRONMENT="production"
  export VITE_ENVIRONMENT
fi

# Render runtime config from env vars if template exists
if [ -f "/app/public/config.js" ]; then
  if [ -d "/app/.output/public" ]; then
    envsubst < /app/public/config.js > /app/.output/public/config.js
  else
    envsubst < /app/public/config.js > /app/public/config.js
  fi
fi

if [ -f "/app/.output/server/index.mjs" ]; then
  exec node /app/.output/server/index.mjs
fi

echo "Missing .output/server/index.mjs. Did the build run successfully?"
exit 1
