import { test, expect, waitForHydration } from "./fixtures/auth";

const PASSWORD_ERROR_MESSAGE =
  "Password must be at least 8 characters and include uppercase, lowercase, a number, and a special character";

const RATE_LIMIT_ERROR_MESSAGE = "Too many requests. Try again later.";

test.describe("Security", () => {
  test.describe("Password Validation", () => {
    test("should reject password with only lowercase letters", async ({ page }) => {
      const uniqueEmail = `test-${Date.now()}@example.com`;

      await page.goto("/create-account");
      await waitForHydration(page);

      const nameInput = page.locator("#name");
      const emailInput = page.locator("#email");
      const passwordInput = page.locator("#password");
      const submitButton = page.getByRole("button", { name: /^create account$/i });

      await nameInput.clear();
      await nameInput.fill("Test User");
      await emailInput.clear();
      await emailInput.fill(uniqueEmail);
      await passwordInput.clear();
      await passwordInput.fill("alllowercase");

      await submitButton.click();

      await expect(page.getByText(PASSWORD_ERROR_MESSAGE)).toBeVisible({ timeout: 10000 });
    });

    test("should reject password without special character", async ({ page }) => {
      const uniqueEmail = `test-${Date.now()}@example.com`;

      await page.goto("/create-account");
      await waitForHydration(page);

      const nameInput = page.locator("#name");
      const emailInput = page.locator("#email");
      const passwordInput = page.locator("#password");
      const submitButton = page.getByRole("button", { name: /^create account$/i });

      await nameInput.clear();
      await nameInput.fill("Test User");
      await emailInput.clear();
      await emailInput.fill(uniqueEmail);
      await passwordInput.clear();
      await passwordInput.fill("Password123");

      await submitButton.click();

      await expect(page.getByText(PASSWORD_ERROR_MESSAGE)).toBeVisible({ timeout: 10000 });
    });

    test("should reject password without number", async ({ page }) => {
      const uniqueEmail = `test-${Date.now()}@example.com`;

      await page.goto("/create-account");
      await waitForHydration(page);

      const nameInput = page.locator("#name");
      const emailInput = page.locator("#email");
      const passwordInput = page.locator("#password");
      const submitButton = page.getByRole("button", { name: /^create account$/i });

      await nameInput.clear();
      await nameInput.fill("Test User");
      await emailInput.clear();
      await emailInput.fill(uniqueEmail);
      await passwordInput.clear();
      await passwordInput.fill("Password!");

      await submitButton.click();

      await expect(page.getByText(PASSWORD_ERROR_MESSAGE)).toBeVisible({ timeout: 10000 });
    });

    test("should accept valid password", async ({ page }) => {
      const uniqueEmail = `test-${Date.now()}@example.com`;

      await page.goto("/create-account");
      await waitForHydration(page);

      const nameInput = page.locator("#name");
      const emailInput = page.locator("#email");
      const passwordInput = page.locator("#password");
      const submitButton = page.getByRole("button", { name: /^create account$/i });

      await nameInput.clear();
      await nameInput.fill("Test User");
      await emailInput.clear();
      await emailInput.fill(uniqueEmail);
      await passwordInput.clear();
      await passwordInput.fill("Password123!");

      await submitButton.click();

      await expect(page).not.toHaveURL(/create-account/, { timeout: 10000 });

      await page.goto("/logout");
      await page.waitForURL(/sign-in/, { timeout: 5000 });
    });
  });
});
