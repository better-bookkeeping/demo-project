import { test, expect } from "./fixtures/test-fixtures";

test.describe("Weight Tracking", () => {
  test.describe("record weight", () => {
    test("should record a weight entry", async ({ authenticatedPage }) => {
      await authenticatedPage.goto("/weight");
      await authenticatedPage.waitForLoadState("networkidle");

      await authenticatedPage.getByPlaceholder("Enter weight").fill("185.5");
      await authenticatedPage.getByRole("button", { name: "Record" }).click();

      await expect(authenticatedPage.getByText("185.5")).toBeVisible();
    });

    test("should display recorded weight in history", async ({ authenticatedPage }) => {
      await authenticatedPage.goto("/weight");
      await authenticatedPage.waitForLoadState("networkidle");

      await authenticatedPage.getByPlaceholder("Enter weight").fill("180");
      await authenticatedPage.getByRole("button", { name: "Record" }).click();

      await expect(authenticatedPage.locator("table").getByText("180")).toBeVisible();
    });

    test("should clear input after recording", async ({ authenticatedPage }) => {
      await authenticatedPage.goto("/weight");
      await authenticatedPage.waitForLoadState("networkidle");

      const input = authenticatedPage.getByPlaceholder("Enter weight");
      await input.fill("175");
      await authenticatedPage.getByRole("button", { name: "Record" }).click();

      await expect(authenticatedPage.getByText("175")).toBeVisible();
      await expect(input).toHaveValue("");
    });
  });

  test.describe("weight history", () => {
    test("should display weight entries in a table", async ({ authenticatedPage }) => {
      await authenticatedPage.goto("/weight");
      await authenticatedPage.waitForLoadState("networkidle");

      // Add multiple entries
      for (const weight of ["180", "182", "181"]) {
        await authenticatedPage.getByPlaceholder("Enter weight").fill(weight);
        await authenticatedPage.getByRole("button", { name: "Record" }).click();
        await expect(authenticatedPage.getByRole("cell", { name: weight })).toBeVisible();
      }

      // Verify table has all entries
      const table = authenticatedPage.locator("table");
      await expect(table.getByText("180")).toBeVisible();
      await expect(table.getByText("182")).toBeVisible();
      await expect(table.getByText("181")).toBeVisible();
    });

    test("should show chart visualization", async ({ authenticatedPage }) => {
      await authenticatedPage.goto("/weight");
      await authenticatedPage.waitForLoadState("networkidle");

      // Add entries for chart
      await authenticatedPage.getByPlaceholder("Enter weight").fill("180");
      await authenticatedPage.getByRole("button", { name: "Record" }).click();
      await expect(authenticatedPage.getByText("180")).toBeVisible();

      // Chart container should be visible
      await expect(authenticatedPage.getByTestId("weight-chart")).toBeVisible();
    });
  });

  test.describe("unit preference", () => {
    test("should show lbs as default unit", async ({ authenticatedPage }) => {
      await authenticatedPage.goto("/settings");
      await authenticatedPage.waitForLoadState("networkidle");

      await expect(authenticatedPage.getByRole("button", { name: "lbs" })).toHaveAttribute(
        "data-state",
        "on",
      );
    });

    test("should toggle weight unit preference", async ({ authenticatedPage }) => {
      await authenticatedPage.goto("/settings");
      await authenticatedPage.waitForLoadState("networkidle");

      // Default is lbs
      await expect(authenticatedPage.getByRole("button", { name: "lbs" })).toHaveAttribute(
        "data-state",
        "on",
      );

      // Switch to kg
      await authenticatedPage.getByRole("button", { name: "kg" }).click();

      await expect(authenticatedPage.getByRole("button", { name: "kg" })).toHaveAttribute(
        "data-state",
        "on",
      );
    });

    test("should persist unit preference after recording", async ({ authenticatedPage }) => {
      // Switch to kg in settings
      await authenticatedPage.goto("/settings");
      await authenticatedPage.waitForLoadState("networkidle");
      await authenticatedPage.getByRole("button", { name: "kg" }).click();
      await expect(authenticatedPage.getByRole("button", { name: "kg" })).toHaveAttribute(
        "data-state",
        "on",
      );

      // Go to weight page and record a weight
      await authenticatedPage.goto("/weight");
      await authenticatedPage.waitForLoadState("networkidle");
      await authenticatedPage.getByPlaceholder("Enter weight").fill("82");
      await authenticatedPage.getByRole("button", { name: "Record" }).click();

      // Verify unit is still kg in settings
      await authenticatedPage.goto("/settings");
      await authenticatedPage.waitForLoadState("networkidle");
      await expect(authenticatedPage.getByRole("button", { name: "kg" })).toHaveAttribute(
        "data-state",
        "on",
      );

      // Refresh page and verify preference persisted
      await authenticatedPage.reload();
      await authenticatedPage.waitForLoadState("networkidle");

      await expect(authenticatedPage.getByRole("button", { name: "kg" })).toHaveAttribute(
        "data-state",
        "on",
      );
    });

    test("should convert weight when switching units", async ({ authenticatedPage }) => {
      // Record weight in lbs (default)
      await authenticatedPage.goto("/weight");
      await authenticatedPage.waitForLoadState("networkidle");
      await authenticatedPage.getByPlaceholder("Enter weight").fill("220");
      await authenticatedPage.getByRole("button", { name: "Record" }).click();
      await expect(authenticatedPage.locator("table").getByText("220")).toBeVisible();

      // Switch to kg in settings
      await authenticatedPage.goto("/settings");
      await authenticatedPage.waitForLoadState("networkidle");
      await authenticatedPage.getByRole("button", { name: "kg" }).click();
      await expect(authenticatedPage.getByRole("button", { name: "kg" })).toHaveAttribute(
        "data-state",
        "on",
      );

      // Go back to weight page - 220 lbs = 99.8 kg (rounded to 1 decimal)
      await authenticatedPage.goto("/weight");
      await authenticatedPage.waitForLoadState("networkidle");
      await expect(authenticatedPage.locator("table").getByText("99.8")).toBeVisible();

      // Switch back to lbs in settings
      await authenticatedPage.goto("/settings");
      await authenticatedPage.waitForLoadState("networkidle");
      await authenticatedPage.getByRole("button", { name: "lbs" }).click();

      // Go back to weight page
      await authenticatedPage.goto("/weight");
      await authenticatedPage.waitForLoadState("networkidle");
      await expect(authenticatedPage.locator("table").getByText("220")).toBeVisible();
    });
  });

  test.describe("delete weight entry", () => {
    test("should delete a weight entry", async ({ authenticatedPage }) => {
      await authenticatedPage.goto("/weight");
      await authenticatedPage.waitForLoadState("networkidle");

      // Add a weight entry
      await authenticatedPage.getByPlaceholder("Enter weight").fill("190");
      await authenticatedPage.getByRole("button", { name: "Record" }).click();
      await expect(authenticatedPage.getByText("190")).toBeVisible();

      // Delete the entry
      await authenticatedPage.getByRole("button", { name: "Delete" }).first().click();

      // Entry should be removed
      await expect(authenticatedPage.getByText("190")).not.toBeVisible();
    });
  });
});
