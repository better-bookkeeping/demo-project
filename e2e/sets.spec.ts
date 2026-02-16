import { test, expect, Page } from "@playwright/test";

const TEST_EMAIL = "e2e-sets@test.com";
const TEST_PASSWORD = "testpassword123";
const TEST_NAME = "E2E Sets";

async function signIn(page: Page) {
  await page.goto("/sign-in");

  await page.fill("#email", TEST_EMAIL);
  await page.fill("#password", TEST_PASSWORD);
  await page.click('button[type="submit"]');

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

async function ensureMovementExists(page: Page, name: string) {
  await page.goto("/movements");
  const existing = page.locator(`li:has-text("${name}")`);
  if (await existing.isVisible().catch(() => false)) return;

  await page.fill('input[placeholder="Movement name (e.g. Bench Press)"]', name);
  await page.click('button:has-text("Add")');
  await expect(page.locator(`text=${name}`)).toBeVisible();
}

async function ensureWorkoutStarted(page: Page) {
  await page.goto("/current-workout");
  const startButton = page.locator('button:has-text("Start Workout")');
  if (await startButton.isVisible().catch(() => false)) {
    await startButton.click();
    await expect(page.locator('button:has-text("Complete Workout")')).toBeVisible();
  }
}

const MOVEMENT_NAME = "E2E Bench Press";

test.describe("Sets", () => {
  test.describe("create", () => {
    test("should add a set to the current workout", async ({ page }) => {
      await signIn(page);
      await ensureMovementExists(page, MOVEMENT_NAME);
      await ensureWorkoutStarted(page);

      await page.selectOption("select", { label: MOVEMENT_NAME });
      await page.fill('input[placeholder="Weight"]', "135");
      await page.fill('input[placeholder="Reps"]', "10");
      await page.click('button:has-text("Add")');

      await expect(page.locator(`text=${MOVEMENT_NAME}`)).toBeVisible();
      await expect(page.locator("text=10 reps")).toBeVisible();
    });

    test("should require movement, weight, and reps to add a set", async ({ page }) => {
      await signIn(page);
      await ensureMovementExists(page, MOVEMENT_NAME);
      await ensureWorkoutStarted(page);

      // The Add button should be disabled when fields are empty
      const addButton = page.locator('button:has-text("Add")');
      await expect(addButton).toBeDisabled();

      // Fill only movement
      await page.selectOption("select", { label: MOVEMENT_NAME });
      await expect(addButton).toBeDisabled();

      // Fill weight too
      await page.fill('input[placeholder="Weight"]', "135");
      await expect(addButton).toBeDisabled();

      // Fill reps — now it should be enabled
      await page.fill('input[placeholder="Reps"]', "10");
      await expect(addButton).toBeEnabled();
    });

    test("should display the new set in the workout", async ({ page }) => {
      await signIn(page);
      await ensureMovementExists(page, MOVEMENT_NAME);
      await ensureWorkoutStarted(page);

      await page.selectOption("select", { label: MOVEMENT_NAME });
      await page.fill('input[placeholder="Weight"]', "225");
      await page.fill('input[placeholder="Reps"]', "5");
      await page.click('button:has-text("Add")');

      const setItem = page.locator("li").filter({ hasText: MOVEMENT_NAME }).filter({ hasText: "225 lbs" });
      await expect(setItem).toBeVisible();
    });
  });

  test.describe("read", () => {
    test("should display sets with movement name, weight, and reps", async ({ page }) => {
      await signIn(page);
      await ensureMovementExists(page, MOVEMENT_NAME);
      await ensureWorkoutStarted(page);

      await page.selectOption("select", { label: MOVEMENT_NAME });
      await page.fill('input[placeholder="Weight"]', "185");
      await page.fill('input[placeholder="Reps"]', "8");
      await page.click('button:has-text("Add")');

      const setItem = page.locator("li").filter({ hasText: MOVEMENT_NAME });
      await expect(setItem.last()).toContainText(MOVEMENT_NAME);
      await expect(setItem.last()).toContainText("185 lbs");
      await expect(setItem.last()).toContainText("8 reps");
    });

    test("should show sets in the order they were added", async ({ page }) => {
      await signIn(page);
      await ensureMovementExists(page, MOVEMENT_NAME);
      await ensureWorkoutStarted(page);

      // Add first set
      await page.selectOption("select", { label: MOVEMENT_NAME });
      await page.fill('input[placeholder="Weight"]', "100");
      await page.fill('input[placeholder="Reps"]', "12");
      await page.click('button:has-text("Add")');
      await expect(page.locator("li").filter({ hasText: "100 lbs" })).toBeVisible();

      // Add second set
      await page.selectOption("select", { label: MOVEMENT_NAME });
      await page.fill('input[placeholder="Weight"]', "200");
      await page.fill('input[placeholder="Reps"]', "6");
      await page.click('button:has-text("Add")');
      await expect(page.locator("li").filter({ hasText: "200 lbs" })).toBeVisible();

      // Both should be visible
      const items = page.locator("ul li");
      const texts = await items.allTextContents();
      const idx100 = texts.findIndex((t) => t.includes("100 lbs"));
      const idx200 = texts.findIndex((t) => t.includes("200 lbs"));
      expect(idx100).toBeLessThan(idx200);
    });
  });

  test.describe("delete", () => {
    test("should remove a set from the current workout", async ({ page }) => {
      await signIn(page);
      await ensureMovementExists(page, MOVEMENT_NAME);
      await ensureWorkoutStarted(page);

      await page.selectOption("select", { label: MOVEMENT_NAME });
      await page.fill('input[placeholder="Weight"]', "315");
      await page.fill('input[placeholder="Reps"]', "1");
      await page.click('button:has-text("Add")');

      const setItem = page.locator("li").filter({ hasText: "315 lbs" });
      await expect(setItem).toBeVisible();

      // Click the delete button on this set
      await setItem.locator(`button[aria-label="Delete ${MOVEMENT_NAME} set"]`).click();
      await expect(setItem).not.toBeVisible();
    });

    test("should update the sets list after deletion", async ({ page }) => {
      await signIn(page);
      await ensureMovementExists(page, MOVEMENT_NAME);
      await ensureWorkoutStarted(page);

      await page.selectOption("select", { label: MOVEMENT_NAME });
      await page.fill('input[placeholder="Weight"]', "405");
      await page.fill('input[placeholder="Reps"]', "1");
      await page.click('button:has-text("Add")');

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
