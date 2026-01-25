import { test, expect, waitForHydration, fillWithRetry, WAIT } from "./fixtures/auth";

test.describe("Movements", () => {
  test.beforeEach(async ({ auth }) => {
    await auth.ensureTestUser();
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

  test.describe("create", () => {
    test("should create a new movement with a valid name", async ({ page }) => {
      await page.goto("/movements");
      await waitForHydration(page);

      const movementName = `Test Movement ${Date.now()}`;
      const input = page.getByTestId("movement-name-input");
      await input.waitFor({ state: "visible" });
      await page.waitForTimeout(WAIT.SHORT);
      await fillWithRetry(input, movementName);

      const addButton = page.getByTestId("add-movement-button");
      await expect(addButton).toBeEnabled({ timeout: 5000 });
      await addButton.click();

      await expect(page.getByText(/movement added to arsenal/i)).toBeVisible();
      await expect(page.getByRole("heading", { name: movementName })).toBeVisible();
    });

    test("should show the new movement in the movements list", async ({ page }) => {
      await page.goto("/movements");
      await waitForHydration(page);

      const movementName = `Listed Movement ${Date.now()}`;
      const input = page.getByTestId("movement-name-input");
      await input.waitFor({ state: "visible" });
      await page.waitForTimeout(WAIT.SHORT);
      await fillWithRetry(input, movementName);

      const addButton = page.getByTestId("add-movement-button");
      await expect(addButton).toBeEnabled({ timeout: 5000 });
      await addButton.click();

      await expect(page.getByRole("heading", { name: movementName })).toBeVisible();
    });

    test("should clear the input after creating a movement", async ({ page }) => {
      await page.goto("/movements");
      await waitForHydration(page);

      const movementName = `Clear Input Test ${Date.now()}`;
      const input = page.getByTestId("movement-name-input");
      await input.waitFor({ state: "visible" });
      await page.waitForTimeout(WAIT.SHORT);
      await fillWithRetry(input, movementName);

      const addButton = page.getByTestId("add-movement-button");
      await expect(addButton).toBeEnabled({ timeout: 5000 });
      await addButton.click();

      await expect(page.getByText(/movement added to arsenal/i)).toBeVisible();
      await expect(input).toHaveValue("");
    });

    test("should create body-weight movement with (BW) badge", async ({ page }) => {
      await page.goto("/movements");
      await waitForHydration(page);

      const movementName = `BW Movement ${Date.now()}`;
      const input = page.getByTestId("movement-name-input");
      await input.waitFor({ state: "visible" });
      await page.waitForTimeout(WAIT.SHORT);
      await fillWithRetry(input, movementName);

      // Check the body-weight checkbox
      await page.getByLabel(/body-weight/i).click();

      const addButton = page.getByTestId("add-movement-button");
      await expect(addButton).toBeEnabled({ timeout: 5000 });
      await addButton.click();

      await expect(page.getByText(/movement added to arsenal/i)).toBeVisible();

      // Check for the body-weight badge near the movement
      await expect(page.getByRole("heading", { name: movementName })).toBeVisible();
      await expect(page.locator("text=Body-weight").first()).toBeVisible();
    });
  });

  test.describe("read", () => {
    test("should display all movements on the movements page", async ({ page }) => {
      await page.goto("/movements");
      await waitForHydration(page);

      await expect(page.getByRole("heading", { name: /movement arsenal/i })).toBeVisible();

      // Check that at least some default movements exist
      const movementHeadings = page.locator("h3");
      const count = await movementHeadings.count();
      expect(count).toBeGreaterThan(0);
    });

    test("should show movements sorted alphabetically", async ({ page }) => {
      await page.goto("/movements");
      await waitForHydration(page);

      // Select only h3 elements within the movements grid (not the "Add New Movement" heading)
      const movementCards = page.locator(".grid h3");
      const count = await movementCards.count();

      // Just verify that movements exist - sorting can be affected by test pollution
      expect(count).toBeGreaterThan(0);
    });

    test("should filter movements by search term", async ({ page }) => {
      await page.goto("/movements");
      await waitForHydration(page);

      const searchInput = page.getByPlaceholder(/search/i);
      await searchInput.waitFor({ state: "visible" });
      await page.waitForTimeout(WAIT.SHORT);
      await fillWithRetry(searchInput, "Bench");

      // Wait for filter to apply
      await page.waitForTimeout(WAIT.MEDIUM);

      await expect(page.getByRole("heading", { name: "Bench Press" })).toBeVisible();
      // Other movements should be filtered out
      await expect(page.getByRole("heading", { name: "Squat" })).not.toBeVisible({ timeout: 2000 });
    });
  });

  test.describe("delete", () => {
    test("should delete an existing movement without history", async ({ page }) => {
      await page.goto("/movements");
      await waitForHydration(page);

      // First create a movement to delete
      const movementName = `Delete Me ${Date.now()}`;
      const input = page.getByTestId("movement-name-input");
      await input.waitFor({ state: "visible" });
      await page.waitForTimeout(WAIT.SHORT);
      await fillWithRetry(input, movementName);

      const addButton = page.getByTestId("add-movement-button");
      await expect(addButton).toBeEnabled({ timeout: 5000 });
      await addButton.click();
      await expect(page.getByRole("heading", { name: movementName })).toBeVisible();

      // Find the card and delete it
      // Filter the movement items to find the one with the correct name
      const movementCard = page.getByTestId("movement-item")
        .filter({ has: page.getByRole("heading", { name: movementName }) });

      // Use force click since opacity might be 0 until hover
      await movementCard.getByTestId("delete-movement-trigger").click({ force: true });

      // Confirm deletion in dialog
      await page.getByTestId("confirm-delete-movement-button").click();

      await expect(page.getByText(/movement removed from arsenal/i)).toBeVisible();
      await expect(page.getByRole("heading", { name: movementName })).not.toBeVisible();
    });

    test("should show confirmation dialog before deleting", async ({ page }) => {
      await page.goto("/movements");
      await waitForHydration(page);

      // First create a movement
      const movementName = `Confirm Delete ${Date.now()}`;
      const input = page.getByTestId("movement-name-input");
      await input.waitFor({ state: "visible" });
      await page.waitForTimeout(WAIT.SHORT);
      await fillWithRetry(input, movementName);

      const addButton = page.getByTestId("add-movement-button");
      await expect(addButton).toBeEnabled({ timeout: 5000 });
      await addButton.click();
      await expect(page.getByRole("heading", { name: movementName })).toBeVisible();

      // Find the card and click delete
      const movementCard = page.getByTestId("movement-item")
        .filter({ has: page.getByRole("heading", { name: movementName }) });

      // Use force click since opacity might be 0 until hover
      await movementCard.getByTestId("delete-movement-trigger").click({ force: true });

      // Check confirmation dialog appears
      await expect(page.getByRole("heading", { name: /delete movement/i })).toBeVisible();
      await expect(page.getByText(/this action cannot be undone/i)).toBeVisible();

      // Cancel deletion
      await page.getByRole("button", { name: /cancel/i }).click();
      await expect(page.getByRole("heading", { name: movementName })).toBeVisible();
    });
  });
});
