# Project Guidelines

## Development Workflow (TDD)

1. **Write E2E tests first** - Create failing tests that define expected behavior
2. **Run tests** - Confirm they fail (red)
3. **Implement feature** - Write minimal code to pass tests
4. **Run tests** - Confirm they pass (green)
5. **Refactor** - Clean up while keeping tests green
6. **Commit** - Use conventional commits

## Commands

- `bun run dev` - Start dev server (Docker environment on port 3000)
- `bun run test` - Run E2E tests with Playwright
- `bun run typecheck` - Check TypeScript types
- `bun run db:migrate` - Run database migrations

## Code Quality

- E2E type-safety required
- No plaintext passwords in production
- Run typecheck before commits
- All features need E2E tests

## E2E Test Patterns

### Test Helpers

- Use `e2e/helpers/auth.ts` for authentication utilities
- Use `e2e/helpers/db.ts` for database cleanup
- Use `e2e/fixtures/test-fixtures.ts` for authenticated page fixtures

### Selectors

Prefer semantic selectors over data-testid:

```ts
// Good - semantic selectors
page.getByRole("button", { name: "Add" });
page.getByPlaceholder("Movement name");
page.getByText("No active workout");

// Acceptable - when semantic selectors aren't reliable
page.getByTestId("movement-list");
```

### Test Structure

```ts
test.describe("Feature", () => {
  test.describe("create", () => {
    test("should create a new item", async ({ authenticatedPage }) => {
      await authenticatedPage.goto("/route");
      await authenticatedPage.waitForLoadState("networkidle");
      // perform actions and assertions
    });
  });
});
```

## Conventional Commits

- `feat:` new feature
- `fix:` bug fix
- `test:` adding/updating tests
- `docs:` documentation
- `refactor:` code refactoring
- `chore:` maintenance tasks

## Project Architecture

### Stack

- **Runtime**: Bun
- **Framework**: TanStack Start (React SSR)
- **Router**: TanStack Router (file-based)
- **Database**: PostgreSQL with Prisma
- **Testing**: Playwright for E2E

### Key Directories

```
src/routes/          # File-based routing
src/lib/             # Server functions and utilities
e2e/                 # E2E test files
  helpers/           # Test utilities
  fixtures/          # Playwright fixtures
prisma/              # Database schema and migrations
```

### Authentication

- Session-based auth with cookies
- Test helpers handle login/signup flows
- Always clean up test users after tests
