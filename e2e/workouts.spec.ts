import { test, expect, waitForHydration } from "./fixtures/auth";
import type { Page } from "@playwright/test";

async function ensureNoActiveWorkout(page: Page) {
  const hasActiveWorkout = await page.getByTestId("active-workout-state").isVisible().catch(() => false);
  if (hasActiveWorkout) {
    await page.getByTestId("finish-workout-button").click();
    const finishAnywayButton = page.getByTestId("finish-anyway-button");
    if (await finishAnywayButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await finishAnywayButton.click();
    }
    await page.getByTestId("start-workout-button").waitFor({ state: "visible", timeout: 5000 });
  }
}

async function completeWorkout(page: Page, weight: string, reps: string = "5") {
  await page.goto("/current-workout");
  await waitForHydration(page);

  const hasActiveWorkout = await page.getByTestId("active-workout-state").isVisible().catch(() => false);
  if (!hasActiveWorkout) {
    await page.getByTestId("start-workout-button").click();
    await expect(page.getByTestId("current-workout-heading")).toBeVisible();
  }

  await page.getByTestId("searchable-select-trigger").click();
  const searchInput = page.getByTestId("searchable-select-search");
  await searchInput.fill("Squat");
  await page.getByRole("option", { name: /squat/i }).first().click();

  const weightInput = page.getByTestId("weight-input");
  const repsInput = page.getByTestId("reps-input");
  await weightInput.click();
  await weightInput.pressSequentially(weight);
  await repsInput.click();
  await repsInput.pressSequentially(reps);
  await expect(page.getByTestId("log-set-button")).toBeEnabled();
  await page.getByTestId("log-set-button").click();
  await expect(page.getByTestId("set-item").first()).toBeVisible({ timeout: 10000 });

  await page.getByTestId("finish-workout-button").click();
  await expect(page.getByTestId("ready-to-lift-heading")).toBeVisible({ timeout: 15000 });
}

test.describe("Workouts", () => {
  test.beforeEach(async ({ auth }) => {
    await auth.ensureTestUser();
    await auth.signIn();
  });

  test.afterEach(async ({ page }) => {
    try {
      await page.keyboard.press("Escape");
      await page.waitForTimeout(100);
    } catch {}
  });

  test.describe("create", () => {
    test("should start a new workout from the current workout page", async ({ page }) => {
      await page.goto("/current-workout");
      await waitForHydration(page);
      await ensureNoActiveWorkout(page);

      await expect(page.getByTestId("ready-to-lift-heading")).toBeVisible();
      await page.getByTestId("start-workout-button").click();

      await expect(page.getByTestId("current-workout-heading")).toBeVisible();
      await expect(page.getByTestId("live-session-indicator")).toBeVisible();
    });

    test("should show the workout date after starting", async ({ page }) => {
      await page.goto("/current-workout");
      await waitForHydration(page);
      await ensureNoActiveWorkout(page);

      await page.getByTestId("start-workout-button").click();

      await expect(page.getByTestId("current-workout-heading")).toBeVisible();
      await expect(page.getByTestId("total-sets-stat")).toBeVisible();
    });
  });

  test.describe("read", () => {
    test("should display the current active workout", async ({ page }) => {
      await page.goto("/current-workout");
      await waitForHydration(page);

      const hasActiveWorkout = await page.getByTestId("active-workout-state").isVisible().catch(() => false);

      if (!hasActiveWorkout) {
        await page.getByTestId("start-workout-button").click();
        await expect(page.getByTestId("current-workout-heading")).toBeVisible();
      }

      await expect(page.getByTestId("current-workout-heading")).toBeVisible();
      await expect(page.getByTestId("log-set-button")).toBeVisible();
    });

    test("should show 'Ready to Lift' when no active workout exists", async ({ page }) => {
      await page.goto("/current-workout");
      await waitForHydration(page);

      const hasActiveWorkout = await page.getByTestId("active-workout-state").isVisible().catch(() => false);

      if (hasActiveWorkout) {
        await page.getByTestId("finish-workout-button").click();

        const finishAnywayButton = page.getByTestId("finish-anyway-button");
        if (await finishAnywayButton.isVisible().catch(() => false)) {
          await finishAnywayButton.click();
        }
        await waitForHydration(page);
      }

      await expect(page.getByTestId("ready-to-lift-heading")).toBeVisible();
      await expect(page.getByTestId("start-workout-button")).toBeVisible();
    });

    test("should display completed workouts in workout history", async ({ page }) => {
      await page.goto("/workout-history");
      await waitForHydration(page);

      const hasWorkouts = await page.getByTestId("workout-card").first().isVisible({ timeout: 2000 }).catch(() => false);

      if (hasWorkouts) {
        await expect(page.getByTestId("logbook-heading")).toBeVisible();
      } else {
        await expect(page.getByTestId("no-history-message")).toBeVisible();
      }
    });
  });

  test.describe("complete", () => {
    test("should mark the current workout as completed", async ({ page }) => {
      await completeWorkout(page, "135", "10");
    });

    test("should move completed workout to history", async ({ page }) => {
      await completeWorkout(page, "200", "5");

      await page.goto("/workout-history");
      await waitForHydration(page);
      await expect(page.getByTestId("logbook-heading")).toBeVisible();

      await expect(page.getByText("200")).toBeVisible();
    });

    test("should discard empty workout when finished", async ({ page }) => {
      await page.goto("/current-workout");
      await waitForHydration(page);

      const hasActiveWorkout = await page.getByTestId("active-workout-state").isVisible().catch(() => false);

      if (!hasActiveWorkout) {
        await page.getByTestId("start-workout-button").click();
        await expect(page.getByTestId("current-workout-heading")).toBeVisible();
      }

      await page.getByTestId("finish-workout-button").click();

      await expect(page.getByTestId("empty-workout-dialog")).toBeVisible({ timeout: 10000 });
      await expect(page.getByTestId("empty-workout-message")).toBeVisible();

      await page.getByTestId("finish-anyway-button").click();
      await expect(page.getByTestId("ready-to-lift-heading")).toBeVisible({ timeout: 15000 });
    });
  });

  test.describe("delete", () => {
    test("should delete selected workouts from history", async ({ page }) => {
      await completeWorkout(page, "100", "8");

      await page.goto("/workout-history");
      await waitForHydration(page);
      await expect(page.getByTestId("logbook-heading")).toBeVisible();

      const initialWorkoutCount = await page.getByTestId("workout-card").count();

      await page.getByTestId("manage-button").click();

      await page.getByTestId("workout-card").first().click();

      await page.getByTestId("delete-selected-button").click();

      await page.waitForFunction(
        (initialCount) => {
          const cards = document.querySelectorAll('[data-testid="workout-card"]');
          return cards.length < initialCount;
        },
        initialWorkoutCount,
        { timeout: 5000 }
      );
    });

    test("should allow selecting multiple workouts for deletion", async ({ page }) => {
      await completeWorkout(page, "100");
      await completeWorkout(page, "150");

      await page.goto("/workout-history");
      await waitForHydration(page);
      await expect(page.getByTestId("logbook-heading")).toBeVisible();

      const workoutCards = page.getByTestId("workout-card");
      const cardCount = await workoutCards.count();
      expect(cardCount).toBeGreaterThanOrEqual(2);

      await page.getByTestId("manage-button").click();

      await workoutCards.nth(0).click();
      await workoutCards.nth(1).click();

      await expect(page.getByTestId("delete-selected-button")).toContainText("2");
    });
  });
});
