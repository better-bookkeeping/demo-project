import { test, expect, Page } from "@playwright/test";

const TEST_EMAIL = "e2e-workouts@test.com";
const TEST_PASSWORD = "testpassword123";
const TEST_NAME = "E2E Workouts";

async function signIn(page: Page) {
  await page.goto("/sign-in");

  await page.fill("#email", TEST_EMAIL);
  await page.fill("#password", TEST_PASSWORD);
  await page.click('button[type="submit"]');

  const errorOrNav = await Promise.race([
    page.waitForURL("**/", { timeout: 5000 }).then(() => "navigated"),
    page.locator('[role="alert"]').waitFor({ timeout: 5000 }).then(() => "error"),
  ]);

  if (errorOrNav === "error") {
    await page.goto("/create-account");
    await page.fill("#name", TEST_NAME);
    await page.fill("#email", TEST_EMAIL);
    await page.fill("#password", TEST_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL("**/");
  }
}

async function ensureMovementExists(page: Page, name: string) {
  await page.goto("/movements");
  const existing = page.locator(`li:has-text("${name}")`);
  if (await existing.isVisible().catch(() => false)) return;

  await page.fill('input[placeholder="Movement name (e.g. Bench Press)"]', name);
  await page.click('button:has-text("Add")');
  await expect(page.locator(`text=${name}`)).toBeVisible();
}

async function completeActiveWorkout(page: Page) {
  await page.goto("/current-workout");
  const completeButton = page.locator('button:has-text("Complete Workout")');
  if (await completeButton.isVisible().catch(() => false)) {
    await completeButton.click();
    await expect(page.locator('button:has-text("Start Workout")')).toBeVisible();
  }
}

const MOVEMENT_NAME = "E2E Squat";

test.describe("Workouts", () => {
  test.describe("create", () => {
    test("should start a new workout from the current workout page", async ({ page }) => {
      await signIn(page);
      await completeActiveWorkout(page);
      await page.goto("/current-workout");

      await page.click('button:has-text("Start Workout")');
      await expect(page.locator('button:has-text("Complete Workout")')).toBeVisible();
    });

    test("should show the workout date after starting", async ({ page }) => {
      await signIn(page);
      await completeActiveWorkout(page);
      await page.goto("/current-workout");

      await page.click('button:has-text("Start Workout")');

      // The page should show the current date
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
      await signIn(page);
      await completeActiveWorkout(page);
      await page.goto("/current-workout");

      // Start a workout
      await page.click('button:has-text("Start Workout")');
      await expect(page.locator('button:has-text("Complete Workout")')).toBeVisible();

      // Reload the page and verify it's still active
      await page.reload();
      await expect(page.locator('button:has-text("Complete Workout")')).toBeVisible();
    });

    test("should show 'No active workout' when none exists", async ({ page }) => {
      await signIn(page);
      await completeActiveWorkout(page);
      await page.goto("/current-workout");

      await expect(page.locator("text=No active workout")).toBeVisible();
    });

    test("should display completed workouts in workout history", async ({ page }) => {
      await signIn(page);
      await ensureMovementExists(page, MOVEMENT_NAME);

      // Complete any existing workout first
      await completeActiveWorkout(page);

      // Start and complete a new workout with a set
      await page.goto("/current-workout");
      await page.click('button:has-text("Start Workout")');
      await expect(page.locator('button:has-text("Complete Workout")')).toBeVisible();

      await page.selectOption("select", { label: MOVEMENT_NAME });
      await page.fill('input[placeholder="Weight"]', "225");
      await page.fill('input[placeholder="Reps"]', "5");
      await page.click('button:has-text("Add")');
      await expect(page.locator("li").filter({ hasText: MOVEMENT_NAME })).toBeVisible();

      await page.click('button:has-text("Complete Workout")');
      await expect(page.locator('button:has-text("Start Workout")')).toBeVisible();

      // Check history
      await page.goto("/workout-history");
      await expect(page.locator("table")).toBeVisible();
      await expect(page.locator("tbody tr").first()).toBeVisible();
    });
  });

  test.describe("complete", () => {
    test("should mark the current workout as completed", async ({ page }) => {
      await signIn(page);
      await completeActiveWorkout(page);
      await page.goto("/current-workout");

      await page.click('button:has-text("Start Workout")');
      await expect(page.locator('button:has-text("Complete Workout")')).toBeVisible();

      await page.click('button:has-text("Complete Workout")');
      await expect(page.locator('button:has-text("Start Workout")')).toBeVisible();
    });

    test("should move completed workout to history", async ({ page }) => {
      await signIn(page);
      await ensureMovementExists(page, MOVEMENT_NAME);
      await completeActiveWorkout(page);

      // Start, add a set, and complete
      await page.goto("/current-workout");
      await page.click('button:has-text("Start Workout")');

      await page.selectOption("select", { label: MOVEMENT_NAME });
      await page.fill('input[placeholder="Weight"]', "300");
      await page.fill('input[placeholder="Reps"]', "3");
      await page.click('button:has-text("Add")');
      await expect(page.locator("li").filter({ hasText: "300 lbs" })).toBeVisible();

      await page.click('button:has-text("Complete Workout")');
      await expect(page.locator('button:has-text("Start Workout")')).toBeVisible();

      // Verify it's in history
      await page.goto("/workout-history");
      await expect(page.locator("tbody tr").first()).toBeVisible();
    });
  });

  test.describe("delete", () => {
    test("should delete selected workouts from history", async ({ page }) => {
      await signIn(page);
      await ensureMovementExists(page, MOVEMENT_NAME);
      await completeActiveWorkout(page);

      // Create and complete a workout
      await page.goto("/current-workout");
      await page.click('button:has-text("Start Workout")');
      await page.selectOption("select", { label: MOVEMENT_NAME });
      await page.fill('input[placeholder="Weight"]', "135");
      await page.fill('input[placeholder="Reps"]', "10");
      await page.click('button:has-text("Add")');
      await expect(page.locator("li").filter({ hasText: "135 lbs" })).toBeVisible();
      await page.click('button:has-text("Complete Workout")');
      await expect(page.locator('button:has-text("Start Workout")')).toBeVisible();

      // Go to history and delete
      await page.goto("/workout-history");
      const rows = page.locator("tbody tr");
      const countBefore = await rows.count();

      // Select the first workout
      await rows.first().locator('input[type="checkbox"]').check();
      await page.click('button:has-text("Delete Selected")');

      await expect(rows).toHaveCount(countBefore - 1);
    });

    test("should allow selecting multiple workouts for deletion", async ({ page }) => {
      await signIn(page);
      await ensureMovementExists(page, MOVEMENT_NAME);
      await completeActiveWorkout(page);

      // Create and complete two workouts
      for (let i = 0; i < 2; i++) {
        await page.goto("/current-workout");
        await page.click('button:has-text("Start Workout")');
        await page.selectOption("select", { label: MOVEMENT_NAME });
        await page.fill('input[placeholder="Weight"]', String(100 + i * 50));
        await page.fill('input[placeholder="Reps"]', "5");
        await page.click('button:has-text("Add")');
        await expect(page.locator("li").filter({ hasText: `${100 + i * 50} lbs` })).toBeVisible();
        await page.click('button:has-text("Complete Workout")');
        await expect(page.locator('button:has-text("Start Workout")')).toBeVisible();
      }

      // Go to history and select all via header checkbox
      await page.goto("/workout-history");
      const rows = page.locator("tbody tr");
      const countBefore = await rows.count();
      expect(countBefore).toBeGreaterThanOrEqual(2);

      // Select all
      await page.locator('input[aria-label="Select all"]').check();
      await page.click('button:has-text("Delete Selected")');

      await expect(page.locator("text=No completed workouts yet")).toBeVisible();
    });
  });
});
