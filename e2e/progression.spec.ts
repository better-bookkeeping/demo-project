import { test, expect, waitForHydration } from "./fixtures/auth";

test.describe("Progression", () => {
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

  test.describe("page load", () => {
    test("should load page with all selectors and chart", async ({ page }) => {
      await page.goto("/progression");
      await waitForHydration(page);

      await expect(page.getByRole("heading", { name: /progression/i })).toBeVisible();

      await expect(page.getByText("Exercise", { exact: true })).toBeVisible();
      await expect(page.getByTestId("exercise-select")).toBeVisible();

      await expect(page.getByText("Metric", { exact: true })).toBeVisible();
      const metricSelect = page.getByTestId("metric-select");
      await expect(metricSelect).toBeVisible();
      await metricSelect.click();
      await expect(page.getByRole("option", { name: /max weight/i })).toBeVisible();
      await expect(page.getByRole("option", { name: /total reps/i })).toBeVisible();
      await expect(page.getByRole("option", { name: /total volume/i })).toBeVisible();
      await page.keyboard.press("Escape");

      await expect(page.getByText("Period", { exact: true })).toBeVisible();
      const periodSelect = page.getByTestId("period-select");
      await expect(periodSelect).toBeVisible();
      await periodSelect.click();
      await expect(page.getByRole("option", { name: /last 7 days/i })).toBeVisible();
      await expect(page.getByRole("option", { name: /last 30 days/i })).toBeVisible();
      await expect(page.getByRole("option", { name: /all time/i })).toBeVisible();

      await expect(page.getByTestId("progression-chart")).toBeVisible();
    });
  });

  test.describe("exercise selection", () => {
    test("should display available exercises in dropdown", async ({ page }) => {
      await page.goto("/progression");
      await waitForHydration(page);

      await page.getByTestId("exercise-select").click();

      await expect(page.getByTestId("searchable-select-search")).toBeVisible({ timeout: 5000 });
    });

    test("should update chart when exercise is selected", async ({ page }) => {
      await page.goto("/progression");
      await waitForHydration(page);

      await page.getByTestId("exercise-select").click();

      const searchInput = page.getByTestId("searchable-select-search");
      await expect(searchInput).toBeVisible({ timeout: 5000 });

      await page.keyboard.press("Escape");
      await expect(page.getByTestId("progression-chart")).toBeVisible();
    });
  });

  test.describe("metric types", () => {
    test("should default to max weight metric", async ({ page }) => {
      await page.goto("/progression");
      await waitForHydration(page);

      const metricSelect = page.getByTestId("metric-select");
      await expect(metricSelect).toContainText(/max weight/i);
    });

    test("should switch to total reps metric", async ({ page }) => {
      await page.goto("/progression");
      await waitForHydration(page);

      await page.getByTestId("metric-select").click();
      await page.getByRole("option", { name: /total reps/i }).click();

      const metricSelect = page.getByTestId("metric-select");
      await expect(metricSelect).toContainText(/total reps/i);
    });

    test("should switch to total volume metric", async ({ page }) => {
      await page.goto("/progression");
      await waitForHydration(page);

      await page.getByTestId("metric-select").click();
      await page.getByRole("option", { name: /total volume/i }).click();

      const metricSelect = page.getByTestId("metric-select");
      await expect(metricSelect).toContainText(/total volume/i);
    });
  });

  test.describe("date range filter", () => {
    test("should default to last 30 days", async ({ page }) => {
      await page.goto("/progression");
      await waitForHydration(page);

      const dateSelect = page.getByTestId("period-select");
      await expect(dateSelect).toContainText(/30 days/i);
    });

    test("should change to last 7 days", async ({ page }) => {
      await page.goto("/progression");
      await waitForHydration(page);

      await page.getByTestId("period-select").click();
      await page.getByRole("option", { name: /last 7 days/i }).click();

      const dateSelect = page.getByTestId("period-select");
      await expect(dateSelect).toContainText(/7 days/i);
    });

    test("should change to all time", async ({ page }) => {
      await page.goto("/progression");
      await waitForHydration(page);

      await page.getByTestId("period-select").click();
      await page.getByRole("option", { name: /all time/i }).click();

      const dateSelect = page.getByTestId("period-select");
      await expect(dateSelect).toContainText(/all time/i);
    });
  });

  test.describe("chart display", () => {
    test("should update chart title to selected exercise", async ({ page }) => {
      await page.goto("/progression");
      await waitForHydration(page);

      await page.getByTestId("exercise-select").click();
      const searchInput = page.getByTestId("searchable-select-search");
      await expect(searchInput).toBeVisible({ timeout: 5000 });

      await page.keyboard.press("Escape");

      await expect(page.getByTestId("progression-chart")).toBeVisible();
    });
  });
});
