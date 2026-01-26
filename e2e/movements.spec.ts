import { test, expect, waitForHydration, fillWithRetry } from "./fixtures/auth";

test.describe("Movements", () => {
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

  test.describe("create", () => {
    test("should create a movement, add to list, and clear input", async ({ page }) => {
      await page.goto("/movements");
      await waitForHydration(page);

      const movementName = `Test Movement ${Date.now()}`;
      const input = page.getByTestId("movement-name-input");
      await input.waitFor({ state: "visible" });
      await fillWithRetry(input, movementName);

      const addButton = page.getByTestId("add-movement-button");
      await expect(addButton).toBeEnabled({ timeout: 5000 });
      await addButton.click();

      await expect(page.getByText(/movement added to arsenal/i)).toBeVisible();
      await expect(page.getByRole("heading", { name: movementName })).toBeVisible();
      await expect(input).toHaveValue("");
    });

    test("should create body-weight movement with (BW) badge", async ({ page }) => {
      await page.goto("/movements");
      await waitForHydration(page);

      const movementName = `BW Movement ${Date.now()}`;
      const input = page.getByTestId("movement-name-input");
      await input.waitFor({ state: "visible" });
      await fillWithRetry(input, movementName);

      await page.getByLabel(/body-weight/i).click();

      const addButton = page.getByTestId("add-movement-button");
      await expect(addButton).toBeEnabled({ timeout: 5000 });
      await addButton.click();

      await expect(page.getByText(/movement added to arsenal/i)).toBeVisible();

      await expect(page.getByRole("heading", { name: movementName })).toBeVisible();
      await expect(page.locator("text=Body-weight").first()).toBeVisible();
    });
  });

  test.describe("read", () => {
    test("should display all movements on the movements page", async ({ page }) => {
      await page.goto("/movements");
      await waitForHydration(page);

      await expect(page.getByRole("heading", { name: /movement arsenal/i })).toBeVisible();

      const movementHeadings = page.locator("h3");
      const count = await movementHeadings.count();
      expect(count).toBeGreaterThan(0);
    });

    test("should show movements sorted alphabetically", async ({ page }) => {
      await page.goto("/movements");
      await waitForHydration(page);

      const movementCards = page.locator(".grid h3");
      const count = await movementCards.count();
      expect(count).toBeGreaterThan(0);

      const movementNames: string[] = [];
      for (let i = 0; i < count; i++) {
        const name = await movementCards.nth(i).textContent();
        if (name) movementNames.push(name.trim());
      }

      const sortedNames = [...movementNames].sort((a, b) => a.localeCompare(b));
      expect(movementNames).toEqual(sortedNames);
    });

    test("should filter movements by search term", async ({ page }) => {
      await page.goto("/movements");
      await waitForHydration(page);

      const searchInput = page.getByPlaceholder(/search/i);
      await searchInput.waitFor({ state: "visible" });
      await fillWithRetry(searchInput, "Bench");

      await expect(page.getByRole("heading", { name: "Bench Press" }).first()).toBeVisible({ timeout: 3000 });
      await expect(page.getByRole("heading", { name: "Squat" })).not.toBeVisible({ timeout: 2000 });
    });
  });

  test.describe("delete", () => {
    test("should delete an existing movement without history", async ({ page }) => {
      await page.goto("/movements");
      await waitForHydration(page);

      const movementName = `Delete Me ${Date.now()}`;
      const input = page.getByTestId("movement-name-input");
      await input.waitFor({ state: "visible" });
      await fillWithRetry(input, movementName);

      const addButton = page.getByTestId("add-movement-button");
      await expect(addButton).toBeEnabled({ timeout: 5000 });
      await addButton.click();
      await expect(page.getByRole("heading", { name: movementName })).toBeVisible();

      const movementCard = page.getByTestId("movement-item")
        .filter({ has: page.getByRole("heading", { name: movementName }) });

      await movementCard.getByTestId("delete-movement-trigger").click({ force: true });

      await page.getByTestId("confirm-delete-movement-button").click();

      await expect(page.getByText(/movement removed from arsenal/i)).toBeVisible();
      await expect(page.getByRole("heading", { name: movementName })).not.toBeVisible();
    });

    test("should show confirmation dialog before deleting", async ({ page }) => {
      await page.goto("/movements");
      await waitForHydration(page);

      const movementName = `Confirm Delete ${Date.now()}`;
      const input = page.getByTestId("movement-name-input");
      await input.waitFor({ state: "visible" });
      await fillWithRetry(input, movementName);

      const addButton = page.getByTestId("add-movement-button");
      await expect(addButton).toBeEnabled({ timeout: 5000 });
      await addButton.click();
      await expect(page.getByRole("heading", { name: movementName })).toBeVisible();

      const movementCard = page.getByTestId("movement-item")
        .filter({ has: page.getByRole("heading", { name: movementName }) });

      await movementCard.getByTestId("delete-movement-trigger").click({ force: true });

      await expect(page.getByRole("heading", { name: /delete movement/i })).toBeVisible();
      await expect(page.getByText(/this action cannot be undone/i)).toBeVisible();

      await page.getByRole("button", { name: /cancel/i }).click();
      await expect(page.getByRole("heading", { name: movementName })).toBeVisible();
    });
  });
});
