/**
 * Shared database configuration for scripts and tests.
 *
 * The DATABASE_URL environment variable takes precedence.
 * Falls back to the local Docker development database.
 */
export const DATABASE_URL =
  process.env.DATABASE_URL ??
  "postgresql://postgres:postgres@localhost:5432/demo_project";
