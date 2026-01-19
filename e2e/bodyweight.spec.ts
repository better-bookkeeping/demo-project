import { movementTest as test, expect } from "./fixtures/test-fixtures";
import type { Page } from "@playwright/test";

function uniqueName(base: string) {
  const id = Math.random().toString(36).slice(2, 6);
  return `${base} #${id}`;
}

async function gotoMovements(page: Page) {
  await page.goto("/movements");
  await page.waitForLoadState("networkidle");
  await expect(page.getByRole("heading", { name: "Movements", exact: true })).toBeVisible();
}

async function gotoWeight(page: Page) {
  await page.goto("/weight");
  await page.waitForLoadState("networkidle");
  await expect(page.getByRole("heading", { name: "Weight Tracking" })).toBeVisible();
}

async function gotoCurrentWorkout(page: Page) {
  await page.goto("/current-workout");
  await page.waitForLoadState("networkidle");
  await expect(page.getByRole("heading", { name: "Current Workout" })).toBeVisible();
}

async function createMovement(page: Page, name: string, isBodyWeight = false) {
  await page.getByPlaceholder("Movement name").fill(name);
  if (isBodyWeight) {
    await page.getByLabel("Body-weight").check();
  }
  await page.getByRole("button", { name: "Add" }).click();
  await expect(page.getByText(name)).toBeVisible();
}

async function recordWeight(page: Page, weight: string) {
  await page.getByPlaceholder("Enter weight").fill(weight);
  await page.getByRole("button", { name: "Record" }).click();
  await expect(page.locator("table").getByText(weight)).toBeVisible();
}

async function startWorkout(page: Page) {
  await page.getByRole("button", { name: "Start Workout" }).click();
  await expect(page.getByRole("button", { name: "Complete Workout" })).toBeVisible();
}

async function selectMovement(page: Page, movementName: string) {
  const select = page.getByRole("combobox");
  await expect(select).toContainText(movementName);
  await select.selectOption({ label: movementName });
}

test.describe("Body-weight Movements", () => {
  test.describe("create body-weight movement", () => {
    test("should create a movement with body-weight flag", async ({ authenticatedPage }) => {
      await gotoMovements(authenticatedPage);

      const name = uniqueName("Pull-up");
      await createMovement(authenticatedPage, name, true);

      const movementItem = authenticatedPage.locator("li").filter({ hasText: name });
      await expect(movementItem.getByText("BW")).toBeVisible();
    });

    test("should create a regular movement without body-weight flag", async ({ authenticatedPage }) => {
      await gotoMovements(authenticatedPage);

      const name = uniqueName("Bench Press");
      await createMovement(authenticatedPage, name, false);

      const movementItem = authenticatedPage.locator("li").filter({ hasText: name });
      await expect(movementItem.getByText("BW")).not.toBeVisible();
    });
  });

  test.describe("edit movement", () => {
    test("should toggle body-weight flag on existing movement", async ({ authenticatedPage }) => {
      await gotoMovements(authenticatedPage);

      const name = uniqueName("Dips");
      await createMovement(authenticatedPage, name, false);

      await authenticatedPage.locator("li").filter({ hasText: name }).getByRole("button", { name: "Edit" }).click();

      const editForm = authenticatedPage.locator("li").filter({
        has: authenticatedPage.getByRole("textbox", { name: "Name" }),
      });
      await expect(editForm.getByRole("textbox", { name: "Name" })).toHaveValue(name);

      await editForm.getByRole("checkbox").check();
      await editForm.getByRole("button", { name: "Save" }).click();

      const updatedItem = authenticatedPage.locator("li").filter({ hasText: name });
      await expect(updatedItem.getByText("BW")).toBeVisible();
    });

    test("should edit movement name", async ({ authenticatedPage }) => {
      await gotoMovements(authenticatedPage);

      const originalName = uniqueName("Chin-up");
      await createMovement(authenticatedPage, originalName, false);

      await authenticatedPage.locator("li").filter({ hasText: originalName }).getByRole("button", { name: "Edit" }).click();

      const nameInput = authenticatedPage.locator(`input[aria-label="Name"][value="${originalName}"]`);
      await expect(nameInput).toBeVisible();

      const newName = uniqueName("Wide Chin-up");
      await nameInput.fill(newName);
      // Re-locate after fill since input value changed
      await authenticatedPage.locator("li").filter({ has: authenticatedPage.locator(`input[value="${newName}"]`) }).getByRole("button", { name: "Save" }).click();

      await expect(authenticatedPage.getByText(newName)).toBeVisible();
      await expect(authenticatedPage.getByText(originalName)).not.toBeVisible();
    });
  });

  test.describe("auto-fill weight", () => {
    test("should auto-fill weight when selecting body-weight movement", async ({ authenticatedPage }) => {
      await gotoWeight(authenticatedPage);
      await recordWeight(authenticatedPage, "180");

      await gotoMovements(authenticatedPage);
      const movementName = uniqueName("Pull-up");
      await createMovement(authenticatedPage, movementName, true);

      await gotoCurrentWorkout(authenticatedPage);
      await startWorkout(authenticatedPage);
      await selectMovement(authenticatedPage, movementName);

      await expect(authenticatedPage.getByPlaceholder("Weight")).toHaveValue("180");
    });

    test("should allow adding extra weight for weighted body-weight exercise", async ({ authenticatedPage }) => {
      await gotoWeight(authenticatedPage);
      await recordWeight(authenticatedPage, "175");

      await gotoMovements(authenticatedPage);
      const movementName = uniqueName("Weighted Dips");
      await createMovement(authenticatedPage, movementName, true);

      await gotoCurrentWorkout(authenticatedPage);
      await startWorkout(authenticatedPage);
      await selectMovement(authenticatedPage, movementName);

      await expect(authenticatedPage.getByPlaceholder("Weight")).toHaveValue("175");
      await authenticatedPage.getByPlaceholder("Weight").fill("200");
      await authenticatedPage.getByPlaceholder("Reps").fill("8");
      await authenticatedPage.getByRole("button", { name: "Add" }).click();

      // New format: "200 lbs · 8 reps"
      await expect(authenticatedPage.getByText("8 reps")).toBeVisible();
      await expect(authenticatedPage.getByText("200")).toBeVisible();
    });

    test("should not auto-fill weight for regular movement", async ({ authenticatedPage }) => {
      await gotoWeight(authenticatedPage);
      await recordWeight(authenticatedPage, "185");

      await gotoMovements(authenticatedPage);
      const movementName = uniqueName("Bench Press");
      await createMovement(authenticatedPage, movementName, false);

      await gotoCurrentWorkout(authenticatedPage);
      await startWorkout(authenticatedPage);
      await selectMovement(authenticatedPage, movementName);

      await expect(authenticatedPage.getByPlaceholder("Weight")).toHaveValue("");
    });
  });

  test.describe("no weight recorded", () => {
    test("should show prompt when no weight entries exist for body-weight movement", async ({ authenticatedPage }) => {
      await gotoMovements(authenticatedPage);
      const movementName = uniqueName("Muscle-up");
      await createMovement(authenticatedPage, movementName, true);

      await gotoCurrentWorkout(authenticatedPage);
      await startWorkout(authenticatedPage);
      await selectMovement(authenticatedPage, movementName);

      await expect(authenticatedPage.getByText("Record your weight")).toBeVisible();
    });
  });
});
