#!/bin/bash
set -e

echo "Waiting for database..."
while ! pg_isready -h postgres -U postgres > /dev/null 2>&1; do
  sleep 1
done
echo "Database is ready!"

echo "Running Prisma generate..."
bun run generate

echo "Seeding foods..."
bun run seed:foods || true

echo "Starting dev server..."
exec "$@"
