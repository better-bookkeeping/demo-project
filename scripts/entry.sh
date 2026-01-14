#!/bin/bash

set -e

echo "Generating runtime configuration..."

VITE_AUTH0_DOMAIN=${VITE_AUTH0_DOMAIN}
VITE_AUTH0_CLIENT_ID=${VITE_AUTH0_CLIENT_ID}
VITE_DOCUMENT_PARSER_API_URL=${VITE_DOCUMENT_PARSER_API_URL}
VITE_ENVIRONMENT=${VITE_ENVIRONMENT}

# Generate config.js by substituting variables in template
envsubst < ./.output/public/config.js > ./.output/public/config.js.tmp \
  && mv ./.output/public/config.js.tmp ./.output/public/config.js

echo "Front-end runtime configuration generated:"

cat ./.output/public/config.js

CONFIG_SIZE_IN_BYTES=$(wc -c ./.output/public/config.js | awk '{print $1}')

# Update the server manifest with correct file size for config.js only
sed -i '/\"\/config\.js\"/,/},/{s/\"size\": [0-9]*/\"size\": '"$CONFIG_SIZE_IN_BYTES"'/}' ./.output/server/chunks/nitro/nitro.mjs

echo "assets updated with correct file size for config.js"

export PORT=3902
exec node ./.output/server/index.mjs
