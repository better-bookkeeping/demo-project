import { movementTest as test, expect } from "./fixtures/test-fixtures";

function uniqueName(base: string) {
  const id = Math.random().toString(36).slice(2, 6);
  return `${base} #${id}`;
}

test.describe("Movements", () => {
  test.describe("create", () => {
    test("should create a new movement with a valid name", async ({ authenticatedPage }) => {
      await authenticatedPage.goto("/movements");
      await authenticatedPage.waitForLoadState("networkidle");

      const name = uniqueName("Bench Press");
      await authenticatedPage.getByPlaceholder("Movement name").fill(name);
      await authenticatedPage.getByRole("button", { name: "Add" }).click();

      await expect(authenticatedPage.getByText(name)).toBeVisible();
    });

    test("should show the new movement in the movements list", async ({ authenticatedPage }) => {
      await authenticatedPage.goto("/movements");
      await authenticatedPage.waitForLoadState("networkidle");

      const name = uniqueName("Deadlift");
      await authenticatedPage.getByPlaceholder("Movement name").fill(name);
      await authenticatedPage.getByRole("button", { name: "Add" }).click();

      await expect(authenticatedPage.locator("ul li").filter({ hasText: name })).toBeVisible();
    });

    test("should clear the input after creating a movement", async ({ authenticatedPage }) => {
      await authenticatedPage.goto("/movements");
      await authenticatedPage.waitForLoadState("networkidle");

      const input = authenticatedPage.getByPlaceholder("Movement name");
      const name = uniqueName("Squat");
      await input.fill(name);
      await authenticatedPage.getByRole("button", { name: "Add" }).click();

      await expect(authenticatedPage.getByText(name)).toBeVisible();
      await expect(input).toHaveValue("");
    });
  });

  test.describe("read", () => {
    test("should display all movements on the movements page", async ({ authenticatedPage }) => {
      await authenticatedPage.goto("/movements");
      await authenticatedPage.waitForLoadState("networkidle");

      const movements = [uniqueName("Pull-up"), uniqueName("Push-up"), uniqueName("Lunge")];
      for (const name of movements) {
        await authenticatedPage.getByPlaceholder("Movement name").fill(name);
        await authenticatedPage.getByRole("button", { name: "Add" }).click();
        await expect(authenticatedPage.getByText(name)).toBeVisible();
      }

      for (const name of movements) {
        await expect(authenticatedPage.getByText(name)).toBeVisible();
      }
    });

    test("should show movements sorted alphabetically", async ({ authenticatedPage }) => {
      await authenticatedPage.goto("/movements");
      await authenticatedPage.waitForLoadState("networkidle");

      const id = Math.random().toString(36).slice(2, 6);
      const movements = [`Alpha #${id}`, `Beta #${id}`, `Charlie #${id}`];

      for (const name of movements) {
        await authenticatedPage.getByPlaceholder("Movement name").fill(name);
        await authenticatedPage.getByRole("button", { name: "Add" }).click();
        await expect(authenticatedPage.getByText(name)).toBeVisible();
      }

      const listItems = authenticatedPage.locator("ul li");
      const texts = await listItems.allTextContents();
      const ourMovements = texts.filter((t) => t.includes(id));
      expect(ourMovements).toEqual([...ourMovements].sort((a, b) => a.localeCompare(b)));
    });
  });

  test.describe("delete", () => {
    test("should delete an existing movement", async ({ authenticatedPage }) => {
      await authenticatedPage.goto("/movements");
      await authenticatedPage.waitForLoadState("networkidle");

      // Create a movement to delete
      const name = uniqueName("ToDelete");
      await authenticatedPage.getByPlaceholder("Movement name").fill(name);
      await authenticatedPage.getByRole("button", { name: "Add" }).click();
      await expect(authenticatedPage.getByText(name)).toBeVisible();

      // Delete the movement
      const listItem = authenticatedPage.locator("li").filter({ hasText: name });
      await listItem.getByRole("button", { name: "Delete" }).click();

      // Verify it's removed
      await expect(authenticatedPage.getByText(name)).not.toBeVisible();
    });

    test("should not affect other movements when deleting", async ({ authenticatedPage }) => {
      await authenticatedPage.goto("/movements");
      await authenticatedPage.waitForLoadState("networkidle");

      // Create two movements
      const keepName = uniqueName("KeepThis");
      const deleteName = uniqueName("DeleteThis");

      await authenticatedPage.getByPlaceholder("Movement name").fill(keepName);
      await authenticatedPage.getByRole("button", { name: "Add" }).click();
      await expect(authenticatedPage.getByText(keepName)).toBeVisible();

      await authenticatedPage.getByPlaceholder("Movement name").fill(deleteName);
      await authenticatedPage.getByRole("button", { name: "Add" }).click();
      await expect(authenticatedPage.getByText(deleteName)).toBeVisible();

      // Delete one movement
      const listItem = authenticatedPage.locator("li").filter({ hasText: deleteName });
      await listItem.getByRole("button", { name: "Delete" }).click();

      // Verify correct one is deleted, other remains
      await expect(authenticatedPage.getByText(deleteName)).not.toBeVisible();
      await expect(authenticatedPage.getByText(keepName)).toBeVisible();
    });
  });
});
