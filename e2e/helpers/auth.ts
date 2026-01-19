import type { Page } from "@playwright/test";
import { randomUUID } from "crypto";

export function createTestUserCredentials() {
  return {
    email: `test-${randomUUID()}@example.com`,
    name: "Test User",
    password: "testpassword123",
  };
}

export async function createTestUser(
  page: Page,
  credentials?: { email: string; name: string; password: string },
) {
  const user = credentials ?? createTestUserCredentials();

  await page.goto("/create-account");
  await page.waitForLoadState("networkidle");

  await page.getByLabel("Name").fill(user.name);
  await page.getByLabel("Email").fill(user.email);
  await page.getByLabel("Password").fill(user.password);
  await page.getByRole("button", { name: "Create account" }).click();

  await page.waitForURL("/");

  return user;
}

export async function login(
  page: Page,
  credentials: { email: string; password: string },
) {
  await page.goto("/sign-in");
  await page.waitForLoadState("networkidle");

  await page.getByLabel("Email").fill(credentials.email);
  await page.getByLabel("Password").fill(credentials.password);
  await page.getByRole("button", { name: "Sign in" }).click();

  await page.waitForURL("/");
}
