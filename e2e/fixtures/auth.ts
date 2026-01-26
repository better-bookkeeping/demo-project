import { test as base, expect, type Page, type Locator } from "@playwright/test";
import fs from "fs";
import path from "path";
import { E2E_ENV_FILE } from "../config";

export const WAIT = { SHORT: 100, MEDIUM: 300, LONG: 500, PR: 700 } as const;

interface WorkerEnvData {
  timestamp: number;
  password: string;
  workers: Array<{
    index: number;
    email: string;
    name: string;
  }>;
}

function getWorkerEnv(): WorkerEnvData {
  const envFilePath = path.join(process.cwd(), "e2e", E2E_ENV_FILE);

  if (!fs.existsSync(envFilePath)) {
    throw new Error(
      `E2E environment file not found at ${envFilePath}. ` +
        "Ensure global-setup.ts ran successfully before tests."
    );
  }

  const data = fs.readFileSync(envFilePath, "utf-8");
  return JSON.parse(data);
}

function getTestUserForWorker(workerIndex: number): { email: string; password: string; name: string } {
  const envData = getWorkerEnv();
  const workerCount = envData.workers.length;
  const actualIndex = workerIndex % workerCount;
  const worker = envData.workers[actualIndex];

  return {
    email: worker.email,
    password: envData.password,
    name: worker.name,
  };
}

export async function waitForHydration(page: Page): Promise<void> {
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(WAIT.SHORT);
}

export async function fillWithRetry(input: Locator, value: string, maxRetries = 3): Promise<void> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    await input.fill(value);
    await input.page().waitForTimeout(50);

    const actualValue = await input.inputValue();
    if (actualValue === value) {
      return;
    }

    await input.page().waitForTimeout(100);
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
  testUser: { email: string; password: string; name: string };
}

async function ensureTestUser(page: Page, testUser: { email: string; name: string; password: string }): Promise<void> {
  await page.goto("/create-account");

  const nameInput = page.locator("#name");
  const emailInput = page.locator("#email");
  const passwordInput = page.locator("#password");
  const submitButton = page.getByRole("button", { name: /^create account$/i });

  await nameInput.waitFor({ state: "visible" });
  await submitButton.waitFor({ state: "visible" });
  await waitForHydration(page);

  await fillWithRetry(nameInput, testUser.name);
  await fillWithRetry(emailInput, testUser.email);
  await fillWithRetry(passwordInput, testUser.password);
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

  page.on("console", msg => {
    if (msg.type() === "error") {
      console.error("Browser console error:", msg.text());
    }
  });

  await submitButton.click();

  await page.waitForTimeout(1000);

  const currentUrl = page.url();
  if (currentUrl.includes("sign-in")) {
    const errorDiv = page.locator(".text-error").or(page.locator(".bg-error\\/10")).or(page.locator("[class*=\"error\"]")).first();
    const errorExists = await errorDiv.isVisible().catch(() => false);
    if (errorExists) {
      const errorText = await errorDiv.textContent();
      throw new Error(`Sign-in failed with error: ${errorText}`);
    }

    const pageText = await page.textContent("body");
    console.error("Page text after sign-in attempt:", pageText?.substring(0, 500));
  }

  await page.waitForURL((url) => !url.pathname.includes("sign-in"), { timeout: 10000 });
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
  auth: async ({ page }, use, testInfo) => {
    const workerIndex = testInfo.parallelIndex;
    const testUser = getTestUserForWorker(workerIndex);

    const helpers: AuthHelpers = {
      signIn: (email = testUser.email, password = testUser.password) => signIn(page, email, password),
      signOut: () => signOut(page),
      createAccount: (email: string, name: string, password: string) => createAccount(page, email, name, password),
      expectAuthenticated: () => expectAuthenticated(page),
      expectUnauthenticated: () => expectUnauthenticated(page),
      ensureTestUser: () => ensureTestUser(page, testUser),
      testUser,
    };

    await use(helpers);
  },
});

export { expect };
