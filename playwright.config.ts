import { defineConfig, devices } from "@playwright/test";
import { E2E_WORKER_COUNT } from "./e2e/config";

const playwrightPort = Number(process.env.PORT || 3902);

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: E2E_WORKER_COUNT,
  reporter: "html",
  use: {
    baseURL: `http://localhost:${playwrightPort}`,
    trace: "on-first-retry",
  },
  webServer: {
    command: "bun run dev:local",
    port: playwrightPort,
    reuseExistingServer: !process.env.CI,
    timeout: 180 * 1000,
  },
  globalSetup: "./e2e/global-setup.ts",
  globalTeardown: "./e2e/global-teardown.ts",
  projects: [
    {
      name: "auth",
      testMatch: "**/auth.spec.ts",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "movements",
      testMatch: "**/movements.spec.ts",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "workouts",
      testMatch: "**/workouts.spec.ts",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "sets",
      testMatch: "**/sets.spec.ts",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "weight-tracking",
      testMatch: "**/weight-tracking.spec.ts",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "nutrition",
      testMatch: "**/nutrition.spec.ts",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "progression",
      testMatch: "**/progression.spec.ts",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "error-scenarios",
      testMatch: "**/error-scenarios.spec.ts",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "security",
      testMatch: "**/security.spec.ts",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
