import { test, expect, waitForHydration } from "./fixtures/auth";
import type { Page } from "@playwright/test";

async function logFood(page: Page, food: string, calories: string): Promise<void> {
  await page.goto("/nutrition");
  await waitForHydration(page);

  const searchInput = page.getByPlaceholder(/search for a food/i);
  await searchInput.click();
  await searchInput.fill("xyznonexistentfood123");

  const manualEntryButton = page.getByRole("button", { name: /enter manually instead/i });
  await expect(manualEntryButton).toBeVisible({ timeout: 5000 });
  await manualEntryButton.click();

  const foodInput = page.getByPlaceholder(/enter food name manually/i);
  await expect(foodInput).toBeVisible();
  await foodInput.fill(food);

  const caloriesInput = page.locator('input[placeholder="0"]').first();
  await caloriesInput.fill(calories);

  const logButton = page.getByRole("button", { name: /log food/i });
  await expect(logButton).toBeEnabled({ timeout: 3000 });
  await logButton.click();
  await expect(page.getByText(food)).toBeVisible({ timeout: 5000 });
}

test.describe("Nutrition", () => {
  test.beforeEach(async ({ auth }) => {
    await auth.signIn();
  });

  test.afterEach(async ({ page }) => {
    try {
      await page.keyboard.press("Escape");
      await page.waitForTimeout(100);
    } catch {}
  });

  test.describe("page load", () => {
    test("should display the nutrition page", async ({ page }) => {
      await page.goto("/nutrition");
      await waitForHydration(page);

      await expect(page.getByRole("heading", { name: /nutrition/i })).toBeVisible();
      await expect(page.getByText("Calories").first()).toBeVisible();
    });

    test("should show the log food form", async ({ page }) => {
      await page.goto("/nutrition");
      await waitForHydration(page);

      await expect(page.getByRole("button", { name: /log food/i })).toBeVisible();
      await expect(page.getByPlaceholder(/search for a food/i)).toBeVisible();
    });
  });

  test.describe("create nutrition entry", () => {
    test("should log a new food entry", async ({ page }) => {
      await page.goto("/nutrition");
      await waitForHydration(page);

      await logFood(page, "Chicken Breast", "165");

      await expect(page.getByText(/165/).first()).toBeVisible({ timeout: 5000 });
    });

    test("should clear input after logging food", async ({ page }) => {
      await page.goto("/nutrition");
      await waitForHydration(page);

      await logFood(page, "Salmon", "208");

      const searchInput = page.getByPlaceholder(/search for a food/i);
      await expect(searchInput).toHaveValue("");
    });

    test("should update daily totals after logging", async ({ page }) => {
      await page.goto("/nutrition");
      await waitForHydration(page);

      await logFood(page, "Rice", "150");
      await logFood(page, "Beans", "120");

      await expect(page.getByText(/270/)).toBeVisible();
    });
  });

  test.describe("read nutrition entries", () => {
    test("should display entries grouped by meal type", async ({ page }) => {
      await page.goto("/nutrition");
      await waitForHydration(page);

      await logFood(page, "Oatmeal", "150");

      await expect(page.getByRole("heading", { name: /breakfast/i })).toBeVisible();
    });
  });

  test.describe("goal management", () => {
    test("should set nutrition goals", async ({ page }) => {
      await page.goto("/nutrition");
      await waitForHydration(page);

      const setGoalsButton = page.getByRole("button", { name: /set goals/i });
      await setGoalsButton.click();

      const caloriesInput = page.locator('input[placeholder="2000"]');
      await caloriesInput.fill("2000");

      const saveButton = page.getByRole("button", { name: /save goals/i });
      await saveButton.click();

      await expect(page.getByText(/2000 goal/)).toBeVisible({ timeout: 5000 });
    });

    test("should show progress bars when goals are set", async ({ page }) => {
      await page.goto("/nutrition");
      await waitForHydration(page);

      const setGoalsButton = page.getByRole("button", { name: /set goals/i });
      await setGoalsButton.click();

      await page.waitForTimeout(500);

      const caloriesInput = page.locator('input[placeholder="2000"]');
      await caloriesInput.fill("2000");

      const proteinInput = page.locator('input[placeholder="150"]');
      await proteinInput.fill("150");

      const saveButton = page.getByRole("button", { name: /save goals/i });
      await saveButton.click();

      await expect(page.getByText(/daily progress/i)).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe("delete nutrition entry", () => {
    test("should delete a food entry", async ({ page }) => {
      await page.goto("/nutrition");
      await waitForHydration(page);

      await logFood(page, "Test Food", "100");

      const entryRow = page.getByTestId("nutrition-entry").filter({ hasText: "Test Food" });
      await expect(entryRow.first()).toBeVisible({ timeout: 5000 });
      await entryRow.first().hover();

      const deleteButton = entryRow.first().getByRole("button");
      await deleteButton.click();

      await expect(entryRow).not.toBeVisible({ timeout: 3000 });
    });
  });

  test.describe("daily totals", () => {
    test("should display summary cards", async ({ page }) => {
      await page.goto("/nutrition");
      await waitForHydration(page);

      await expect(page.getByText("Protein", { exact: true }).first()).toBeVisible();
      await expect(page.getByText("Carbs", { exact: true }).first()).toBeVisible();
      await expect(page.getByText("Fat", { exact: true }).first()).toBeVisible();
    });
  });
});
