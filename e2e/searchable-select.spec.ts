import { test, expect, waitForHydration } from "./fixtures/auth";
import type { Page } from "@playwright/test";

async function logSet(page: Page, movement: string, weight: string, reps: string) {
  const trigger = page.getByTestId("searchable-select-trigger");
  await trigger.click();

  const searchInput = page.getByTestId("searchable-select-search");
  await searchInput.fill(movement);

  const option = page.getByRole("option", { name: new RegExp(movement, "i") }).first();
  await option.click();

  const weightInput = page.getByTestId("weight-input");
  const repsInput = page.getByTestId("reps-input");
  await weightInput.fill(weight);
  await repsInput.fill(reps);

  await page.getByRole("button", { name: /log set/i }).click();
  await expect(page.getByTestId("set-item").first()).toBeVisible({ timeout: 5000 });
}

test.describe("SearchableSelect", () => {
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
      throw new Error("Neither start nor finish button became visible.");
    });

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

    await startButton.click();
    await expect(page.getByRole("heading", { name: /current workout/i })).toBeVisible({ timeout: 10000 });
  });

  test.afterEach(async ({ page }) => {
    try {
      await page.keyboard.press("Escape");
      await page.waitForLoadState("networkidle").catch(() => {});
    } catch {}
  });

  test.describe("movement selection with search", () => {
    test("should open dropdown when clicking movement selector", async ({ page }) => {
      const trigger = page.getByTestId("searchable-select-trigger");
      await expect(trigger).toBeVisible();
      await trigger.click();

      const searchInput = page.getByTestId("searchable-select-search");
      await expect(searchInput).toBeVisible();
      await expect(searchInput).toBeFocused();
    });

    test("should filter movements when typing in search", async ({ page }) => {
      const trigger = page.getByTestId("searchable-select-trigger");
      await trigger.click();

      const searchInput = page.getByTestId("searchable-select-search");
      await searchInput.fill("Bench");

      await expect(page.getByRole("option", { name: /bench/i })).toBeVisible();
      await expect(page.getByRole("option", { name: /squat/i })).not.toBeVisible();
    });

    test("should show 'No results found' when search matches nothing", async ({ page }) => {
      const trigger = page.getByTestId("searchable-select-trigger");
      await trigger.click();

      const searchInput = page.getByTestId("searchable-select-search");
      await searchInput.fill("NonExistentMovement12345");

      await expect(page.getByTestId("searchable-select-empty")).toBeVisible();
    });

    test("should select movement and close dropdown", async ({ page }) => {
      const trigger = page.getByTestId("searchable-select-trigger");
      await trigger.click();

      const searchInput = page.getByTestId("searchable-select-search");
      await searchInput.fill("Squat");
      await page.getByRole("option", { name: /squat/i }).first().click();

      await expect(page.getByTestId("searchable-select-search")).not.toBeVisible();
      await expect(trigger).toContainText(/squat/i);
    });

    test("should show checkmark on selected option", async ({ page }) => {
      const trigger = page.getByTestId("searchable-select-trigger");
      await trigger.click();

      const searchInput = page.getByTestId("searchable-select-search");
      await searchInput.fill("Bench");
      await page.getByRole("option", { name: /bench/i }).first().click();

      await trigger.click();
      await searchInput.fill("Bench");

      const checkmark = page.locator("svg.lucide-check");
      await expect(checkmark).toBeVisible();
    });

    test("should show (BW) indicator for bodyweight movements", async ({ page }) => {
      const trigger = page.getByTestId("searchable-select-trigger");
      await trigger.click();

      const searchInput = page.getByTestId("searchable-select-search");
      await searchInput.fill("Pull");

      await expect(page.getByText(/\(bw\)/i)).toBeVisible();
    });

    test("should clear search when closing and reopening dropdown", async ({ page }) => {
      const trigger = page.getByTestId("searchable-select-trigger");
      await trigger.click();

      const searchInput = page.getByTestId("searchable-select-search");
      await searchInput.fill("Bench");

      await page.keyboard.press("Escape");

      await trigger.click();

      await expect(searchInput).toHaveValue("");
    });

    test("should filter case-insensitively", async ({ page }) => {
      const trigger = page.getByTestId("searchable-select-trigger");
      await trigger.click();

      const searchInput = page.getByTestId("searchable-select-search");

      await searchInput.fill("deadlift");
      await expect(page.getByRole("option", { name: /deadlift/i })).toBeVisible();

      await searchInput.clear();
      await searchInput.fill("DEADLIFT");
      await expect(page.getByRole("option", { name: /deadlift/i })).toBeVisible();

      await searchInput.clear();
      await searchInput.fill("DeAdLiFt");
      await expect(page.getByRole("option", { name: /deadlift/i })).toBeVisible();
    });
  });
});
