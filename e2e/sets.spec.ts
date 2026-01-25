import { test, expect, waitForHydration, fillWithRetry, WAIT } from "./fixtures/auth";
import type { Page } from "@playwright/test";

async function logSet(page: Page, movement: string, weight: string, reps: string) {
  await page.getByRole("combobox").click();
  await page.waitForTimeout(WAIT.SHORT);
  await page.getByRole("option", { name: movement }).click();
  await page.waitForTimeout(WAIT.SHORT);
  await page.locator('input[placeholder="0"]').first().fill(weight);
  await page.locator('input[placeholder="0"]').last().fill(reps);
  await page.getByRole("button", { name: /log set/i }).click();
  await page.waitForTimeout(WAIT.MEDIUM);
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
  test.describe.configure({ mode: "serial" });

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
    await expect(page.getByRole("combobox")).toBeVisible({ timeout: 10000 });
    await waitForHydration(page);
  });

  test.afterEach(async ({ page }) => {
    try {
      const currentUrl = page.url();
      if (!currentUrl.includes("/current-workout")) {
        return;
      }

      await page.keyboard.press("Escape");
      await page.waitForTimeout(100);

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

      await page.getByRole("combobox").click();
      await page.waitForTimeout(WAIT.SHORT);
      await page.getByRole("option", { name: "Deadlift" }).click();
      await page.waitForTimeout(WAIT.SHORT);
      await expect(logSetButton).toBeDisabled();

      await page.locator('input[placeholder="0"]').first().fill("315");
      await expect(logSetButton).toBeDisabled();

      await page.locator('input[placeholder="0"]').last().fill("3");
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
      await page.waitForTimeout(WAIT.LONG);

      await page.goto("/current-workout");
      await waitForHydration(page);

      await page.getByRole("combobox").click();
      await page.waitForTimeout(WAIT.SHORT);
      const pullUpOption = page.getByRole("option").filter({ hasText: "Pull Up" });
      await pullUpOption.click();

      const weightInput = page.getByTestId("weight-input");
      await expect(weightInput).toHaveValue("180");
    });
  });

  test.describe("read", () => {
    test("should display sets with movement name, weight, and reps", async ({ page }) => {
      await logSet(page, "Bench Press", "185", "6");

      await expect(page.getByTestId("set-item").first()).toBeVisible({ timeout: 5000 });
      await page.waitForTimeout(WAIT.LONG);

      await expect(page.getByRole("heading", { name: "Bench Press" })).toBeVisible();

      const setRow = page.getByTestId("set-item").first();
      await expect(setRow.getByTestId("set-weight")).toContainText("185");
      await expect(setRow).toContainText("lbs");
      await expect(setRow.getByTestId("set-reps")).toContainText("6");
      await expect(setRow).toContainText("reps");
    });

    test("should show sets in the order they were added", async ({ page }) => {
      await page.getByRole("combobox").click();
      await page.waitForTimeout(WAIT.SHORT);
      await page.getByRole("option", { name: "Squat" }).click();
      await page.waitForTimeout(WAIT.SHORT);

      const logSetButton = page.getByRole("button", { name: /log set/i });

      await page.locator('input[placeholder="0"]').first().fill("135");
      await page.locator('input[placeholder="0"]').last().fill("10");
      await expect(logSetButton).toBeEnabled();
      await logSetButton.click();
      await page.waitForTimeout(WAIT.SHORT);

      await page.locator('input[placeholder="0"]').first().fill("185");
      await page.locator('input[placeholder="0"]').last().fill("8");
      await expect(logSetButton).toBeEnabled();
      await logSetButton.click();
      await page.waitForTimeout(WAIT.SHORT);

      await page.locator('input[placeholder="0"]').first().fill("225");
      await page.locator('input[placeholder="0"]').last().fill("5");
      await expect(logSetButton).toBeEnabled();
      await logSetButton.click();
      await page.waitForTimeout(WAIT.MEDIUM);

      const setNumbers = page.getByTestId("set-index");
      const numbers = await setNumbers.allTextContents();
      const orderedNumbers = numbers.filter((n) => /^\d+$/.test(n.trim())).map((n) => n.trim());

      expect(orderedNumbers).toEqual(["1", "2", "3"]);
    });

    test("should group sets by movement", async ({ page }) => {
      const logSetButton = page.getByRole("button", { name: /log set/i });

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
      await page.waitForTimeout(WAIT.SHORT);

      await expect(page.getByTestId("set-item").filter({ hasText: "315" })).not.toBeVisible();
    });

    test("should update the sets list after deletion", async ({ page }) => {
      await page.getByRole("combobox").click();
      await page.waitForTimeout(WAIT.SHORT);
      await page.getByRole("option", { name: "Squat" }).click();
      await page.waitForTimeout(WAIT.SHORT);

      const logSetButton = page.getByRole("button", { name: /log set/i });

      await page.locator('input[placeholder="0"]').first().fill("135");
      await page.locator('input[placeholder="0"]').last().fill("10");
      await expect(logSetButton).toBeEnabled();
      await logSetButton.click();
      await page.waitForTimeout(WAIT.SHORT);

      await page.locator('input[placeholder="0"]').first().fill("185");
      await page.locator('input[placeholder="0"]').last().fill("8");
      await expect(logSetButton).toBeEnabled();
      await logSetButton.click();
      await page.waitForTimeout(WAIT.MEDIUM);

      const setsLabel = page.locator("span").filter({ hasText: /2 SETS/i });
      await expect(setsLabel).toBeVisible();

      const firstSetRow = page.getByTestId("set-item").first();
      await firstSetRow.getByTestId("delete-set-button").click({ force: true });
      await page.waitForTimeout(WAIT.MEDIUM);

      await expect(page.locator("span").filter({ hasText: /1 SETS/i })).toBeVisible();
    });

    test("should update total volume after deletion", async ({ page }) => {
      await logSet(page, "Bench Press", "100", "10");

      await expect(page.getByText(/1\.0k/i)).toBeVisible();

      const setRow = page.getByTestId("set-item").first();
      await setRow.getByTestId("delete-set-button").click({ force: true });
      await page.waitForTimeout(WAIT.SHORT);

      await expect(page.getByText(/0\.0k/i)).toBeVisible();
    });
  });

  test.describe("PR detection", () => {
    test("should show PR badge when setting a new personal record with higher weight", async ({ page }) => {
      await logSet(page, "Lat Pulldown", "100", "10");
      await page.getByTestId("finish-workout-button").click();
      await page.waitForTimeout(WAIT.LONG);

      await page.goto("/current-workout");
      await waitForHydration(page);

      await page.getByTestId("start-workout-button").waitFor({ state: "visible", timeout: 10000 });
      await page.getByTestId("start-workout-button").click();
      await logSet(page, "Lat Pulldown", "120", "10");

      const setRow = page.getByTestId("set-item").first();
      await expect(setRow.locator("svg.lucide-trophy")).toBeVisible();
    });

    test("should show PR badge when setting new record with same weight but more reps", async ({ page }) => {
      await logSet(page, "Seated Row", "120", "8");
      await page.getByTestId("finish-workout-button").click();
      await page.waitForTimeout(WAIT.LONG);

      await page.goto("/current-workout");
      await waitForHydration(page);

      await page.getByTestId("start-workout-button").waitFor({ state: "visible", timeout: 10000 });
      await page.getByTestId("start-workout-button").click();
      await logSet(page, "Seated Row", "120", "12");

      const setRow = page.getByTestId("set-item").first();
      await expect(setRow.locator("svg.lucide-trophy")).toBeVisible();
    });

    test("should NOT show PR when weight is lower even with more reps", async ({ page }) => {
      await logSet(page, "Tricep Extension", "50", "10");
      await page.getByTestId("finish-workout-button").click();
      await page.waitForTimeout(WAIT.LONG);

      await page.goto("/current-workout");
      await waitForHydration(page);

      await page.getByTestId("start-workout-button").waitFor({ state: "visible", timeout: 10000 });
      await page.getByTestId("start-workout-button").click();
      await logSet(page, "Tricep Extension", "40", "15");

      const setRow = page.getByTestId("set-item").first();
      await expect(setRow.locator("svg.lucide-trophy")).not.toBeVisible();
    });

    test("should NOT show PR when same weight and fewer reps", async ({ page }) => {
      await logSet(page, "Dumbbell Curl", "35", "12");
      await page.getByTestId("finish-workout-button").click();
      await page.waitForTimeout(WAIT.LONG);

      await page.goto("/current-workout");
      await waitForHydration(page);

      await page.getByTestId("start-workout-button").waitFor({ state: "visible", timeout: 10000 });
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
      await page.waitForTimeout(WAIT.LONG);

      await page.goto("/current-workout");
      await waitForHydration(page);

      await page.getByTestId("start-workout-button").waitFor({ state: "visible", timeout: 10000 });
      await page.getByTestId("start-workout-button").click();
      await logSet(page, "Leg Press", "350", "10");

      const movementHeader = page.getByRole("heading", { name: "Leg Press" });
      const trophyIcon = movementHeader.locator("svg.text-primary");
      await expect(trophyIcon).toBeVisible();
    });
  });

  test.describe("body-weight movements", () => {
    test("should show (BW) indicator in movement dropdown for body-weight movements", async ({ page }) => {
      await page.getByRole("combobox").click();

      const pullUpOption = page.getByRole("option").filter({ hasText: "Pull Up" });
      await expect(pullUpOption.getByText("(BW)")).toBeVisible();
    });
  });
});
