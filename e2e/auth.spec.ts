import { test, expect } from "@playwright/test";
import { createTestUserCredentials, createTestUser } from "./helpers/auth";
import { cleanupTestUser, clearLoginAttempts, disconnectDb } from "./helpers/db";

async function logout(page: import("@playwright/test").Page) {
  await page.goto("/logout");
  await page.waitForURL("/sign-in");
  await page.waitForLoadState("networkidle");
}

test.describe("Authentication", () => {
  test.describe("sign-up", () => {
    test("should create account with valid credentials", async ({ page }) => {
      const user = createTestUserCredentials();

      await page.goto("/create-account");
      await page.waitForLoadState("networkidle");

      await page.getByLabel("Name").fill(user.name);
      await page.getByLabel("Email").fill(user.email);
      await page.getByLabel("Password").fill(user.password);
      await page.getByRole("button", { name: "Create account" }).click();

      // Should redirect to home which then redirects to current-workout
      await page.waitForURL(/\/(current-workout)?$/);

      await cleanupTestUser(user.email);
    });

    test("should reject duplicate email", async ({ page }) => {
      const user = createTestUserCredentials();

      // Create first account
      await createTestUser(page, user);

      // Log out properly
      await logout(page);

      // Try to create another account with same email
      await page.goto("/create-account");
      await page.waitForLoadState("networkidle");

      await page.getByLabel("Name").fill("Different Name");
      await page.getByLabel("Email").fill(user.email);
      await page.getByLabel("Password").fill("differentpassword");
      await page.getByRole("button", { name: "Create account" }).click();

      await expect(page.getByText(/unable to create account/i)).toBeVisible();

      await cleanupTestUser(user.email);
    });

    test("should reject weak password (< 6 chars)", async ({ page }) => {
      const user = createTestUserCredentials();

      await page.goto("/create-account");
      await page.waitForLoadState("networkidle");

      await page.getByLabel("Name").fill(user.name);
      await page.getByLabel("Email").fill(user.email);
      await page.getByLabel("Password").fill("12345"); // Only 5 chars
      await page.getByRole("button", { name: "Create account" }).click();

      // Should not navigate away - stay on create-account page
      await expect(page).toHaveURL(/create-account/);
    });
  });

  test.describe("sign-in", () => {
    test("should sign in with correct credentials", async ({ page }) => {
      const user = createTestUserCredentials();

      // Create account first
      await createTestUser(page, user);

      // Log out properly
      await logout(page);

      // Sign in
      await page.getByLabel("Email").fill(user.email);
      await page.getByLabel("Password").fill(user.password);
      await page.getByRole("button", { name: "Sign in" }).click();

      // Should redirect to home which then redirects to current-workout
      await page.waitForURL(/\/(current-workout)?$/);

      await cleanupTestUser(user.email);
    });

    test("should reject incorrect password", async ({ page }) => {
      const user = createTestUserCredentials();

      // Create account first
      await createTestUser(page, user);

      // Log out properly
      await logout(page);

      // Try to sign in with wrong password
      await page.getByLabel("Email").fill(user.email);
      await page.getByLabel("Password").fill("wrongpassword");
      await page.getByRole("button", { name: "Sign in" }).click();

      await expect(page.getByText(/invalid email or password/i)).toBeVisible();

      await cleanupTestUser(user.email);
    });

    test("should reject non-existent email", async ({ page }) => {
      await clearLoginAttempts("nonexistent@example.com");

      await page.goto("/sign-in");
      await page.waitForLoadState("networkidle");

      await page.getByLabel("Email").fill("nonexistent@example.com");
      await page.getByLabel("Password").fill("somepassword");
      await page.getByRole("button", { name: "Sign in" }).click();

      await expect(page.getByText(/invalid email or password/i)).toBeVisible();
    });
  });

  test.describe("session persistence", () => {
    test("should remain logged in after page reload", async ({ page }) => {
      const user = createTestUserCredentials();

      // Create account and get logged in
      await createTestUser(page, user);

      // Should redirect to current-workout after account creation
      await page.waitForURL(/\/(current-workout)?$/);

      // Reload the page
      await page.reload();
      await page.waitForLoadState("networkidle");

      // Should still be authenticated (not redirected to sign-in)
      await expect(page).not.toHaveURL(/sign-in/);

      await cleanupTestUser(user.email);
    });
  });
});

test.afterAll(async () => {
  await disconnectDb();
});
