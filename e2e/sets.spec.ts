import { movementTest as test, expect } from "./fixtures/test-fixtures";
import type { Page } from "@playwright/test";

async function setupWorkoutWithMovement(page: Page, baseMovementName: string) {
  const id = Math.random().toString(36).slice(2, 6);
  const movementName = `${baseMovementName} #${id}`;

  await page.goto("/movements");
  await page.waitForLoadState("networkidle");
  await page.getByPlaceholder("Movement name").fill(movementName);
  await page.getByRole("button", { name: "Add" }).click();
  await expect(page.getByText(movementName)).toBeVisible();

  await page.goto("/current-workout");
  await page.waitForLoadState("networkidle");
  await page.getByRole("button", { name: "Start Workout" }).click();
  await expect(page.getByRole("button", { name: "Complete Workout" })).toBeVisible();

  return movementName;
}

test.describe("Sets", () => {
  test.describe("create", () => {
    test("should add a set to the current workout", async ({ authenticatedPage }) => {
      const movementName = await setupWorkoutWithMovement(authenticatedPage, "Bench");

      await authenticatedPage.locator("select").selectOption({ label: movementName });
      await authenticatedPage.getByPlaceholder("Weight").fill("135");
      await authenticatedPage.getByPlaceholder("Reps").fill("10");
      await authenticatedPage.getByRole("button", { name: "Add" }).click();

      const setItem = authenticatedPage.getByRole("listitem").filter({ hasText: movementName });
      await expect(setItem).toBeVisible();
      // New format: "135 lbs · 10 reps"
      await expect(setItem.getByText("135")).toBeVisible();
      await expect(setItem.getByText("10 reps")).toBeVisible();
    });

    test("should require movement, weight, and reps to add a set", async ({ authenticatedPage }) => {
      const movementName = await setupWorkoutWithMovement(authenticatedPage, "Squat");

      const addButton = authenticatedPage.getByRole("button", { name: "Add" });
      await expect(addButton).toBeDisabled();

      await authenticatedPage.locator("select").selectOption({ label: movementName });
      await expect(addButton).toBeDisabled();

      await authenticatedPage.getByPlaceholder("Weight").fill("225");
      await expect(addButton).toBeDisabled();

      await authenticatedPage.getByPlaceholder("Reps").fill("5");
      await expect(addButton).toBeEnabled();
    });

    test("should display the new set in the workout", async ({ authenticatedPage }) => {
      const movementName = await setupWorkoutWithMovement(authenticatedPage, "Deadlift");

      await authenticatedPage.locator("select").selectOption({ label: movementName });
      await authenticatedPage.getByPlaceholder("Weight").fill("315");
      await authenticatedPage.getByPlaceholder("Reps").fill("3");
      await authenticatedPage.getByRole("button", { name: "Add" }).click();

      const setItem = authenticatedPage.locator("li").filter({ hasText: movementName });
      await expect(setItem).toBeVisible();
      // New format: "315 lbs · 3 reps"
      await expect(setItem.getByText("315")).toBeVisible();
      await expect(setItem.getByText("3 reps")).toBeVisible();
    });
  });

  test.describe("read", () => {
    test("should display sets with movement name, weight, and reps", async ({ authenticatedPage }) => {
      const movementName = await setupWorkoutWithMovement(authenticatedPage, "OHP");

      await authenticatedPage.locator("select").selectOption({ label: movementName });
      await authenticatedPage.getByPlaceholder("Weight").fill("95");
      await authenticatedPage.getByPlaceholder("Reps").fill("8");
      await authenticatedPage.getByRole("button", { name: "Add" }).click();

      const setItem = authenticatedPage.getByRole("listitem").filter({ hasText: movementName });
      await expect(setItem).toBeVisible();
      await expect(setItem.getByText("8 reps")).toBeVisible();
      await expect(setItem.getByText("95 lbs")).toBeVisible();
    });

    test("should show sets in the order they were added", async ({ authenticatedPage }) => {
      const id = Math.random().toString(36).slice(2, 6);
      const movementA = `Chest Press #${id}`;
      const movementB = `Leg Curl #${id}`;

      await authenticatedPage.goto("/movements");
      await authenticatedPage.waitForLoadState("networkidle");

      await authenticatedPage.getByPlaceholder("Movement name").fill(movementA);
      await authenticatedPage.getByRole("button", { name: "Add" }).click();
      await expect(authenticatedPage.getByText(movementA)).toBeVisible();

      await authenticatedPage.getByPlaceholder("Movement name").fill(movementB);
      await authenticatedPage.getByRole("button", { name: "Add" }).click();
      await expect(authenticatedPage.getByText(movementB)).toBeVisible();

      await authenticatedPage.goto("/current-workout");
      await authenticatedPage.waitForLoadState("networkidle");
      await authenticatedPage.getByRole("button", { name: "Start Workout" }).click();
      await expect(authenticatedPage.getByRole("button", { name: "Complete Workout" })).toBeVisible();

      const sets = [
        { movement: movementA, weight: "100", reps: "10" },
        { movement: movementB, weight: "50", reps: "15" },
        { movement: movementA, weight: "110", reps: "8" },
      ];

      for (const set of sets) {
        await authenticatedPage.locator("select").selectOption({ label: set.movement });
        await authenticatedPage.getByPlaceholder("Weight").fill(set.weight);
        await authenticatedPage.getByPlaceholder("Reps").fill(set.reps);
        await authenticatedPage.getByRole("button", { name: "Add" }).click();
        // New format: "weight unit · reps reps"
        await expect(authenticatedPage.getByText(`${set.reps} reps`)).toBeVisible();
      }

      const setItems = authenticatedPage.locator("ul li");
      const texts = await setItems.allTextContents();

      expect(texts[0]).toContain(movementA);
      expect(texts[0]).toContain("100 lbs");
      expect(texts[1]).toContain(movementB);
      expect(texts[2]).toContain(movementA);
      expect(texts[2]).toContain("110 lbs");
    });
  });

  test.describe("delete", () => {
    test("should remove a set from the current workout", async ({ authenticatedPage }) => {
      const movementName = await setupWorkoutWithMovement(authenticatedPage, "Pullup");

      await authenticatedPage.locator("select").selectOption({ label: movementName });
      await authenticatedPage.getByPlaceholder("Weight").fill("0");
      await authenticatedPage.getByPlaceholder("Reps").fill("12");
      await authenticatedPage.getByRole("button", { name: "Add" }).click();
      await expect(authenticatedPage.getByText("12 reps")).toBeVisible();

      const setItem = authenticatedPage.locator("li").filter({ hasText: movementName });
      await setItem.getByRole("button").click();

      await expect(setItem).not.toBeVisible();
      await expect(authenticatedPage.getByText("No sets yet")).toBeVisible();
    });

    test("should update the sets list after deletion", async ({ authenticatedPage }) => {
      const movementName = await setupWorkoutWithMovement(authenticatedPage, "Row");

      await authenticatedPage.locator("select").selectOption({ label: movementName });
      await authenticatedPage.getByPlaceholder("Weight").fill("135");
      await authenticatedPage.getByPlaceholder("Reps").fill("10");
      await authenticatedPage.getByRole("button", { name: "Add" }).click();
      await expect(authenticatedPage.getByText("10 reps")).toBeVisible();

      await authenticatedPage.getByPlaceholder("Weight").fill("155");
      await authenticatedPage.getByPlaceholder("Reps").fill("8");
      await authenticatedPage.getByRole("button", { name: "Add" }).click();
      await expect(authenticatedPage.getByText("8 reps")).toBeVisible();

      const setItems = authenticatedPage.locator("ul li");
      await expect(setItems).toHaveCount(2);

      await setItems.first().getByRole("button").click();

      await expect(setItems).toHaveCount(1);
      await expect(authenticatedPage.getByText("8 reps")).toBeVisible();
      await expect(authenticatedPage.getByText("155")).toBeVisible();
    });
  });
});
