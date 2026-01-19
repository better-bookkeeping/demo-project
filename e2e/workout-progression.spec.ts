import { test, expect } from "./fixtures/test-fixtures";

// Helper to create a completed workout with sets
async function createWorkoutWithSets(
  page: import("@playwright/test").Page,
  movements: Array<{ name: string; weight: number; reps: number }>,
) {
  await page.goto("/current-workout");
  await page.waitForLoadState("networkidle");

  await page.getByRole("button", { name: "Start Workout" }).click();
  await expect(page.getByRole("button", { name: "Complete Workout" })).toBeVisible();

  for (const movement of movements) {
    // Select movement by label
    await page.locator('select').selectOption({ label: movement.name });
    await page.getByPlaceholder("Weight").fill(movement.weight.toString());
    await page.getByPlaceholder("Reps").fill(movement.reps.toString());
    await page.getByRole("button", { name: "Add" }).click();
    // Wait for form to reset (reps field clears after successful add)
    await page.getByPlaceholder("Reps").waitFor({ state: "visible" });
    await expect(page.getByPlaceholder("Reps")).toHaveValue("");
  }

  await page.getByRole("button", { name: "Complete Workout" }).click();
  await expect(page.getByText("No active workout")).toBeVisible();
}

// Helper to create a movement
async function createMovement(page: import("@playwright/test").Page, name: string) {
  await page.goto("/movements");
  await page.waitForLoadState("networkidle");

  await page.getByPlaceholder("Movement name").fill(name);
  await page.getByRole("button", { name: "Add" }).click();
  await expect(page.getByRole("listitem").filter({ hasText: name }).first()).toBeVisible();
}

test.describe("Workout Progression Charts", () => {
  test.describe("display", () => {
    test("should show progression chart when workout data exists", async ({ authenticatedPage }) => {
      // Create a movement first
      await createMovement(authenticatedPage, "Bench Press");

      // Create a completed workout with sets
      await createWorkoutWithSets(authenticatedPage, [
        { name: "Bench Press", weight: 135, reps: 10 },
      ]);

      // Navigate to workout history
      await authenticatedPage.goto("/workout-history");
      await authenticatedPage.waitForLoadState("networkidle");

      // Verify chart is displayed
      await expect(authenticatedPage.getByTestId("progression-chart")).toBeVisible();
    });

    test("should not show chart when no workout data exists", async ({ authenticatedPage }) => {
      await authenticatedPage.goto("/workout-history");
      await authenticatedPage.waitForLoadState("networkidle");

      // Verify chart is not displayed
      await expect(authenticatedPage.getByTestId("progression-chart")).not.toBeVisible();
    });
  });

  test.describe("movement filter", () => {
    test("should filter chart data by selected movement", async ({ authenticatedPage }) => {
      // Create movements
      await createMovement(authenticatedPage, "Squat");
      await createMovement(authenticatedPage, "Deadlift");

      // Create workouts with different movements
      await createWorkoutWithSets(authenticatedPage, [
        { name: "Squat", weight: 225, reps: 5 },
      ]);
      await createWorkoutWithSets(authenticatedPage, [
        { name: "Deadlift", weight: 315, reps: 3 },
      ]);

      // Navigate to workout history
      await authenticatedPage.goto("/workout-history");
      await authenticatedPage.waitForLoadState("networkidle");

      // Verify movement dropdown exists
      await expect(authenticatedPage.getByTestId("movement-select")).toBeVisible();

      // Select a specific movement
      await authenticatedPage.getByTestId("movement-select").selectOption({ label: "Squat" });
      await authenticatedPage.waitForLoadState("networkidle");

      // Chart should still be visible (data exists for this movement)
      await expect(authenticatedPage.getByTestId("progression-chart")).toBeVisible();
    });

    test("should show all movements option", async ({ authenticatedPage }) => {
      await createMovement(authenticatedPage, "Pull-ups");

      await createWorkoutWithSets(authenticatedPage, [
        { name: "Pull-ups", weight: 0, reps: 10 },
      ]);

      await authenticatedPage.goto("/workout-history");
      await authenticatedPage.waitForLoadState("networkidle");

      // Verify "All Movements" option exists by selecting it
      const select = authenticatedPage.getByTestId("movement-select");
      await expect(select).toBeVisible();
      // Default value should be "all" (All Movements)
      await expect(select).toHaveValue("all");
    });
  });

  test.describe("metric selector", () => {
    test("should allow selecting different metrics", async ({ authenticatedPage }) => {
      await createMovement(authenticatedPage, "Overhead Press");

      await createWorkoutWithSets(authenticatedPage, [
        { name: "Overhead Press", weight: 95, reps: 8 },
      ]);

      await authenticatedPage.goto("/workout-history");
      await authenticatedPage.waitForLoadState("networkidle");

      // Verify metric dropdown exists with default value
      const metricSelect = authenticatedPage.getByTestId("metric-select");
      await expect(metricSelect).toBeVisible();
      await expect(metricSelect).toHaveValue("max_weight");

      // Verify we can select different metrics
      await metricSelect.selectOption({ value: "total_reps" });
      await expect(metricSelect).toHaveValue("total_reps");

      await metricSelect.selectOption({ value: "total_volume" });
      await expect(metricSelect).toHaveValue("total_volume");
    });

    test("should update chart when metric changes", async ({ authenticatedPage }) => {
      await createMovement(authenticatedPage, "Barbell Row");

      await createWorkoutWithSets(authenticatedPage, [
        { name: "Barbell Row", weight: 135, reps: 10 },
        { name: "Barbell Row", weight: 155, reps: 8 },
      ]);

      await authenticatedPage.goto("/workout-history");
      await authenticatedPage.waitForLoadState("networkidle");

      // Change metric to Total Volume
      await authenticatedPage.getByTestId("metric-select").selectOption({ label: "Total Volume" });
      await authenticatedPage.waitForLoadState("networkidle");

      // Chart should still be visible
      await expect(authenticatedPage.getByTestId("progression-chart")).toBeVisible();
    });
  });

  test.describe("time range selector", () => {
    test("should show days selector with default value of 30 days", async ({ authenticatedPage }) => {
      await createMovement(authenticatedPage, "Lat Pulldown");

      await createWorkoutWithSets(authenticatedPage, [
        { name: "Lat Pulldown", weight: 120, reps: 12 },
      ]);

      await authenticatedPage.goto("/workout-history");
      await authenticatedPage.waitForLoadState("networkidle");

      // Verify days dropdown exists with default value
      const daysSelect = authenticatedPage.getByTestId("days-select");
      await expect(daysSelect).toBeVisible();
      await expect(daysSelect).toHaveValue("30");
    });

    test("should allow selecting different time ranges", async ({ authenticatedPage }) => {
      await createMovement(authenticatedPage, "Cable Row");

      await createWorkoutWithSets(authenticatedPage, [
        { name: "Cable Row", weight: 100, reps: 15 },
      ]);

      await authenticatedPage.goto("/workout-history");
      await authenticatedPage.waitForLoadState("networkidle");

      const daysSelect = authenticatedPage.getByTestId("days-select");

      // Select 7 days
      await daysSelect.selectOption({ value: "7" });
      await expect(daysSelect).toHaveValue("7");

      // Select 90 days
      await daysSelect.selectOption({ value: "90" });
      await expect(daysSelect).toHaveValue("90");

      // Select All time
      await daysSelect.selectOption({ value: "all" });
      await expect(daysSelect).toHaveValue("all");
    });

    test("should update chart when time range changes", async ({ authenticatedPage }) => {
      await createMovement(authenticatedPage, "Leg Press");

      await createWorkoutWithSets(authenticatedPage, [
        { name: "Leg Press", weight: 400, reps: 10 },
      ]);

      await authenticatedPage.goto("/workout-history");
      await authenticatedPage.waitForLoadState("networkidle");

      // Chart should be visible with default 30 days
      await expect(authenticatedPage.getByTestId("progression-chart")).toBeVisible();

      // Change to All time - chart should still be visible
      await authenticatedPage.getByTestId("days-select").selectOption({ value: "all" });
      await expect(authenticatedPage.getByTestId("progression-chart")).toBeVisible();
    });
  });

  test.describe("empty state", () => {
    test("should show empty state message when no workout data exists", async ({ authenticatedPage }) => {
      // Navigate to workout history without creating any workouts
      await authenticatedPage.goto("/workout-history");
      await authenticatedPage.waitForLoadState("networkidle");

      // The progression chart card should not appear at all when there are no workouts
      await expect(authenticatedPage.getByTestId("progression-chart")).not.toBeVisible();
      await expect(authenticatedPage.getByText("No completed workouts yet.")).toBeVisible();
    });
  });
});
