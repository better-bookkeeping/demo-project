# Better Bookkeeping Demo App - README Explained

This document summarizes the work done between the original version and the current implementation. It explains what was built, why it was built, and how the pieces fit together, so reviewers can quickly map requirements to implementation choices.

## Summary of What Changed

The project now delivers the full requested feature set plus several stretch goals:

- Authentication security upgraded (password hashing, validation, session signing, rate limiting).
- Weight tracking feature with history, goals, and charting.
- Body-weight movement support and auto-weight behavior.
- Workout progression analytics with charts and filtering.
- Nutrition tracking with food search, goals, and charts (stretch).
- Full Playwright e2e test suite across flows.
- UI overhaul with a cohesive gym/industrial theme and reusable UI components.
- Docker/dev tooling improvements and CI coverage for typecheck + e2e.

## Feature-by-Feature Mapping

### 1) Security Fix - Password Hashing

What was required:

- Hash passwords instead of storing plaintext.

What was implemented:

- Added Argon2 hashing for account creation and verification for sign-in.
- Stored hashes in `passwordHash` and removed plaintext passwords in schema/migrations.
- Added password complexity validation via Zod schema (min length + upper/lower/number/special).

Key files:

- `src/lib/auth.server.ts`
- `src/lib/password-validation.ts`
- `prisma/schema.prisma`
- `prisma/migrations/*_add_password_hash/*`

Security improvements beyond hashing:

- HMAC-signed session cookie (server-only).
- HTTP-only cookie with `secure` in production and `sameSite=lax`.
- Simple rate limiting for auth endpoints in production-only.

### 2) Weight Tracking (Requirement)

What was required:

- Allow users to log body weight over time and show a chart.

What was implemented:

- `Weight` model + server functions for CRUD and "latest weight".
- Weight history chart and trend indicators.
- Day-granularity logging with unique timestamps for deterministic "latest" selection.
- Optional goals (goal weight, cutting/bulking/maintenance, height for BMI).

Key files:

- `src/lib/weights.server.ts`
- `src/routes/__index/_layout.weight-tracking/index.tsx`
- `src/components/weight-chart.tsx`
- `prisma/migrations/*_add_weight_model/*`

### 3) Body-Weight Movements (Requirement)

What was required:

- Movements can be flagged as body-weight, and when used in a workout, default the weight to the most recent logged weight.

What was implemented:

- `Movement.isBodyWeight` field.
- UI toggle for body-weight during movement creation.
- Auto-populate set weight when a body-weight movement is selected.
- "(BW)" indicators in movement UI and selection list.

Key files:

- `src/lib/movements.server.ts`
- `src/routes/__index/_layout.movements/index.tsx`
- `src/routes/__index/_layout.current-workout/index.tsx`
- `prisma/migrations/*_is_bodyweight_boolean_default_false/*`

### 4) Workout Progression Charting (Requirement)

What was required:

- Charts showing progression over time for a selected movement and metric.

What was implemented:

- Server metrics computation for max weight / total reps / total volume.
- Client filters (movement, metric, date range).
- Recharts-based line/area visualization with gym theme styling.

Key files:

- `src/lib/progression.server.ts`
- `src/routes/__index/_layout.progression/index.tsx`
- `src/components/progression-chart.tsx`

### 5) E2E Tests (Requirement)

What was required:

- Playwright e2e tests for movements, sets, workouts.

What was implemented:

- Full suite across auth, movements, workouts, sets, weight tracking, nutrition, progression, error scenarios, and security validation.
- Worker-scoped user generation + cleanup.
- Deterministic fixtures/helpers for auth and UI interactions.

Key files:

- `e2e/*.spec.ts`
- `e2e/fixtures/auth.ts`
- `e2e/global-setup.ts`, `e2e/global-teardown.ts`
- `playwright.config.ts`

### 6) Stretch Goals Implemented

Nutrition tracking:

- Food database (seeded), autocomplete search, manual/custom foods.
- Daily macros and calorie tracking with goals and charts.
- Meal-type breakdown.

Key files:

- `src/lib/nutrition.server.ts`
- `src/lib/food.server.ts`
- `src/routes/__index/_layout.nutrition/*`
- `src/components/nutrition/*`
- `prisma/seed-foods.ts`
- `prisma/migrations/*_add_nutrition_tracking/*`
- `prisma/migrations/*_add_foods_table/*`

UI cleanup:

- Consistent gym/industrial dark theme.
- Reusable UI primitives (cards, buttons, inputs, popovers, dropdowns, searchable selects, datetime picker).
- Improved layout, typography, visual hierarchy, and empty states.

## Data Model Changes (Prisma)

New/updated models:

- `User`: password hashing (`passwordHash`) plus fitness goals (goalWeight, goalType, height).
- `Weight`: user weight logs.
- `Movement`: `isBodyWeight` flag.
- `Workout`, `Set`: indexed for query performance.
- `Nutrition`, `NutritionGoal`, `Food`: nutrition tracking and food lookup.

Performance:

- Added indexes for common query paths (`userId`, `recordedAt`, `completedAt`, etc).

## Testing Strategy

Playwright suite covers:

- Auth, password policy, and error cases.
- CRUD flows for movements, workouts, sets.
- Weight tracking logging, charts, goals.
- Nutrition logging, goals, and charts.
- Progression chart correctness.

Global setup/teardown:

- Generates worker-specific users and cleans up test data (movements, workouts, sets, nutrition, custom foods).

## Security Decisions and Tradeoffs

Implemented:

- Password hashing (Argon2).
- Server-only session signing (HMAC) and secure cookie settings.
- Rate limiting for auth in production.
- User scoping in data access (movements/foods/sets).

Notes:

- The app remains a demo; production-grade auth/session management (rotation, refresh tokens, CSRF tokens) is out of scope.

## Tooling / DevOps

Docker:

- Development docker-compose with Postgres service.
- Production entry script added for runtime env templating and Nitro server startup.

CI:

- Commitlint + Typecheck.
- Added Playwright e2e job with Postgres service, migrations, and browser install.

## How to Run Locally

Development (Docker + app):

- `bun run dev`

Stop services:

- `bun run dev:down`

Tests:

- `bun run test`

## Notable Design Decisions

- Gym/industrial dark theme for visual identity.
- Emphasis on user feedback: toasts, inline validation, empty-state messaging.
- Use of charts to make progress feel tangible (weight + progression + nutrition).
- Explicit body-weight support to match real lifting workflows.

## Known Limitations / Future Enhancements

- Rate limiting is in-memory (not shared across instances).
- No CSRF protection or refresh tokens.
- Nutrition database is seeded and simplified. (Can use the <https://fdc.nal.usda.gov/api-guide/> in the future)
- More advanced analytics (volume PRs, per-week averages) could be added later.
