import { test as base, expect, type Page, type Locator } from "@playwright/test";

export const WAIT = { SHORT: 100, MEDIUM: 300, LONG: 500, PR: 700 } as const;

export const TEST_USER = {
  email: process.env.E2E_TEST_USER_EMAIL || "e2e-test@example.com",
  password: process.env.E2E_TEST_USER_PASSWORD || "testpass123",
  name: process.env.E2E_TEST_USER_NAME || "E2E Test User",
} as const;

export async function waitForHydration(page: Page): Promise<void> {
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(WAIT.SHORT * 2);
}

export async function fillWithRetry(input: Locator, value: string, maxRetries = 3): Promise<void> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    await input.fill(value);
    await input.page().waitForTimeout(50);

    const actualValue = await input.inputValue();
    if (actualValue === value) {
      return;
    }

    await input.page().waitForTimeout(150);
  }

  await input.fill(value);
}

export interface AuthHelpers {
  signIn: (email?: string, password?: string) => Promise<void>;
  signOut: () => Promise<void>;
  createAccount: (email: string, name: string, password: string) => Promise<void>;
  expectAuthenticated: () => Promise<void>;
  expectUnauthenticated: () => Promise<void>;
  ensureTestUser: () => Promise<void>;
}

async function ensureTestUser(page: Page): Promise<void> {
  await page.goto("/create-account");

  const nameInput = page.locator("#name");
  const emailInput = page.locator("#email");
  const passwordInput = page.locator("#password");
  const submitButton = page.getByRole("button", { name: /^create account$/i });

  await nameInput.waitFor({ state: "visible" });
  await submitButton.waitFor({ state: "visible" });
  await waitForHydration(page);

  await fillWithRetry(nameInput, TEST_USER.name);
  await fillWithRetry(emailInput, TEST_USER.email);
  await fillWithRetry(passwordInput, TEST_USER.password);
  await submitButton.click();

  await Promise.race([
    page.waitForURL((url) => !url.pathname.includes("create-account"), { timeout: 10000 }),
    page.getByText(/already exists/i).waitFor({ state: "visible", timeout: 10000 }),
  ]).catch(() => {
    // Timeout is acceptable - page may still be loading
  });

  const errorVisible = await page
    .getByText(/already exists/i)
    .isVisible()
    .catch(() => false);
  if (errorVisible) {
    return;
  }

  if (!page.url().includes("create-account")) {
    await page.goto("/logout");
    await page.waitForURL(/sign-in/, { timeout: 5000 }).catch(() => {});
  }
}

async function signIn(page: Page, email: string, password: string): Promise<void> {
  await page.goto("/sign-in");

  const emailInput = page.locator("#email");
  const passwordInput = page.locator("#password");
  const submitButton = page.getByRole("button", { name: /^sign in$/i });

  await emailInput.waitFor({ state: "visible" });
  await submitButton.waitFor({ state: "visible" });
  await waitForHydration(page);

  await fillWithRetry(emailInput, email);
  await fillWithRetry(passwordInput, password);

  await expect(emailInput).toHaveValue(email);
  await expect(passwordInput).toHaveValue(password);

  await submitButton.click();

  // Wait for URL change (success) first
  await page.waitForURL((url) => !url.pathname.includes("sign-in"), { timeout: 10000 });

  // Then check if an error appeared (race condition check)
  const errorLocator = page.getByText(/invalid email or password/i);
  const errorVisible = await errorLocator.isVisible().catch(() => false);
  if (errorVisible) {
    throw new Error(`Sign-in failed: Invalid email or password for ${email}`);
  }
}

async function signOut(page: Page): Promise<void> {
  await page.goto("/logout");
  await page.waitForURL("/sign-in");
}

async function createAccount(page: Page, email: string, name: string, password: string): Promise<void> {
  await page.goto("/create-account");

  const nameInput = page.locator("#name");
  const emailInput = page.locator("#email");
  const passwordInput = page.locator("#password");
  const submitButton = page.getByRole("button", { name: /^create account$/i });

  await nameInput.waitFor({ state: "visible" });
  await submitButton.waitFor({ state: "visible" });
  await waitForHydration(page);

  await fillWithRetry(nameInput, name);
  await fillWithRetry(emailInput, email);
  await fillWithRetry(passwordInput, password);
  await submitButton.click();

  await expect(page).not.toHaveURL(/create-account/, { timeout: 10000 });
}

async function expectAuthenticated(page: Page): Promise<void> {
  const url = page.url();
  expect(url).not.toContain("/sign-in");
  expect(url).not.toContain("/create-account");
}

async function expectUnauthenticated(page: Page): Promise<void> {
  await expect(page).toHaveURL(/\/(sign-in|create-account)/);
}

export const test = base.extend<{ auth: AuthHelpers }>({
  auth: async ({ page }, use) => {
    const helpers: AuthHelpers = {
      signIn: (email = TEST_USER.email, password = TEST_USER.password) => signIn(page, email, password),
      signOut: () => signOut(page),
      createAccount: (email: string, name: string, password: string) => createAccount(page, email, name, password),
      expectAuthenticated: () => expectAuthenticated(page),
      expectUnauthenticated: () => expectUnauthenticated(page),
      ensureTestUser: () => ensureTestUser(page),
    };

    await use(helpers);
  },
});

export { expect };
