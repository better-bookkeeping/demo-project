import { test, expect, waitForHydration, fillWithRetry } from "./fixtures/auth";
import type { Page } from "@playwright/test";

async function logSet(page: Page, movement: string, weight: string, reps: string) {
  const trigger = page.getByTestId("searchable-select-trigger");
  await trigger.click();

  const searchInput = page.getByTestId("searchable-select-search");
  await searchInput.fill(movement);

  const option = page.getByRole("option").filter({ hasText: new RegExp(movement, "i") }).first();
  await option.click();

  const weightInput = page.getByTestId("weight-input");
  const repsInput = page.getByTestId("reps-input");
  await weightInput.fill(weight);
  await repsInput.fill(reps);

  await page.getByRole("button", { name: /log set/i }).click();
  await expect(page.getByTestId("set-item").first()).toBeVisible({ timeout: 5000 });
}

async function finishWorkout(page: Page) {
  const finishButton = page.getByTestId("finish-workout-button");
  const startButton = page.getByTestId("start-workout-button");

  const finishVisible = await finishButton.isVisible().catch(() => false);
  if (finishVisible) {
    await finishButton.click();
    const finishAnywayButton = page.getByRole("button", { name: /finish anyway/i });
    try {
      await finishAnywayButton.waitFor({ state: "visible", timeout: 2000 });
      await finishAnywayButton.click();
    } catch {}
    await startButton.waitFor({ state: "visible", timeout: 5000 });
  }
}

test.describe("Sets", () => {
  test.beforeEach(async ({ auth, page }) => {
    await auth.signIn();
    await page.goto("/current-workout");
    await waitForHydration(page);

    const startButton = page.getByTestId("start-workout-button");
    const finishButton = page.getByTestId("finish-workout-button");

    await Promise.race([
      startButton.waitFor({ state: "visible", timeout: 15000 }),
      finishButton.waitFor({ state: "visible", timeout: 15000 }),
    ]).catch(() => {
      throw new Error("Neither start nor finish button became visible. Page may not have loaded.");
    });

    await finishWorkout(page);
    await startButton.click();

    await expect(page.getByRole("heading", { name: /current workout/i })).toBeVisible({ timeout: 10000 });
    await expect(page.getByTestId("searchable-select-trigger")).toBeVisible({ timeout: 10000 });
    await waitForHydration(page);
  });

  test.afterEach(async ({ page }) => {
    try {
      const currentUrl = page.url();
      if (!currentUrl.includes("/current-workout")) {
        return;
      }

      await page.keyboard.press("Escape");

      const finishButton = page.getByTestId("finish-workout-button");
      const startButton = page.getByTestId("start-workout-button");

      const finishVisible = await finishButton.isVisible().catch(() => false);

      if (finishVisible) {
        await finishButton.click();
        const finishAnywayButton = page.getByRole("button", { name: /finish anyway/i });
        try {
          await finishAnywayButton.waitFor({ state: "visible", timeout: 2000 });
          await finishAnywayButton.click();
        } catch {}
        await startButton.waitFor({ state: "visible", timeout: 5000 });
      }
    } catch {}
  });

  test.describe("create", () => {
    test("should add a set to the current workout", async ({ page }) => {
      await logSet(page, "Squat", "225", "5");

      const setRow = page.getByTestId("set-item").first();
      await expect(setRow).toBeVisible();
      await expect(setRow.getByTestId("set-weight")).toContainText("225");
      await expect(setRow.getByTestId("set-reps")).toContainText("5");
    });

    test("should require movement, weight, and reps to add a set", async ({ page }) => {
      const logSetButton = page.getByRole("button", { name: /log set/i });
      await expect(logSetButton).toBeDisabled();

      await page.getByTestId("searchable-select-trigger").click();
      await page.getByTestId("searchable-select-search").fill("Deadlift");
      await page.getByRole("option").filter({ hasText: "Deadlift" }).first().click();
      await expect(logSetButton).toBeDisabled();

      await page.getByTestId("weight-input").fill("315");
      await expect(logSetButton).toBeDisabled();

      await page.getByTestId("reps-input").fill("3");
      await expect(logSetButton).toBeEnabled();
    });

    test("should display the new set in the workout", async ({ page }) => {
      await logSet(page, "Overhead Press", "135", "8");

      const setRow = page.getByTestId("set-item").first();
      await expect(setRow).toBeVisible();
      await expect(setRow.getByTestId("set-weight")).toContainText("135");
      await expect(setRow.getByTestId("set-reps")).toContainText("8");
    });

    test("should auto-fill body weight for body-weight movements", async ({ page }) => {
      await page.goto("/weight-tracking");
      await waitForHydration(page);

      await fillWithRetry(page.getByRole("spinbutton"), "180");
      await page.getByRole("button", { name: /log weight/i }).click();
      await expect(page.getByPlaceholder("0.0")).toHaveValue("");

      await page.goto("/current-workout");
      await waitForHydration(page);

      await page.getByTestId("searchable-select-trigger").click();
      await page.getByTestId("searchable-select-search").fill("Pull");
      const pullUpOption = page.getByRole("option").filter({ hasText: "Pull Up" }).first();
      await pullUpOption.click();

      const weightInput = page.getByTestId("weight-input");
      await expect(weightInput).toHaveValue("180");
    });
  });

  test.describe("read", () => {
    test("should display sets with movement name, weight, and reps", async ({ page }) => {
      await logSet(page, "Bench Press", "185", "6");

      await expect(page.getByRole("heading", { name: "Bench Press" })).toBeVisible({ timeout: 5000 });

      const setRow = page.getByTestId("set-item").first();
      await expect(setRow.getByTestId("set-weight")).toContainText("185");
      await expect(setRow).toContainText("lbs");
      await expect(setRow.getByTestId("set-reps")).toContainText("6");
      await expect(setRow).toContainText("reps");
    });

    test("should show sets in the order they were added", async ({ page }) => {
      const logSetButton = page.getByRole("button", { name: /log set/i });

      await page.getByTestId("searchable-select-trigger").click();
      await page.getByTestId("searchable-select-search").fill("Squat");
      await page.getByRole("option").filter({ hasText: "Squat" }).first().click();

      await page.getByTestId("weight-input").fill("135");
      await page.getByTestId("reps-input").fill("10");
      await expect(logSetButton).toBeEnabled();
      await logSetButton.click();

      await page.getByTestId("searchable-select-trigger").click();
      await page.getByTestId("searchable-select-search").fill("Squat");
      await page.getByRole("option").filter({ hasText: "Squat" }).first().click();

      await page.getByTestId("weight-input").fill("185");
      await page.getByTestId("reps-input").fill("8");
      await expect(logSetButton).toBeEnabled();
      await logSetButton.click();

      await page.getByTestId("searchable-select-trigger").click();
      await page.getByTestId("searchable-select-search").fill("Squat");
      await page.getByRole("option").filter({ hasText: "Squat" }).first().click();

      await page.getByTestId("weight-input").fill("225");
      await page.getByTestId("reps-input").fill("5");
      await expect(logSetButton).toBeEnabled();
      await logSetButton.click();

      await expect(page.getByTestId("set-item").nth(2)).toBeVisible({ timeout: 5000 });

      const setNumbers = page.getByTestId("set-index");
      const numbers = await setNumbers.allTextContents();
      const orderedNumbers = numbers.filter((n) => /^\d+$/.test(n.trim())).map((n) => n.trim());

      expect(orderedNumbers).toEqual(["1", "2", "3"]);
    });

    test("should group sets by movement", async ({ page }) => {
      await logSet(page, "Bench Press", "135", "10");
      await logSet(page, "Squat", "185", "8");
      await logSet(page, "Bench Press", "155", "8");

      const benchPressHeader = page.getByRole("heading", { name: "Bench Press" });
      await expect(benchPressHeader).toBeVisible();
      await expect(page.locator("span").filter({ hasText: /2 SETS/i })).toBeVisible();
    });
  });

  test.describe("delete", () => {
    test("should remove a set from the current workout", async ({ page }) => {
      await logSet(page, "Deadlift", "315", "5");

      const setRow = page.getByTestId("set-item").first();
      await expect(setRow).toBeVisible();
      await expect(setRow.getByTestId("set-weight")).toContainText("315");

      await setRow.getByTestId("delete-set-button").click({ force: true });

      await expect(page.getByTestId("set-item").filter({ hasText: "315" })).not.toBeVisible({ timeout: 3000 });
    });

    test("should update the sets list after deletion", async ({ page }) => {
      const logSetButton = page.getByRole("button", { name: /log set/i });

      await page.getByTestId("searchable-select-trigger").click();
      await page.getByTestId("searchable-select-search").fill("Squat");
      await page.getByRole("option").filter({ hasText: "Squat" }).first().click();

      await page.getByTestId("weight-input").fill("135");
      await page.getByTestId("reps-input").fill("10");
      await expect(logSetButton).toBeEnabled();
      await logSetButton.click();

      await page.getByTestId("searchable-select-trigger").click();
      await page.getByTestId("searchable-select-search").fill("Squat");
      await page.getByRole("option").filter({ hasText: "Squat" }).first().click();

      await page.getByTestId("weight-input").fill("185");
      await page.getByTestId("reps-input").fill("8");
      await expect(logSetButton).toBeEnabled();
      await logSetButton.click();

      await expect(page.locator("span").filter({ hasText: /2 SETS/i })).toBeVisible({ timeout: 5000 });

      const firstSetRow = page.getByTestId("set-item").first();
      await firstSetRow.getByTestId("delete-set-button").click({ force: true });

      await expect(page.locator("span").filter({ hasText: /1 SETS/i })).toBeVisible({ timeout: 3000 });
    });

    test("should update total volume after deletion", async ({ page }) => {
      await logSet(page, "Bench Press", "100", "10");

      await expect(page.getByText(/1\.0k/i)).toBeVisible();

      const setRow = page.getByTestId("set-item").first();
      await setRow.getByTestId("delete-set-button").click({ force: true });

      await expect(page.getByText(/0\.0k/i)).toBeVisible({ timeout: 3000 });
    });
  });

  test.describe("PR detection", () => {
    test("should show PR badge when setting a new personal record with higher weight", async ({ page }) => {
      await logSet(page, "Lat Pulldown", "100", "10");
      await page.getByTestId("finish-workout-button").click();
      await page.getByTestId("start-workout-button").waitFor({ state: "visible", timeout: 10000 });

      await page.goto("/current-workout");
      await waitForHydration(page);

      await page.getByTestId("start-workout-button").click();
      await logSet(page, "Lat Pulldown", "120", "10");

      const setRow = page.getByTestId("set-item").first();
      await expect(setRow.locator("svg.lucide-trophy")).toBeVisible();
    });

    test("should show PR badge when setting new record with same weight but more reps", async ({ page }) => {
      await logSet(page, "Seated Row", "120", "8");
      await page.getByTestId("finish-workout-button").click();
      await page.getByTestId("start-workout-button").waitFor({ state: "visible", timeout: 10000 });

      await page.goto("/current-workout");
      await waitForHydration(page);

      await page.getByTestId("start-workout-button").click();
      await logSet(page, "Seated Row", "120", "12");

      const setRow = page.getByTestId("set-item").first();
      await expect(setRow.locator("svg.lucide-trophy")).toBeVisible();
    });

    test("should NOT show PR when weight is lower even with more reps", async ({ page }) => {
      await logSet(page, "Tricep Extension", "50", "10");
      await page.getByTestId("finish-workout-button").click();
      await page.getByTestId("start-workout-button").waitFor({ state: "visible", timeout: 10000 });

      await page.goto("/current-workout");
      await waitForHydration(page);

      await page.getByTestId("start-workout-button").click();
      await logSet(page, "Tricep Extension", "40", "15");

      const setRow = page.getByTestId("set-item").first();
      await expect(setRow.locator("svg.lucide-trophy")).not.toBeVisible();
    });

    test("should NOT show PR when same weight and fewer reps", async ({ page }) => {
      await logSet(page, "Dumbbell Curl", "35", "12");
      await page.getByTestId("finish-workout-button").click();
      await page.getByTestId("start-workout-button").waitFor({ state: "visible", timeout: 10000 });

      await page.goto("/current-workout");
      await waitForHydration(page);

      await page.getByTestId("start-workout-button").click();
      await logSet(page, "Dumbbell Curl", "35", "10");

      const setRow = page.getByTestId("set-item").first();
      await expect(setRow.locator("svg.lucide-trophy")).not.toBeVisible();
    });

    test("should show PR for first-ever set of a movement", async ({ page }) => {
      await page.goto("/movements");
      await waitForHydration(page);

      const uniqueMovement = `PR Test ${Date.now()}`;
      const nameInput = page.getByTestId("movement-name-input");
      await fillWithRetry(nameInput, uniqueMovement);

      const addButton = page.getByTestId("add-movement-button");
      await addButton.waitFor({ state: "visible", timeout: 5000 });
      await expect(addButton).toBeEnabled();
      await addButton.click();

      await expect(page.getByText(/movement added to arsenal/i)).toBeVisible();

      await page.goto("/current-workout");
      await waitForHydration(page);

      await finishWorkout(page);
      const startButton = page.getByTestId("start-workout-button");
      await startButton.click();
      await logSet(page, uniqueMovement, "100", "10");

      const setRow = page.getByTestId("set-item").first();
      await expect(setRow.locator("svg.lucide-trophy")).toBeVisible();
    });

    test("should show trophy icon next to movement group with PR", async ({ page }) => {
      await logSet(page, "Leg Press", "300", "10");
      await page.getByTestId("finish-workout-button").click();
      await page.getByTestId("start-workout-button").waitFor({ state: "visible", timeout: 10000 });

      await page.goto("/current-workout");
      await waitForHydration(page);

      await page.getByTestId("start-workout-button").click();
      await logSet(page, "Leg Press", "350", "10");

      const movementHeader = page.getByRole("heading", { name: "Leg Press" });
      const trophyIcon = movementHeader.locator("svg.text-primary");
      await expect(trophyIcon).toBeVisible();
    });
  });

  test.describe("body-weight movements", () => {
    test("should show (BW) indicator in movement dropdown for body-weight movements", async ({ page }) => {
      await page.getByTestId("searchable-select-trigger").click();

      const pullUpOption = page.getByRole("option").filter({ hasText: "Pull Up" }).first();
      await expect(pullUpOption.getByText("(BW)")).toBeVisible();
    });
  });

  test.describe("colored stats cards", () => {
    test("should show green color for total sets stat", async ({ page }) => {
      await logSet(page, "Squat", "225", "5");

      const totalSetsStat = page.getByTestId("total-sets-stat");
      await expect(totalSetsStat).toBeVisible();

      const totalSetsValue = totalSetsStat.getByTestId("total-sets-value");
      await expect(totalSetsValue).toHaveClass(/text-success/i);
    });

    test("should show orange color for total volume stat", async ({ page }) => {
      await logSet(page, "Bench Press", "185", "10");

      const totalVolumeStat = page.getByTestId("total-volume-stat");
      await expect(totalVolumeStat).toBeVisible();

      const totalVolumeValue = totalVolumeStat.getByTestId("total-volume-value");
      await expect(totalVolumeValue).toHaveClass(/text-primary/i);
    });

    test("should show yellow color for movements count stat", async ({ page }) => {
      await logSet(page, "Squat", "225", "5");

      const movementsCountStat = page.getByTestId("movements-count-stat");
      await expect(movementsCountStat).toBeVisible();

      const movementsCountValue = movementsCountStat.getByTestId("movements-count-value");
      await expect(movementsCountValue).toHaveClass(/text-warning/i);
    });

    test("should update total sets count when adding sets", async ({ page }) => {
      await logSet(page, "Squat", "225", "5");

      const totalSetsValue = page.getByTestId("total-sets-value");
      await expect(totalSetsValue).toContainText("1");

      await logSet(page, "Squat", "185", "8");

      await expect(totalSetsValue).toContainText("2");
    });

    test("should calculate volume correctly (weight × reps)", async ({ page }) => {
      await logSet(page, "Bench Press", "100", "10");

      const totalVolumeValue = page.getByTestId("total-volume-value");
      await expect(totalVolumeValue).toContainText("1.0k");
    });

    test("should increment movements count for new movement", async ({ page }) => {
      await logSet(page, "Squat", "225", "5");

      const movementsCountValue = page.getByTestId("movements-count-value");
      await expect(movementsCountValue).toContainText("1");

      await logSet(page, "Bench Press", "185", "8");

      await expect(movementsCountValue).toContainText("2");
    });

    test("should not increment movements count for same movement", async ({ page }) => {
      await logSet(page, "Squat", "225", "5");
      await logSet(page, "Squat", "185", "8");

      const movementsCountValue = page.getByTestId("movements-count-value");
      await expect(movementsCountValue).toContainText("1");
    });

    test("should update stats when deleting set", async ({ page }) => {
      await logSet(page, "Squat", "225", "5");
      await logSet(page, "Squat", "185", "8");

      const totalSetsValue = page.getByTestId("total-sets-value");
      await expect(totalSetsValue).toContainText("2");

      const setRow = page.getByTestId("set-item").first();
      await setRow.getByTestId("delete-set-button").click({ force: true });

      await expect(totalSetsValue).toContainText("1");
    });
  });
});
