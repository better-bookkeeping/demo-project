import { test, expect, Page } from "@playwright/test";

const TEST_EMAIL = "e2e-movements@test.com";
const TEST_PASSWORD = "testpassword123";
const TEST_NAME = "E2E Movements";

async function signIn(page: Page) {
  await page.goto("/sign-in");

  // Try signing in first
  await page.fill("#email", TEST_EMAIL);
  await page.fill("#password", TEST_PASSWORD);
  await page.click('button[type="submit"]');

  // If sign-in fails (user doesn't exist), create account
  const errorOrNav = await Promise.race([
    page.waitForURL("**/", { timeout: 5000 }).then(() => "navigated"),
    page.locator('[role="alert"]').waitFor({ timeout: 5000 }).then(() => "error"),
  ]);

  if (errorOrNav === "error") {
    await page.goto("/create-account");
    await page.fill("#name", TEST_NAME);
    await page.fill("#email", TEST_EMAIL);
    await page.fill("#password", TEST_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL("**/");
  }
}

test.describe("Movements", () => {
  test.describe("create", () => {
    test("should create a new movement with a valid name", async ({ page }) => {
      await signIn(page);
      await page.goto("/movements");

      const movementName = `Test Movement ${Date.now()}`;
      await page.fill('input[placeholder="Movement name (e.g. Bench Press)"]', movementName);
      await page.click('button:has-text("Add")');

      await expect(page.locator(`text=${movementName}`)).toBeVisible();
    });

    test("should show the new movement in the movements list", async ({ page }) => {
      await signIn(page);
      await page.goto("/movements");

      const movementName = `Listed Movement ${Date.now()}`;
      await page.fill('input[placeholder="Movement name (e.g. Bench Press)"]', movementName);
      await page.click('button:has-text("Add")');

      await expect(page.locator("ul").locator(`text=${movementName}`)).toBeVisible();
    });

    test("should clear the input after creating a movement", async ({ page }) => {
      await signIn(page);
      await page.goto("/movements");

      const movementName = `Clear Input ${Date.now()}`;
      await page.fill('input[placeholder="Movement name (e.g. Bench Press)"]', movementName);
      await page.click('button:has-text("Add")');

      await expect(page.locator(`text=${movementName}`)).toBeVisible();
      await expect(page.locator('input[placeholder="Movement name (e.g. Bench Press)"]')).toHaveValue("");
    });
  });

  test.describe("read", () => {
    test("should display all movements on the movements page", async ({ page }) => {
      await signIn(page);
      await page.goto("/movements");

      // Create two movements
      const name1 = `Read A ${Date.now()}`;
      const name2 = `Read B ${Date.now()}`;

      await page.fill('input[placeholder="Movement name (e.g. Bench Press)"]', name1);
      await page.click('button:has-text("Add")');
      await expect(page.locator(`text=${name1}`)).toBeVisible();

      await page.fill('input[placeholder="Movement name (e.g. Bench Press)"]', name2);
      await page.click('button:has-text("Add")');
      await expect(page.locator(`text=${name2}`)).toBeVisible();

      // Both should be visible
      await expect(page.locator(`text=${name1}`)).toBeVisible();
      await expect(page.locator(`text=${name2}`)).toBeVisible();
    });

    test("should show movements sorted alphabetically", async ({ page }) => {
      await signIn(page);
      await page.goto("/movements");

      const ts = Date.now();
      const nameA = `AAA Sort ${ts}`;
      const nameZ = `ZZZ Sort ${ts}`;

      // Create Z first, then A
      await page.fill('input[placeholder="Movement name (e.g. Bench Press)"]', nameZ);
      await page.click('button:has-text("Add")');
      await expect(page.locator(`text=${nameZ}`)).toBeVisible();

      await page.fill('input[placeholder="Movement name (e.g. Bench Press)"]', nameA);
      await page.click('button:has-text("Add")');
      await expect(page.locator(`text=${nameA}`)).toBeVisible();

      // A should appear before Z in the list
      const items = page.locator("ul li");
      const texts = await items.allTextContents();
      const indexA = texts.findIndex((t) => t.includes(nameA));
      const indexZ = texts.findIndex((t) => t.includes(nameZ));
      expect(indexA).toBeLessThan(indexZ);
    });
  });

  test.describe("delete", () => {
    test("should delete an existing movement", async ({ page }) => {
      await signIn(page);
      await page.goto("/movements");

      const movementName = `Delete Me ${Date.now()}`;
      await page.fill('input[placeholder="Movement name (e.g. Bench Press)"]', movementName);
      await page.click('button:has-text("Add")');
      await expect(page.locator(`text=${movementName}`)).toBeVisible();

      await page.click(`button[aria-label="Delete ${movementName}"]`);
      await expect(page.locator(`li:has-text("${movementName}")`)).not.toBeVisible();
    });

    test("should remove the movement from the list after deletion", async ({ page }) => {
      await signIn(page);
      await page.goto("/movements");

      const movementName = `Remove List ${Date.now()}`;
      await page.fill('input[placeholder="Movement name (e.g. Bench Press)"]', movementName);
      await page.click('button:has-text("Add")');
      await expect(page.locator(`text=${movementName}`)).toBeVisible();

      const countBefore = await page.locator("ul li").count();
      await page.click(`button[aria-label="Delete ${movementName}"]`);
      await expect(page.locator(`li:has-text("${movementName}")`)).not.toBeVisible();
      const countAfter = await page.locator("ul li").count();
      expect(countAfter).toBeLessThan(countBefore);
    });
  });
});
