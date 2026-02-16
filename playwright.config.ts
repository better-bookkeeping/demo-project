import { defineConfig, devices } from "@playwright/test";

const TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL ||
  "postgresql://postgres:postgres@localhost:5432/demo_project_test";

process.env.DATABASE_URL = TEST_DATABASE_URL;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: "html",
  globalSetup: "./e2e/global-setup.ts",
  globalTeardown: "./e2e/global-teardown.ts",
  use: {
    baseURL: "http://localhost:3001",
    trace: "on-first-retry",
    storageState: "./e2e/.auth/user.json",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: `DATABASE_URL=${TEST_DATABASE_URL} PORT=3001 bun run --bun node_modules/.bin/vite dev`,
    port: 3001,
    reuseExistingServer: !process.env.CI,
  },
});
