import { test, expect } from "./fixtures/test-fixtures";
import type { Page } from "@playwright/test";

async function createMovementAndAddSet(page: Page, movementName: string) {
  // Create a movement first
  await page.goto("/movements");
  await page.waitForLoadState("networkidle");
  await page.getByPlaceholder("Movement name").fill(movementName);
  await page.getByRole("button", { name: "Add" }).click();
  await expect(page.locator("li").filter({ hasText: movementName })).toBeVisible();

  // Go to current workout and start
  await page.goto("/current-workout");
  await page.waitForLoadState("networkidle");
  await page.getByRole("button", { name: "Start Workout" }).click();
  await expect(page.getByRole("button", { name: "Complete Workout" })).toBeVisible();

  // Add a set
  await page.getByRole("combobox").selectOption({ label: movementName });
  await page.getByPlaceholder("Weight").fill("100");
  await page.getByPlaceholder("Reps").fill("10");
  await page.getByRole("button", { name: "Add" }).click();
  // Wait for the set to appear in the list
  await expect(page.locator("li").filter({ hasText: movementName })).toBeVisible();
}

test.describe("Workouts", () => {
  test.describe("create", () => {
    test("should start a new workout from the current workout page", async ({ authenticatedPage }) => {
      await authenticatedPage.goto("/current-workout");
      await authenticatedPage.waitForLoadState("networkidle");

      await authenticatedPage.getByRole("button", { name: "Start Workout" }).click();

      await expect(authenticatedPage.getByRole("button", { name: "Complete Workout" })).toBeVisible();
    });

    test("should show the workout date after starting", async ({ authenticatedPage }) => {
      await authenticatedPage.goto("/current-workout");
      await authenticatedPage.waitForLoadState("networkidle");

      await authenticatedPage.getByRole("button", { name: "Start Workout" }).click();
      await expect(authenticatedPage.getByRole("button", { name: "Complete Workout" })).toBeVisible();

      const today = new Date();
      const expectedDatePart = today.toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      });

      await expect(authenticatedPage.getByText(expectedDatePart)).toBeVisible();
    });
  });

  test.describe("read", () => {
    test("should display the current active workout", async ({ authenticatedPage }) => {
      await authenticatedPage.goto("/current-workout");
      await authenticatedPage.waitForLoadState("networkidle");

      await authenticatedPage.getByRole("button", { name: "Start Workout" }).click();

      await expect(authenticatedPage.getByRole("button", { name: "Complete Workout" })).toBeVisible();
      await expect(authenticatedPage.getByText("No sets yet")).toBeVisible();
    });

    test("should show 'No active workout' when none exists", async ({ authenticatedPage }) => {
      await authenticatedPage.goto("/current-workout");
      await authenticatedPage.waitForLoadState("networkidle");

      await expect(authenticatedPage.getByText("No active workout")).toBeVisible();
      await expect(authenticatedPage.getByRole("button", { name: "Start Workout" })).toBeVisible();
    });

    test("should display completed workouts in workout history", async ({ authenticatedPage }) => {
      const id = Math.random().toString(36).slice(2, 6);
      await createMovementAndAddSet(authenticatedPage, `TestMove #${id}`);

      await authenticatedPage.getByRole("button", { name: "Complete Workout" }).click();
      await expect(authenticatedPage.getByText("No active workout")).toBeVisible();

      await authenticatedPage.goto("/workout-history");
      await authenticatedPage.waitForLoadState("networkidle");

      await expect(authenticatedPage.locator("tbody tr")).toHaveCount(1);
    });
  });

  test.describe("complete", () => {
    test("should disable Complete Workout button when no sets exist", async ({ authenticatedPage }) => {
      await authenticatedPage.goto("/current-workout");
      await authenticatedPage.waitForLoadState("networkidle");

      await authenticatedPage.getByRole("button", { name: "Start Workout" }).click();
      await expect(authenticatedPage.getByRole("button", { name: "Complete Workout" })).toBeVisible();

      // Button should be disabled when no sets exist
      await expect(authenticatedPage.getByRole("button", { name: "Complete Workout" })).toBeDisabled();
    });

    test("should mark the current workout as completed", async ({ authenticatedPage }) => {
      const id = Math.random().toString(36).slice(2, 6);
      await createMovementAndAddSet(authenticatedPage, `CompleteTest #${id}`);

      await authenticatedPage.getByRole("button", { name: "Complete Workout" }).click();

      await expect(authenticatedPage.getByText("No active workout")).toBeVisible();
    });

    test("should move completed workout to history", async ({ authenticatedPage }) => {
      const id = Math.random().toString(36).slice(2, 6);
      await createMovementAndAddSet(authenticatedPage, `HistoryTest #${id}`);

      await authenticatedPage.getByRole("button", { name: "Complete Workout" }).click();
      await expect(authenticatedPage.getByText("No active workout")).toBeVisible();

      await authenticatedPage.goto("/workout-history");
      await authenticatedPage.waitForLoadState("networkidle");

      const today = new Date();
      const expectedDatePart = today.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });

      await expect(authenticatedPage.getByText(expectedDatePart)).toBeVisible();
    });
  });

  test.describe("delete", () => {
    test("should delete selected workouts from history", async ({ authenticatedPage }) => {
      const id = Math.random().toString(36).slice(2, 6);
      await createMovementAndAddSet(authenticatedPage, `DeleteTest #${id}`);

      await authenticatedPage.getByRole("button", { name: "Complete Workout" }).click();
      await expect(authenticatedPage.getByText("No active workout")).toBeVisible();

      await authenticatedPage.goto("/workout-history");
      await authenticatedPage.waitForLoadState("networkidle");

      await authenticatedPage.locator("tbody tr").first().getByRole("checkbox").check();
      await authenticatedPage.getByRole("button", { name: /Delete Selected/ }).click();

      await expect(authenticatedPage.getByText("No completed workouts yet")).toBeVisible();
    });

    test("should allow selecting multiple workouts for deletion", async ({ authenticatedPage }) => {
      const id = Math.random().toString(36).slice(2, 6);
      const movementName = `MultiDelete #${id}`;

      // Create movement once
      await authenticatedPage.goto("/movements");
      await authenticatedPage.waitForLoadState("networkidle");
      await authenticatedPage.getByPlaceholder("Movement name").fill(movementName);
      await authenticatedPage.getByRole("button", { name: "Add" }).click();
      await expect(authenticatedPage.getByText(movementName)).toBeVisible();

      // First workout
      await authenticatedPage.goto("/current-workout");
      await authenticatedPage.waitForLoadState("networkidle");
      await authenticatedPage.getByRole("button", { name: "Start Workout" }).click();
      await expect(authenticatedPage.getByRole("button", { name: "Complete Workout" })).toBeVisible();
      await authenticatedPage.getByRole("combobox").selectOption({ label: movementName });
      await authenticatedPage.getByPlaceholder("Weight").fill("100");
      await authenticatedPage.getByPlaceholder("Reps").fill("10");
      await authenticatedPage.getByRole("button", { name: "Add" }).click();
      await authenticatedPage.getByRole("button", { name: "Complete Workout" }).click();
      await expect(authenticatedPage.getByText("No active workout")).toBeVisible();

      // Second workout
      await authenticatedPage.getByRole("button", { name: "Start Workout" }).click();
      await expect(authenticatedPage.getByRole("button", { name: "Complete Workout" })).toBeVisible();
      await authenticatedPage.getByRole("combobox").selectOption({ label: movementName });
      await authenticatedPage.getByPlaceholder("Weight").fill("100");
      await authenticatedPage.getByPlaceholder("Reps").fill("10");
      await authenticatedPage.getByRole("button", { name: "Add" }).click();
      await authenticatedPage.getByRole("button", { name: "Complete Workout" }).click();
      await expect(authenticatedPage.getByText("No active workout")).toBeVisible();

      await authenticatedPage.goto("/workout-history");
      await authenticatedPage.waitForLoadState("networkidle");

      await expect(authenticatedPage.locator("tbody tr")).toHaveCount(2);

      await authenticatedPage.locator("thead").getByRole("checkbox").check();
      await expect(authenticatedPage.getByRole("button", { name: /Delete Selected \(2\)/ })).toBeVisible();

      await authenticatedPage.getByRole("button", { name: /Delete Selected/ }).click();

      await expect(authenticatedPage.getByText("No completed workouts yet")).toBeVisible();
    });
  });
});
