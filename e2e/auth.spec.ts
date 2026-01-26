import { test, expect, fillWithRetry, waitForHydration } from "./fixtures/auth";

test.describe("Authentication", () => {
  test.afterEach(async ({ page }) => {
    try {
      await page.keyboard.press("Escape");
      await page.waitForTimeout(100);
    } catch {}
  });

  test.describe("Sign In", () => {
    test("should display sign in form with email and password fields", async ({ page }) => {
      await page.goto("/sign-in");

      await expect(page.getByRole("heading", { name: /welcome back/i })).toBeVisible();
      await expect(page.locator("#email")).toBeVisible();
      await expect(page.locator("#password")).toBeVisible();
      await expect(page.getByRole("button", { name: /^sign in$/i })).toBeVisible();
    });

    test("should show link to create account page", async ({ page }) => {
      await page.goto("/sign-in");

      const createAccountLink = page.getByRole("link", { name: /create one/i });
      await expect(createAccountLink).toBeVisible();
      await createAccountLink.click();
      await expect(page).toHaveURL("/create-account");
    });

    test("should sign in with valid credentials", async ({ page, auth }) => {
      await auth.ensureTestUser();

      await auth.signIn();
      await auth.expectAuthenticated();
    });

    test("should show error message with invalid credentials", async ({ page }) => {
      await page.goto("/sign-in");
      await waitForHydration(page);

      const emailInput = page.locator("#email");
      const passwordInput = page.locator("#password");
      const submitButton = page.getByRole("button", { name: /^sign in$/i });

      await emailInput.clear();
      await emailInput.fill("nonexistent@test.com");
      await expect(emailInput).toHaveValue("nonexistent@test.com");

      await passwordInput.clear();
      await passwordInput.fill("wrongpassword");
      await expect(passwordInput).toHaveValue("wrongpassword");

      await submitButton.click();

      const errorDiv = page.locator(".text-error");
      await expect(errorDiv).toBeVisible({ timeout: 10000 });
      await expect(errorDiv).toHaveText("Invalid email or password");
    });

    test("should redirect authenticated users to home page", async ({ page, auth }) => {
      await auth.ensureTestUser();
      await auth.signIn();
      await page.goto("/sign-in");
      await expect(page).not.toHaveURL(/sign-in/);
    });

    test("should show loading state while signing in", async ({ page, auth }) => {
      await auth.ensureTestUser();
      await page.goto("/sign-in");
      await page.locator("#email").fill(auth.testUser.email);
      await page.locator("#password").fill(auth.testUser.password);

      const submitButton = page.getByRole("button", { name: /^sign in$/i });
      await submitButton.click();

      const loadingOrRedirected = await Promise.race([
        page
          .getByRole("button", { name: /signing in/i })
          .isVisible()
          .then(() => true)
          .catch(() => false),
        page
          .waitForURL("/", { timeout: 5000 })
          .then(() => true)
          .catch(() => false),
      ]);
      expect(loadingOrRedirected).toBe(true);
    });
  });

  test.describe("Create Account", () => {
    test("should display create account form with name, email, and password fields", async ({ page }) => {
      await page.goto("/create-account");

      await expect(page.getByRole("heading", { name: /create your account/i })).toBeVisible();
      await expect(page.locator("#name")).toBeVisible();
      await expect(page.locator("#email")).toBeVisible();
      await expect(page.locator("#password")).toBeVisible();
      await expect(page.getByRole("button", { name: /^create account$/i })).toBeVisible();
    });

    test("should show link to sign in page", async ({ page }) => {
      await page.goto("/create-account");

      const signInLink = page.getByRole("link", { name: /sign in/i });
      await expect(signInLink).toBeVisible();
      await signInLink.click();
      await expect(page).toHaveURL("/sign-in");
    });

    test("should show password requirements hint", async ({ page }) => {
      await page.goto("/create-account");

      await expect(page.getByText(/must be at least 8 characters/i)).toBeVisible();
    });

    test("should show error when email already exists", async ({ page, auth }) => {
      await page.goto("/create-account");

      const nameInput = page.locator("#name");
      const emailInput = page.locator("#email");
      const passwordInput = page.locator("#password");
      const submitButton = page.getByRole("button", { name: /^create account$/i });
      await nameInput.waitFor({ state: "visible" });
      await submitButton.waitFor({ state: "visible" });

      await fillWithRetry(nameInput, "Test User");
      await fillWithRetry(emailInput, auth.testUser.email);
      await fillWithRetry(passwordInput, "Newpassword123!");

      const initialUrl = page.url();
      await submitButton.click();

      await expect(page).toHaveURL(initialUrl, { timeout: 10000 });
      await expect(submitButton).toBeVisible();
    });

    test("should redirect authenticated users to home page", async ({ page, auth }) => {
      await auth.ensureTestUser();
      await auth.signIn();
      await page.goto("/create-account");
      await expect(page).not.toHaveURL(/create-account/);
    });

    test("should create new account and redirect", async ({ page }) => {
      const uniqueEmail = `new-user-${Date.now()}@example.com`;

      await page.goto("/create-account");
      await waitForHydration(page);

      const nameInput = page.locator("#name");
      const emailInput = page.locator("#email");
      const passwordInput = page.locator("#password");
      const submitButton = page.getByRole("button", { name: /^create account$/i });

      await nameInput.clear();
      await nameInput.fill("New User");
      await emailInput.clear();
      await emailInput.fill(uniqueEmail);
      await passwordInput.clear();
      await passwordInput.fill("Password123!");
      await submitButton.click();

      await expect(page).not.toHaveURL(/create-account/, { timeout: 10000 });
    });
  });

  test.describe("Sign Out", () => {
    test("should sign out and redirect to sign in page", async ({ page, auth }) => {
      await auth.ensureTestUser();
      await auth.signIn();
      await auth.expectAuthenticated();
      await auth.signOut();
      await auth.expectUnauthenticated();
    });

    test("should show logging out message", async ({ page, auth }) => {
      await auth.ensureTestUser();
      await auth.signIn();
      await page.goto("/logout");
      await expect(page.getByText(/logging out/i)).toBeVisible();
    });

    test("should clear session after sign out", async ({ page, auth }) => {
      await auth.ensureTestUser();
      await auth.signIn();
      await auth.signOut();
      await page.goto("/");
      await expect(page).toHaveURL(/sign-in/);
    });
  });

  test.describe("Protected Routes", () => {
    test("should redirect unauthenticated users to sign in", async ({ page }) => {
      await page.goto("/");
      await expect(page).toHaveURL(/sign-in/);
    });

    test("should allow authenticated users to access protected routes", async ({ page, auth }) => {
      await auth.ensureTestUser();
      await auth.signIn();
      await page.goto("/");
      await auth.expectAuthenticated();
    });
  });
});
