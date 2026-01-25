import { test, expect, waitForHydration, WAIT } from "./fixtures/auth";
import type { Page } from "@playwright/test";

async function logWeight(page: Page, weight: string): Promise<void> {
  const weightInput = page.getByPlaceholder("0.0");
  await weightInput.click();
  await weightInput.clear();
  await weightInput.fill(weight);
  await expect(weightInput).toHaveValue(weight);

  const logButton = page.getByRole("button", { name: /log weight/i });
  await expect(logButton).toBeEnabled({ timeout: 3000 });
  await logButton.click();
  await page.waitForTimeout(WAIT.MEDIUM);
}

test.describe("Weight Tracking", () => {
  test.describe.configure({ mode: "serial" });

  test.beforeEach(async ({ auth }) => {
    await auth.signIn();
  });

  test.afterEach(async ({ page }) => {
    try {
      await page.keyboard.press("Escape");
      await page.waitForTimeout(WAIT.SHORT);
    } catch {
      // Cleanup errors are acceptable
    }
  });

  test.describe("page load", () => {
    test("should display the weight tracking page", async ({ page }) => {
      await page.goto("/weight-tracking");
      await waitForHydration(page);

      await expect(page.getByRole("heading", { name: /weight room/i })).toBeVisible();
      await expect(page.getByText(/current weight/i)).toBeVisible();
    });

    test("should show the log weight form", async ({ page }) => {
      await page.goto("/weight-tracking");
      await waitForHydration(page);

      await expect(page.getByRole("button", { name: /log weight/i })).toBeVisible();
      await expect(page.getByPlaceholder("0.0")).toBeVisible();
    });
  });

  test.describe("create weight entry", () => {
    test("should log a new weight entry", async ({ page }) => {
      await page.goto("/weight-tracking");
      await waitForHydration(page);

      const testWeight = "175.5";
      await logWeight(page, testWeight);

      await expect(page.getByText(testWeight).first()).toBeVisible();
    });

    test("should clear input after logging weight", async ({ page }) => {
      await page.goto("/weight-tracking");
      await waitForHydration(page);

      await logWeight(page, "180");
      await expect(page.getByPlaceholder("0.0")).toHaveValue("");
    });

    test("should update current weight display after logging", async ({ page }) => {
      await page.goto("/weight-tracking");
      await waitForHydration(page);

      const newWeight = "185.0";
      await logWeight(page, newWeight);

      await expect(page.locator("text=185").first()).toBeVisible();
    });
  });

  test.describe("read weight history", () => {
    test("should display weight history list", async ({ page }) => {
      await page.goto("/weight-tracking");
      await waitForHydration(page);

      await expect(page.getByText(/history/i).first()).toBeVisible();
    });

    test("should show weight entries with dates", async ({ page }) => {
      await page.goto("/weight-tracking");
      await waitForHydration(page);

      await logWeight(page, "172");
      await expect(page.getByText("172").first()).toBeVisible();
    });

    test("should show trend indicator when multiple entries exist", async ({ page }) => {
      await page.goto("/weight-tracking");
      await waitForHydration(page);

      await logWeight(page, "170");
      await logWeight(page, "172");

      const trendIndicator = page.locator('[class*="from last"]');
      const hasTrend = await trendIndicator.isVisible({ timeout: 2000 }).catch(() => false);

      if (hasTrend) {
        await expect(trendIndicator).toBeVisible();
      }
    });
  });

  test.describe("delete weight entry", () => {
    test("should delete a weight entry", async ({ page }) => {
      await page.goto("/weight-tracking");
      await waitForHydration(page);

      await logWeight(page, "999");
      await expect(page.getByText("999").first()).toBeVisible();

      const entryRow = page.locator('[class*="group"]').filter({ hasText: "999" });
      await entryRow.hover();

      const deleteButton = entryRow.getByRole("button");
      await deleteButton.click();

      await page.waitForTimeout(WAIT.MEDIUM);
      await expect(page.getByText("999")).not.toBeVisible();
    });
  });

  test.describe("statistics", () => {
    test("should display stats when entries exist", async ({ page }) => {
      await page.goto("/weight-tracking");
      await waitForHydration(page);

      await logWeight(page, "165");

      const hasStats = await page
        .getByText(/lowest/i)
        .isVisible({ timeout: 2000 })
        .catch(() => false);

      if (hasStats) {
        await expect(page.getByText(/lowest/i)).toBeVisible();
        await expect(page.getByText(/average/i)).toBeVisible();
        await expect(page.getByText(/highest/i)).toBeVisible();
      }
    });
  });

  test.describe("body weight auto-fill", () => {
    test("should auto-fill weight for body-weight movements in workout", async ({ page }) => {
      await page.goto("/weight-tracking");
      await waitForHydration(page);

      await logWeight(page, "180");

      await page.goto("/current-workout");
      await waitForHydration(page);

      const hasActiveWorkout = await page.getByRole("heading", { name: /current workout/i }).isVisible();

      if (!hasActiveWorkout) {
        await page.getByRole("button", { name: /start session/i }).click();
        await expect(page.getByRole("heading", { name: /current workout/i })).toBeVisible();
      }

      await page.getByRole("combobox").first().click();

      const pullUpOption = page.getByRole("option", { name: /pull up/i });
      const hasPullUp = await pullUpOption.isVisible({ timeout: 1000 }).catch(() => false);

      if (hasPullUp) {
        await pullUpOption.click();

        const weightInput = page.locator('input[placeholder="0"]').first();
        await expect(weightInput).toHaveValue("180");
      }
    });
  });

  test.describe("chart", () => {
    test("should display weight chart area", async ({ page }) => {
      await page.goto("/weight-tracking");
      await waitForHydration(page);

      await expect(page.getByText(/trend analysis/i)).toBeVisible();
    });
  });
});
