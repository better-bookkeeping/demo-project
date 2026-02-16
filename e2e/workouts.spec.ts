import { test, expect } from "@playwright/test";
import { completeActiveWorkout, SEED_MOVEMENTS } from "./helpers";

const MOVEMENT_NAME = SEED_MOVEMENTS.SQUAT;

async function addSet(page: import("@playwright/test").Page, movement: string, weight: string, reps: string) {
  await page.locator("select").selectOption({ label: movement });
  const weightInput = page.locator('input[placeholder="Weight"]');
  await weightInput.waitFor({ state: "visible" });
  await weightInput.fill(weight);
  await page.locator('input[placeholder="Reps"]').fill(reps);
  await page.locator('button:has-text("Add")').click();
}

async function startWorkout(page: import("@playwright/test").Page) {
  await page.goto("/current-workout", { waitUntil: "networkidle" });
  await page.locator('button:has-text("Start Workout")').click();
  await expect(page.locator('button:has-text("Complete Workout")')).toBeVisible();
}

test.describe("Workouts", () => {
  test.describe("create", () => {
    test("should start a new workout from the current workout page", async ({ page }) => {
      await completeActiveWorkout(page);
      await startWorkout(page);
    });

    test("should show the workout date after starting", async ({ page }) => {
      await completeActiveWorkout(page);
      await startWorkout(page);

      const today = new Date();
      const dateStr = today.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      await expect(page.locator(`text=${dateStr}`)).toBeVisible();
    });
  });

  test.describe("read", () => {
    test("should display the current active workout", async ({ page }) => {
      await completeActiveWorkout(page);
      await startWorkout(page);

      await page.reload({ waitUntil: "networkidle" });
      await expect(page.locator('button:has-text("Complete Workout")')).toBeVisible();
    });

    test("should show 'No active workout' when none exists", async ({ page }) => {
      await completeActiveWorkout(page);
      await page.goto("/current-workout", { waitUntil: "networkidle" });

      await expect(page.locator("text=No active workout")).toBeVisible();
    });

    test("should display completed workouts in workout history", async ({ page }) => {
      await completeActiveWorkout(page);

      // Start and complete a new workout with a set
      await startWorkout(page);

      await addSet(page, MOVEMENT_NAME, "225", "5");
      await expect(page.locator("li").filter({ hasText: MOVEMENT_NAME })).toBeVisible();

      await page.locator('button:has-text("Complete Workout")').click();
      await expect(page.locator('button:has-text("Start Workout")')).toBeVisible();

      await page.goto("/workout-history", { waitUntil: "networkidle" });
      await expect(page.locator("table")).toBeVisible();
      await expect(page.locator("tbody tr").first()).toBeVisible();
    });

    test("should display the workout date in history", async ({ page }) => {
      await completeActiveWorkout(page);

      // Start and complete a workout
      await startWorkout(page);
      await addSet(page, MOVEMENT_NAME, "135", "10");
      await expect(page.locator("li").filter({ hasText: MOVEMENT_NAME })).toBeVisible();

      await page.locator('button:has-text("Complete Workout")').click();
      await expect(page.locator('button:has-text("Start Workout")')).toBeVisible();

      await page.goto("/workout-history", { waitUntil: "networkidle" });
      const today = new Date();
      const monthDay = today.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
      await expect(page.locator("tbody tr").first()).toContainText(monthDay);
    });
  });

  test.describe("complete", () => {
    test("should mark the current workout as completed", async ({ page }) => {
      await completeActiveWorkout(page);
      await startWorkout(page);

      await page.locator('button:has-text("Complete Workout")').click();
      await expect(page.locator('button:has-text("Start Workout")')).toBeVisible();
    });

    test("should move completed workout to history", async ({ page }) => {
      await completeActiveWorkout(page);

      await startWorkout(page);
      await addSet(page, MOVEMENT_NAME, "300", "3");
      await expect(page.locator("li").filter({ hasText: "300 lbs" })).toBeVisible();

      await page.locator('button:has-text("Complete Workout")').click();
      await expect(page.locator('button:has-text("Start Workout")')).toBeVisible();

      await page.goto("/workout-history", { waitUntil: "networkidle" });
      await expect(page.locator("tbody tr").first()).toBeVisible();
    });
  });

  test.describe("delete", () => {
    test("should delete selected workouts from history", async ({ page }) => {
      await completeActiveWorkout(page);

      // Create and complete a workout
      await startWorkout(page);
      await addSet(page, MOVEMENT_NAME, "135", "10");
      await expect(page.locator("li").filter({ hasText: "135 lbs" })).toBeVisible();
      await page.locator('button:has-text("Complete Workout")').click();
      await expect(page.locator('button:has-text("Start Workout")')).toBeVisible();

      // Go to history and delete
      await page.goto("/workout-history", { waitUntil: "networkidle" });
      const rows = page.locator("tbody tr");
      const countBefore = await rows.count();

      await rows.first().locator('input[type="checkbox"]').check();
      await page.locator('button:has-text("Delete Selected")').click();

      await expect(rows).toHaveCount(countBefore - 1);
    });

    test("should allow selecting multiple workouts for deletion", async ({ page }) => {
      await completeActiveWorkout(page);

      // Create and complete two workouts
      for (let i = 0; i < 2; i++) {
        await startWorkout(page);
        await addSet(page, MOVEMENT_NAME, String(100 + i * 50), "5");
        await expect(page.locator("li").filter({ hasText: `${100 + i * 50} lbs` })).toBeVisible();
        await page.locator('button:has-text("Complete Workout")').click();
        await expect(page.locator('button:has-text("Start Workout")')).toBeVisible();
      }

      // Go to history and select only the 2 workouts we just created
      await page.goto("/workout-history", { waitUntil: "networkidle" });
      const rows = page.locator("tbody tr");
      const countBefore = await rows.count();
      expect(countBefore).toBeGreaterThanOrEqual(2);

      // Select the first two rows (the ones we just created, since history is desc)
      await rows.nth(0).locator('input[type="checkbox"]').check();
      await rows.nth(1).locator('input[type="checkbox"]').check();
      await page.locator('button:has-text("Delete Selected")').click();

      await expect(rows).toHaveCount(countBefore - 2);
    });
  });
});
