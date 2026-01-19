import { test, expect } from "./fixtures/test-fixtures";

test.describe("Settings", () => {
  test.describe("profile", () => {
    test("should display user profile information", async ({ authenticatedPage, testUser }) => {
      await authenticatedPage.goto("/settings");
      await authenticatedPage.waitForLoadState("networkidle");

      await expect(authenticatedPage.getByLabel("Name")).toHaveValue(testUser.name);
      await expect(authenticatedPage.getByLabel("Email")).toHaveValue(testUser.email);
    });

    test("should update user name", async ({ authenticatedPage }) => {
      await authenticatedPage.goto("/settings");
      await authenticatedPage.waitForLoadState("networkidle");

      const newName = "Updated Name";
      await authenticatedPage.getByLabel("Name").fill(newName);
      await authenticatedPage.getByRole("button", { name: "Save" }).click();

      await expect(authenticatedPage.getByText("Saved")).toBeVisible();
      await authenticatedPage.reload();
      await authenticatedPage.waitForLoadState("networkidle");

      await expect(authenticatedPage.getByLabel("Name")).toHaveValue(newName);
    });

    test("should disable save button when name is unchanged", async ({ authenticatedPage, testUser }) => {
      await authenticatedPage.goto("/settings");
      await authenticatedPage.waitForLoadState("networkidle");

      await expect(authenticatedPage.getByRole("button", { name: "Save" })).toBeDisabled();

      await authenticatedPage.getByLabel("Name").fill("Different Name");
      await expect(authenticatedPage.getByRole("button", { name: "Save" })).toBeEnabled();

      await authenticatedPage.getByLabel("Name").fill(testUser.name);
      await expect(authenticatedPage.getByRole("button", { name: "Save" })).toBeDisabled();
    });

    test("should not allow editing email", async ({ authenticatedPage }) => {
      await authenticatedPage.goto("/settings");
      await authenticatedPage.waitForLoadState("networkidle");

      await expect(authenticatedPage.getByLabel("Email")).toBeDisabled();
    });
  });

  test.describe("preferences", () => {
    test("should display weight unit toggle", async ({ authenticatedPage }) => {
      await authenticatedPage.goto("/settings");
      await authenticatedPage.waitForLoadState("networkidle");

      await expect(authenticatedPage.getByRole("button", { name: "lbs" })).toBeVisible();
      await expect(authenticatedPage.getByRole("button", { name: "kg" })).toBeVisible();
    });

    test("should toggle weight unit", async ({ authenticatedPage }) => {
      await authenticatedPage.goto("/settings");
      await authenticatedPage.waitForLoadState("networkidle");

      await expect(authenticatedPage.getByRole("button", { name: "lbs" })).toHaveAttribute("data-state", "on");

      await authenticatedPage.getByRole("button", { name: "kg" }).click();
      await expect(authenticatedPage.getByRole("button", { name: "kg" })).toHaveAttribute("data-state", "on");

      await authenticatedPage.reload();
      await authenticatedPage.waitForLoadState("networkidle");
      await expect(authenticatedPage.getByRole("button", { name: "kg" })).toHaveAttribute("data-state", "on");
    });
  });

  test.describe("account", () => {
    test("should sign out user", async ({ authenticatedPage }) => {
      await authenticatedPage.goto("/settings");
      await authenticatedPage.waitForLoadState("networkidle");

      await authenticatedPage.getByRole("button", { name: "Sign out" }).click();

      await expect(authenticatedPage).toHaveURL(/\/sign-in/);
    });
  });

  test.describe("navigation", () => {
    test("should be accessible from sidebar", async ({ authenticatedPage }) => {
      await authenticatedPage.goto("/current-workout");
      await authenticatedPage.waitForLoadState("networkidle");

      await authenticatedPage.getByRole("link", { name: "Settings" }).click();
      await expect(authenticatedPage).toHaveURL(/\/settings/);
    });

    test("should be accessible by clicking user section", async ({ authenticatedPage, testUser }) => {
      await authenticatedPage.goto("/current-workout");
      await authenticatedPage.waitForLoadState("networkidle");

      await authenticatedPage.getByText(testUser.name).click();
      await expect(authenticatedPage).toHaveURL(/\/settings/);
    });
  });
});
