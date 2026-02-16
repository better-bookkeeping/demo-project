import { test, expect } from "@playwright/test";

test.describe("Movements", () => {
  test.describe("create", () => {
    test("should create a new movement with a valid name", async ({ page }) => {
      await page.goto("/movements", { waitUntil: "networkidle" });

      const movementName = `Test Movement ${Date.now()}`;
      const input = page.locator('input[placeholder="Movement name (e.g. Bench Press)"]');
      await input.waitFor({ state: "visible" });
      await input.fill(movementName);
      await page.locator('button:has-text("Add")').click();

      await expect(page.locator(`text=${movementName}`)).toBeVisible();
    });

    test("should show the new movement in the movements list", async ({ page }) => {
      await page.goto("/movements", { waitUntil: "networkidle" });

      const movementName = `Listed Movement ${Date.now()}`;
      const input = page.locator('input[placeholder="Movement name (e.g. Bench Press)"]');
      await input.waitFor({ state: "visible" });
      await input.fill(movementName);
      await page.locator('button:has-text("Add")').click();

      await expect(page.locator("ul").locator(`text=${movementName}`)).toBeVisible();
    });

    test("should clear the input after creating a movement", async ({ page }) => {
      await page.goto("/movements", { waitUntil: "networkidle" });

      const movementName = `Clear Input ${Date.now()}`;
      const input = page.locator('input[placeholder="Movement name (e.g. Bench Press)"]');
      await input.waitFor({ state: "visible" });
      await input.fill(movementName);
      await page.locator('button:has-text("Add")').click();

      await expect(page.locator(`text=${movementName}`)).toBeVisible();
      await expect(input).toHaveValue("");
    });
  });

  test.describe("read", () => {
    test("should display all movements on the movements page", async ({ page }) => {
      await page.goto("/movements", { waitUntil: "networkidle" });

      const input = page.locator('input[placeholder="Movement name (e.g. Bench Press)"]');
      await input.waitFor({ state: "visible" });

      const name1 = `Read A ${Date.now()}`;
      const name2 = `Read B ${Date.now()}`;

      await input.fill(name1);
      await page.locator('button:has-text("Add")').click();
      await expect(page.locator(`text=${name1}`)).toBeVisible();

      await input.fill(name2);
      await page.locator('button:has-text("Add")').click();
      await expect(page.locator(`text=${name2}`)).toBeVisible();

      await expect(page.locator(`text=${name1}`)).toBeVisible();
      await expect(page.locator(`text=${name2}`)).toBeVisible();
    });

    test("should show movements sorted alphabetically", async ({ page }) => {
      await page.goto("/movements", { waitUntil: "networkidle" });

      const input = page.locator('input[placeholder="Movement name (e.g. Bench Press)"]');
      await input.waitFor({ state: "visible" });

      const ts = Date.now();
      const nameA = `AAA Sort ${ts}`;
      const nameZ = `ZZZ Sort ${ts}`;

      await input.fill(nameZ);
      await page.locator('button:has-text("Add")').click();
      await expect(page.locator(`text=${nameZ}`)).toBeVisible();

      await input.fill(nameA);
      await page.locator('button:has-text("Add")').click();
      await expect(page.locator(`text=${nameA}`)).toBeVisible();

      const items = page.locator("ul li");
      const texts = await items.allTextContents();
      const indexA = texts.findIndex((t) => t.includes(nameA));
      const indexZ = texts.findIndex((t) => t.includes(nameZ));
      expect(indexA).toBeLessThan(indexZ);
    });
  });

  test.describe("delete", () => {
    test("should delete an existing movement", async ({ page }) => {
      await page.goto("/movements", { waitUntil: "networkidle" });

      const movementName = `Delete Me ${Date.now()}`;
      const input = page.locator('input[placeholder="Movement name (e.g. Bench Press)"]');
      await input.waitFor({ state: "visible" });
      await input.fill(movementName);
      await page.locator('button:has-text("Add")').click();
      await expect(page.locator(`text=${movementName}`)).toBeVisible();

      await page.locator(`button[aria-label="Delete ${movementName}"]`).click();
      await expect(page.locator(`li:has-text("${movementName}")`)).not.toBeVisible();
    });

    test("should remove the movement from the list after deletion", async ({ page }) => {
      await page.goto("/movements", { waitUntil: "networkidle" });

      const movementName = `Remove List ${Date.now()}`;
      const input = page.locator('input[placeholder="Movement name (e.g. Bench Press)"]');
      await input.waitFor({ state: "visible" });
      await input.fill(movementName);
      await page.locator('button:has-text("Add")').click();
      await expect(page.locator(`text=${movementName}`)).toBeVisible();

      const countBefore = await page.locator("ul li").count();
      await page.locator(`button[aria-label="Delete ${movementName}"]`).click();
      await expect(page.locator(`li:has-text("${movementName}")`)).not.toBeVisible();
      const countAfter = await page.locator("ul li").count();
      expect(countAfter).toBeLessThan(countBefore);
    });
  });
});
