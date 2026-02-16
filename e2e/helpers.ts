import { expect, Page } from "@playwright/test";

export const TEST_EMAIL = "e2e@test.com";
export const TEST_PASSWORD = "testpassword123";

export const SEED_MOVEMENTS = {
  BENCH_PRESS: "Bench Press",
  SQUAT: "Squat",
  DEADLIFT: "Deadlift",
  PULL_UP: "Pull-Up",
} as const;

export async function ensureMovementExists(page: Page, name: string) {
  await page.goto("/movements", { waitUntil: "networkidle" });
  const existing = page.locator(`li:has-text("${name}")`);
  if (await existing.isVisible().catch(() => false)) return;

  const input = page.locator('input[placeholder="Movement name (e.g. Bench Press)"]');
  await input.waitFor({ state: "visible" });
  await input.fill(name);
  await page.locator('button:has-text("Add")').click();
  await expect(page.locator(`text=${name}`)).toBeVisible();
}

export async function ensureWorkoutStarted(page: Page) {
  await page.goto("/current-workout", { waitUntil: "networkidle" });
  const startButton = page.locator('button:has-text("Start Workout")');
  if (await startButton.isVisible().catch(() => false)) {
    await startButton.click();
    await expect(page.locator('button:has-text("Complete Workout")')).toBeVisible();
  }
}

export async function completeActiveWorkout(page: Page) {
  await page.goto("/current-workout", { waitUntil: "networkidle" });
  const completeButton = page.locator('button:has-text("Complete Workout")');
  if (await completeButton.isVisible().catch(() => false)) {
    await completeButton.click();
    await expect(page.locator('button:has-text("Start Workout")')).toBeVisible();
  }
}
