import { test, expect } from "@playwright/test";
import { ensureWorkoutStarted, SEED_MOVEMENTS } from "./helpers";

const MOVEMENT_NAME = SEED_MOVEMENTS.BENCH_PRESS;

async function addSet(page: import("@playwright/test").Page, movement: string, weight: string, reps: string) {
  await page.locator("select").selectOption({ label: movement });
  const weightInput = page.locator('input[placeholder="Weight"]');
  await weightInput.waitFor({ state: "visible" });
  await weightInput.fill(weight);
  await page.locator('input[placeholder="Reps"]').fill(reps);
  await page.locator('button:has-text("Add")').click();
}

test.describe("Sets", () => {
  test.describe("create", () => {
    test("should add a set to the current workout", async ({ page }) => {
      await ensureWorkoutStarted(page);

      await addSet(page, MOVEMENT_NAME, "135", "10");

      const setItem = page.locator("li").filter({ hasText: MOVEMENT_NAME }).filter({ hasText: "10 reps" });
      await expect(setItem).toBeVisible();
    });

    test("should require movement, weight, and reps to add a set", async ({ page }) => {
      await ensureWorkoutStarted(page);

      const addButton = page.locator('button:has-text("Add")');
      await expect(addButton).toBeDisabled();

      await page.locator("select").selectOption({ label: MOVEMENT_NAME });
      await expect(addButton).toBeDisabled();

      const weightInput = page.locator('input[placeholder="Weight"]');
      await weightInput.waitFor({ state: "visible" });
      await weightInput.fill("135");
      await expect(addButton).toBeDisabled();

      await page.locator('input[placeholder="Reps"]').fill("10");
      await expect(addButton).toBeEnabled();
    });

    test("should display the new set in the workout", async ({ page }) => {
      await ensureWorkoutStarted(page);

      await addSet(page, MOVEMENT_NAME, "225", "5");

      const setItem = page.locator("li").filter({ hasText: MOVEMENT_NAME }).filter({ hasText: "225 lbs" });
      await expect(setItem).toBeVisible();
    });
  });

  test.describe("read", () => {
    test("should display sets with movement name, weight, and reps", async ({ page }) => {
      await ensureWorkoutStarted(page);

      await addSet(page, MOVEMENT_NAME, "185", "8");

      const setItem = page.locator("li").filter({ hasText: MOVEMENT_NAME });
      await expect(setItem.last()).toContainText(MOVEMENT_NAME);
      await expect(setItem.last()).toContainText("185 lbs");
      await expect(setItem.last()).toContainText("8 reps");
    });

    test("should show sets in the order they were added", async ({ page }) => {
      await ensureWorkoutStarted(page);

      await addSet(page, MOVEMENT_NAME, "100", "12");
      await expect(page.locator("li").filter({ hasText: "100 lbs" })).toBeVisible();

      await addSet(page, MOVEMENT_NAME, "200", "6");
      await expect(page.locator("li").filter({ hasText: "200 lbs" })).toBeVisible();

      const items = page.locator("ul li");
      const texts = await items.allTextContents();
      const idx100 = texts.findIndex((t) => t.includes("100 lbs"));
      const idx200 = texts.findIndex((t) => t.includes("200 lbs"));
      expect(idx100).toBeLessThan(idx200);
    });
  });

  test.describe("delete", () => {
    test("should remove a set from the current workout", async ({ page }) => {
      await ensureWorkoutStarted(page);

      await addSet(page, MOVEMENT_NAME, "315", "1");

      const setItem = page.locator("li").filter({ hasText: "315 lbs" });
      await expect(setItem).toBeVisible();

      await setItem.locator(`button[aria-label="Delete ${MOVEMENT_NAME} set"]`).click();
      await expect(setItem).not.toBeVisible();
    });

    test("should update the sets list after deletion", async ({ page }) => {
      await ensureWorkoutStarted(page);

      await addSet(page, MOVEMENT_NAME, "405", "1");

      const setItem = page.locator("li").filter({ hasText: "405 lbs" });
      await expect(setItem).toBeVisible();

      const countBefore = await page.locator("ul li").count();
      await setItem.locator(`button[aria-label="Delete ${MOVEMENT_NAME} set"]`).click();
      await expect(setItem).not.toBeVisible();
      const countAfter = await page.locator("ul li").count();
      expect(countAfter).toBeLessThan(countBefore);
    });
  });
});
