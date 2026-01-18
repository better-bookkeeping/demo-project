import { test as base, type Page } from "@playwright/test";
import { createTestUser, createTestUserCredentials } from "../helpers/auth";
import { cleanupTestUser, disconnectDb } from "../helpers/db";

type TestUser = {
  email: string;
  name: string;
  password: string;
};

type TestFixtures = {
  authenticatedPage: Page;
  testUser: TestUser;
};

export const test = base.extend<TestFixtures>({
  testUser: async ({}, use) => {
    const user = createTestUserCredentials();
    await use(user);
  },

  authenticatedPage: async ({ page, testUser }, use) => {
    await createTestUser(page, testUser);
    await use(page);
    await cleanupTestUser(testUser.email);
  },
});

export const movementTest = test;

export { expect } from "@playwright/test";

test.afterAll(async () => {
  await disconnectDb();
});
