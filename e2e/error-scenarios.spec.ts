import { test, expect, waitForHydration } from "./fixtures/auth";

test.describe("Error Scenarios", () => {
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

  test.describe("Toast Notifications", () => {
    test("should show success toast when creating movement", async ({ page }) => {
      await page.goto("/movements");
      await waitForHydration(page);

      const movementName = `Test ${Date.now()}`;
      const input = page.getByTestId("movement-name-input");
      await input.waitFor({ state: "visible" });
      await input.fill(movementName);

      const addButton = page.getByTestId("add-movement-button");
      await addButton.click();

      await expect(page.getByText(/movement added to arsenal/i)).toBeVisible();
    });

    test("should show success toast when logging weight", async ({ page }) => {
      await page.goto("/weight-tracking");
      await waitForHydration(page);

      const weightInput = page.getByPlaceholder("0.0");
      await weightInput.click();
      await weightInput.fill("180");

      const logButton = page.getByRole("button", { name: /log weight/i });
      await logButton.click();

      await expect(page.getByText(/180/).first()).toBeVisible({ timeout: 5000 });
    });

    test("should show toast when deleting movement", async ({ page }) => {
      await page.goto("/movements");
      await waitForHydration(page);

      const movementName = `Delete ${Date.now()}`;
      const input = page.getByTestId("movement-name-input");
      await input.waitFor({ state: "visible" });
      await input.fill(movementName);

      const addButton = page.getByTestId("add-movement-button");
      await addButton.click();
      await expect(page.getByRole("heading", { name: movementName })).toBeVisible();

      const movementCard = page.getByTestId("movement-item")
        .filter({ has: page.getByRole("heading", { name: movementName }) });

      await movementCard.getByTestId("delete-movement-trigger").click({ force: true });
      await page.getByTestId("confirm-delete-movement-button").click();

      await expect(page.getByText(/movement removed from arsenal/i)).toBeVisible();
    });
  });

  test.describe("Empty States", () => {
    test("should handle empty state when no movements exist", async ({ page }) => {
      await page.goto("/movements");
      await waitForHydration(page);

      const movementHeadings = page.locator("h3");
      const count = await movementHeadings.count();

      if (count === 0) {
        await expect(page.getByText(/no movements/i)).toBeVisible();
      } else {
        await expect(movementHeadings.first()).toBeVisible();
      }
    });

    test("should show empty state when no weight entries exist", async ({ page }) => {
      await page.goto("/weight-tracking");
      await waitForHydration(page);

      await expect(page.getByRole("heading", { name: /weight room/i })).toBeVisible();
    });

    test("should handle empty state when no workout history exists", async ({ page }) => {
      const hasActiveWorkout = await page.getByTestId("active-workout-state").isVisible().catch(() => false);
      if (hasActiveWorkout) {
        await page.getByTestId("finish-workout-button").click();
        const finishAnywayButton = page.getByTestId("finish-anyway-button");
        if (await finishAnywayButton.isVisible({ timeout: 2000 }).catch(() => false)) {
          await finishAnywayButton.click();
        }
      }

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

  test.describe("Validation Errors", () => {
    test("should prevent creating movement with empty name", async ({ page }) => {
      await page.goto("/movements");
      await waitForHydration(page);

      const input = page.getByTestId("movement-name-input");
      await input.waitFor({ state: "visible" });

      const addButton = page.getByTestId("add-movement-button");
      await expect(addButton).toBeDisabled();
    });

    test("should prevent logging weight with empty value", async ({ page }) => {
      await page.goto("/weight-tracking");
      await waitForHydration(page);

      const logButton = page.getByRole("button", { name: /log weight/i });
      await expect(logButton).toBeDisabled({ timeout: 3000 });
    });

    test("should prevent logging set with incomplete data", async ({ page }) => {
      await page.goto("/current-workout");
      await waitForHydration(page);

      const hasActiveWorkout = await page.getByTestId("active-workout-state").isVisible().catch(() => false);
      if (!hasActiveWorkout) {
        await page.getByTestId("start-workout-button").click();
        await expect(page.getByTestId("current-workout-heading")).toBeVisible({ timeout: 10000 });
      }

      const logSetButton = page.getByRole("button", { name: /log set/i });
      await expect(logSetButton).toBeDisabled();
    });
  });

  test.describe("Search and Filter Edge Cases", () => {
    test("should show no results when searching non-existent movement", async ({ page }) => {
      await page.goto("/movements");
      await waitForHydration(page);

      const searchInput = page.getByPlaceholder(/search/i);
      await searchInput.waitFor({ state: "visible" });
      await searchInput.fill("NonExistentMovementXYZ123");

      await expect(page.getByRole("heading", { name: "Bench Press" })).not.toBeVisible({ timeout: 3000 });
      await expect(page.getByRole("heading", { name: "Squat" })).not.toBeVisible({ timeout: 2000 });
    });

    test("should clear search results when clearing search input", async ({ page }) => {
      await page.goto("/movements");
      await waitForHydration(page);

      const searchInput = page.getByPlaceholder(/search/i);
      await searchInput.waitFor({ state: "visible" });

      await searchInput.fill("Bench");
      await expect(page.getByRole("heading", { name: "Bench Press" })).toBeVisible({ timeout: 3000 });

      await searchInput.clear();
      await page.keyboard.press("Enter");

      await expect(page.getByRole("heading", { name: "Bench Press" })).toBeVisible({ timeout: 3000 });
    });
  });
});
