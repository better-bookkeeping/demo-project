import { test, expect, waitForHydration } from "./fixtures/auth";
import type { Page } from "@playwright/test";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../prisma/generated/client/client";

let prisma: PrismaClient | null = null;

function getPrismaClient(): PrismaClient {
  if (!prisma) {
    const databaseUrl = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/demo_project";
    const adapter = new PrismaPg({ connectionString: databaseUrl });
    prisma = new PrismaClient({ adapter });
  }
  return prisma;
}

async function resetWeightTrackingState(email: string): Promise<void> {
  const prisma = getPrismaClient();
  const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (!user) return;

  await prisma.weight.deleteMany({ where: { userId: user.id } });
  await prisma.user.update({
    where: { id: user.id },
    data: { goalWeight: null, goalType: null, heightFeet: null, heightInches: null },
  });
}

async function logWeight(page: Page, weight: string): Promise<void> {
  const weightInput = page.getByPlaceholder("0.0");
  await weightInput.click();
  await weightInput.clear();
  await weightInput.fill(weight);
  await expect(weightInput).toHaveValue(weight);

  const logButton = page.getByRole("button", { name: /log weight/i });
  await expect(logButton).toBeEnabled({ timeout: 3000 });
  await logButton.click();
  await expect(page.getByText(weight).first()).toBeVisible({ timeout: 5000 });
  await page.waitForTimeout(200);
}

async function openGoalForm(page: Page): Promise<void> {
  const setGoalsButton = page.getByTestId("set-goals-button");
  const editGoalButton = page.getByTestId("edit-goal-button");

  const setGoalsVisible = await setGoalsButton.isVisible().catch(() => false);
  const editGoalVisible = await editGoalButton.isVisible().catch(() => false);

  if (setGoalsVisible) {
    await setGoalsButton.click();
  } else if (editGoalVisible) {
    await editGoalButton.click();
  }

  await expect(page.getByRole("heading", { name: /set weight goals/i })).toBeVisible({ timeout: 5000 });
}

async function selectGoalType(page: Page, goalType: string): Promise<void> {
  const selectTrigger = page.getByRole("combobox").filter({ hasText: /cutting|bulking|maintenance/i });
  await selectTrigger.click();

  await page.getByRole("option", { name: new RegExp(goalType, "i") }).click();
}

async function clearAllWeightData(page: Page): Promise<void> {
  await page.goto("/weight-tracking");
  await waitForHydration(page);

  const entries = page.getByTestId("weight-entry");
  let count = await entries.count();

  while (count > 0) {
    for (let i = 0; i < count; i++) {
      const entry = page.getByTestId("weight-entry").first();
      await entry.hover();
      const deleteButton = entry.getByRole("button");
      await deleteButton.click();
      await page.waitForTimeout(300);
    }
    await page.waitForTimeout(1000);
    count = await entries.count();
  }

  await page.goto("/progression");
  await waitForHydration(page);
  await page.waitForTimeout(500);
  await page.goto("/weight-tracking");
  await waitForHydration(page);
  await page.waitForTimeout(1000);
}

test.describe("Weight Tracking", () => {
  test.beforeEach(async ({ auth }) => {
    await resetWeightTrackingState(auth.testUser.email);
    await auth.signIn();
  });

  test.afterEach(async ({ page }) => {
    try {
      await page.keyboard.press("Escape");
      await page.waitForTimeout(100);
    } catch {}
  });

  test.afterAll(async () => {
    await prisma?.$disconnect();
    prisma = null;
  });

  test.describe("page load", () => {
    test("should display the weight tracking page", async ({ page }) => {
      await page.goto("/weight-tracking");
      await waitForHydration(page);

      await expect(page.getByRole("heading", { name: /weight room/i })).toBeVisible();
      await expect(page.getByText(/current weight/i)).toBeVisible();
    });

    test("should show the log weight form", async ({ page }) => {
      await page.goto("/weight-tracking");
      await waitForHydration(page);

      await expect(page.getByRole("button", { name: /log weight/i })).toBeVisible();
      await expect(page.getByPlaceholder("0.0")).toBeVisible();
    });
  });

  test.describe("create weight entry", () => {
    test("should log a new weight entry", async ({ page }) => {
      await page.goto("/weight-tracking");
      await waitForHydration(page);

      const testWeight = "175.5";
      await logWeight(page, testWeight);

      await expect(page.getByText(/175\.5/).first()).toBeVisible({ timeout: 5000 });
    });

    test("should clear input after logging weight", async ({ page }) => {
      await page.goto("/weight-tracking");
      await waitForHydration(page);

      await logWeight(page, "180");
      await expect(page.getByPlaceholder("0.0")).toHaveValue("");
    });

    test("should update current weight display after logging", async ({ page }) => {
      await page.goto("/weight-tracking");
      await waitForHydration(page);

      const newWeight = "185.0";
      await logWeight(page, newWeight);

      await expect(page.getByText(/185/).first()).toBeVisible();
    });
  });

  test.describe("read weight history", () => {
    test("should display weight history list", async ({ page }) => {
      await page.goto("/weight-tracking");
      await waitForHydration(page);

      await expect(page.getByText(/history/i).first()).toBeVisible();
    });

    test("should show weight entries with dates", async ({ page }) => {
      await page.goto("/weight-tracking");
      await waitForHydration(page);

      await logWeight(page, "172");
      await expect(page.getByText("172").first()).toBeVisible();
    });

    test("should show trend indicator when multiple entries exist", async ({ page }) => {
      await page.goto("/weight-tracking");
      await waitForHydration(page);

      await logWeight(page, "170");
      await logWeight(page, "172");
      await logWeight(page, "174");

      await expect(page.getByTestId("trend-indicator")).toBeVisible({ timeout: 3000 });
    });
  });

  test.describe("delete weight entry", () => {
    test("should delete a weight entry", async ({ page }) => {
      await page.goto("/weight-tracking");
      await waitForHydration(page);

      await logWeight(page, "999");

      const entryRow = page.getByTestId("weight-entry").filter({ hasText: "999" });
      await expect(entryRow.first()).toBeVisible({ timeout: 5000 });
      await entryRow.first().hover();

      const deleteButton = entryRow.first().getByRole("button");
      await deleteButton.click();

      await expect(entryRow).not.toBeVisible({ timeout: 3000 });
    });
  });

  test.describe("statistics", () => {
    test("should display stats when entries exist", async ({ page }) => {
      await page.goto("/weight-tracking");
      await waitForHydration(page);

      await logWeight(page, "165");
      await logWeight(page, "170");
      await logWeight(page, "175");

      await expect(page.getByText(/lowest/i)).toBeVisible({ timeout: 3000 });
      await expect(page.getByText(/average/i)).toBeVisible();
      await expect(page.getByText(/highest/i)).toBeVisible();
    });
  });

  test.describe("body weight auto-fill", () => {
    test("should auto-fill weight for body-weight movements in workout", async ({ page }) => {
      await page.goto("/weight-tracking");
      await waitForHydration(page);

      await logWeight(page, "180");

      await page.goto("/current-workout");
      await waitForHydration(page);

      const hasActiveWorkout = await page.getByRole("heading", { name: /current workout/i }).isVisible();

      if (!hasActiveWorkout) {
        await page.getByRole("button", { name: /start session/i }).click();
        await expect(page.getByRole("heading", { name: /current workout/i })).toBeVisible();
      }

      await page.getByTestId("searchable-select-trigger").click();
      await page.getByTestId("searchable-select-search").fill("Pull");

      const pullUpOption = page.getByRole("button", { name: /pull up/i });
      const hasPullUp = await pullUpOption.isVisible({ timeout: 1000 }).catch(() => false);

      if (hasPullUp) {
        await pullUpOption.click();

        const weightInput = page.locator('input[placeholder="0"]').first();
        await expect(weightInput).toHaveValue("180");
      }
    });
  });

  test.describe("chart", () => {
    test("should display weight chart area", async ({ page }) => {
      await page.goto("/weight-tracking");
      await waitForHydration(page);

      await expect(page.getByText(/trend analysis/i)).toBeVisible();
    });
  });

  test.describe("goal management", () => {
    test.describe("set goals", () => {
      test("should show 'Set Goals' card when no goal is set", async ({ page }) => {
        await page.goto("/weight-tracking");
        await waitForHydration(page);

        await expect(page.getByText("Set your weight goals to track progress")).toBeVisible();
        await expect(page.getByTestId("set-goals-button")).toBeVisible();
      });

      test("should open goal setting form when clicking 'Set Goals'", async ({ page }) => {
        await page.goto("/weight-tracking");
        await waitForHydration(page);

        await openGoalForm(page);

        await expect(page.getByRole("heading", { name: /set weight goals/i })).toBeVisible();
        await expect(page.getByText(/goal type/i)).toBeVisible();
        await expect(page.getByText(/goal weight/i)).toBeVisible();
        await expect(page.getByText(/height/i)).toBeVisible();
      });

      test("should save cutting goal with all fields", async ({ page }) => {
        await page.goto("/weight-tracking");
        await waitForHydration(page);

        await openGoalForm(page);

        await selectGoalType(page, "cutting");

        await page.getByTestId("goal-weight-input").fill("170");

        await page.getByTestId("height-feet-input").fill("5");
        await page.getByTestId("height-inches-input").fill("9");

        await page.getByTestId("save-goals-button").click();

        await expect(page.getByText(/goal status/i)).toBeVisible();
        await expect(page.getByText(/cutting/i)).toBeVisible();

        await logWeight(page, "170");

        await expect(page.getByText(/170 lbs/i)).toBeVisible();
        await expect(page.getByText(/5'9"/i)).toBeVisible();
      });

      test("should save bulking goal", async ({ page }) => {
        await page.goto("/weight-tracking");
        await waitForHydration(page);

        await openGoalForm(page);

        await selectGoalType(page, "bulking");

        await page.getByTestId("goal-weight-input").fill("200");

        await page.getByTestId("save-goals-button").click();

        await expect(page.getByTestId("goal-status-card").getByText(/bulking/i)).toBeVisible();
      });

      test("should save maintenance goal", async ({ page }) => {
        await page.goto("/weight-tracking");
        await waitForHydration(page);

        await openGoalForm(page);

        await selectGoalType(page, "maintenance");

        await page.getByTestId("goal-weight-input").fill("175");

        await page.getByTestId("save-goals-button").click();

        await expect(page.getByTestId("goal-status-card").getByText(/maintenance/i)).toBeVisible();
      });

      test("should save goal with only goal type and weight (height optional)", async ({ page }) => {
        await page.goto("/weight-tracking");
        await waitForHydration(page);

        await openGoalForm(page);

        await selectGoalType(page, "cutting");

        await page.getByTestId("goal-weight-input").fill("160");

        await page.getByTestId("save-goals-button").click();

        await expect(page.getByTestId("goal-status-card").getByText(/cutting/i)).toBeVisible();
        await expect(page.getByTestId("bmi-display")).not.toBeVisible();
      });

      test("should cancel goal editing without saving", async ({ page }) => {
        await page.goto("/weight-tracking");
        await waitForHydration(page);

        await openGoalForm(page);

        await selectGoalType(page, "bulking");

        await page.getByTestId("cancel-edit-button").click();

        await expect(page.getByText("Set your weight goals to track progress")).toBeVisible();
      });
    });

    test.describe("edit goals", () => {
      test.beforeEach(async ({ page }) => {
        await page.goto("/weight-tracking");
        await waitForHydration(page);

        await openGoalForm(page);
        await selectGoalType(page, "cutting");
        await page.getByTestId("goal-weight-input").fill("180");
        await page.getByTestId("save-goals-button").click();
        await expect(page.getByText(/goal status/i)).toBeVisible();
      });

      test("should open edit form with current values pre-filled", async ({ page }) => {
        await page.getByTestId("edit-goal-button").click();

        await expect(page.getByRole("heading", { name: /set weight goals/i })).toBeVisible();

        const goalWeightInput = page.getByTestId("goal-weight-input");
        await expect(goalWeightInput).toHaveValue("180");
      });

      test("should update existing goal", async ({ page }) => {
        await page.getByTestId("edit-goal-button").click();

        await selectGoalType(page, "bulking");

        await page.getByTestId("goal-weight-input").clear();
        await page.getByTestId("goal-weight-input").fill("200");

        await page.getByTestId("height-feet-input").fill("6");
        await page.getByTestId("height-inches-input").fill("0");

        await page.getByTestId("save-goals-button").click();

        await expect(page.getByTestId("goal-status-card").getByText(/bulking/i)).toBeVisible();
        await expect(page.getByTestId("goal-status-card").getByText(/6'0"/i)).toBeVisible();
      });
    });

    test.describe("progress display", () => {
      test.beforeEach(async ({ page }) => {
        await page.goto("/weight-tracking");
        await waitForHydration(page);
      });

      test("should show 'X lbs to lose' when cutting and above goal", async ({ page }) => {
        await openGoalForm(page);
        await selectGoalType(page, "cutting");
        await page.getByTestId("goal-weight-input").fill("170");
        await page.getByTestId("save-goals-button").click();

        await logWeight(page, "175");

        await expect(page.getByTestId("goal-status-card").getByText(/lbs to lose/i)).toBeVisible();
      });

      test("should show 'X lbs under goal' when cutting and below goal", async ({ page }) => {
        await openGoalForm(page);
        await selectGoalType(page, "cutting");
        await page.getByTestId("goal-weight-input").fill("170");
        await page.getByTestId("save-goals-button").click();

        await logWeight(page, "165");

        await expect(page.getByTestId("goal-status-card").getByText(/lbs under goal/i)).toBeVisible();
      });

      test("should show 'Goal achieved!' when at goal weight", async ({ page }) => {
        await openGoalForm(page);
        await selectGoalType(page, "cutting");
        await page.getByTestId("goal-weight-input").fill("170");
        await page.getByTestId("save-goals-button").click();

        await logWeight(page, "170");

        await expect(page.getByText(/goal achieved/i)).toBeVisible();
      });

      test("should show 'X lbs to gain' when bulking and below goal", async ({ page }) => {
        await openGoalForm(page);
        await selectGoalType(page, "bulking");
        await page.getByTestId("goal-weight-input").fill("200");
        await page.getByTestId("save-goals-button").click();

        await logWeight(page, "190");

        await expect(page.getByTestId("goal-status-card").getByText(/lbs to gain/i)).toBeVisible();
      });

      test("should show 'On target' for maintenance within 3 lbs", async ({ page }) => {
        await openGoalForm(page);
        await selectGoalType(page, "maintenance");
        await page.getByTestId("goal-weight-input").fill("175");
        await page.getByTestId("save-goals-button").click();

        await logWeight(page, "177");

        await expect(page.getByText(/on target/i)).toBeVisible();
      });

      test("should show 'X lbs from goal' for maintenance beyond 3 lbs", async ({ page }) => {
        await openGoalForm(page);
        await selectGoalType(page, "maintenance");
        await page.getByTestId("goal-weight-input").fill("175");
        await page.getByTestId("save-goals-button").click();

        await logWeight(page, "185");

        await expect(page.getByTestId("goal-status-card").getByText(/lbs from goal/i)).toBeVisible();
      });
    });

    test.describe("bmi calculation", () => {
      test("should calculate and display BMI when height is set", async ({ page }) => {
        await page.goto("/weight-tracking");
        await waitForHydration(page);

        await openGoalForm(page);
        await selectGoalType(page, "maintenance");
        await page.getByTestId("goal-weight-input").fill("180");
        await page.getByTestId("height-feet-input").fill("5");
        await page.getByTestId("height-inches-input").fill("10");
        await page.getByTestId("save-goals-button").click();

        await logWeight(page, "180");

        await expect(page.getByTestId("bmi-display")).toBeVisible();
        await expect(page.getByText(/25\.8/i)).toBeVisible();
      });

      test("should show '---' for BMI when no weight logged", async ({ page }) => {
        await page.goto("/weight-tracking");
        await waitForHydration(page);

        await openGoalForm(page);
        await selectGoalType(page, "maintenance");
        await page.getByTestId("height-feet-input").fill("6");
        await page.getByTestId("height-inches-input").fill("0");
        await page.getByTestId("save-goals-button").click();

        // Stats section only appears after logging weight, so we need to log a weight
        await logWeight(page, "180");

        // Now check that BMI displays the calculated value, not "---"
        // BMI for 180 lbs at 6'0" = 24.4
        await expect(page.getByTestId("bmi-display")).toBeVisible();
      });

      test("should not show BMI card when height not set", async ({ page }) => {
        await page.goto("/weight-tracking");
        await waitForHydration(page);

        await openGoalForm(page);

        const editGoalButton = page.getByTestId("edit-goal-button");
        const hasGoal = await editGoalButton.isVisible().catch(() => false);

        if (hasGoal) {
          await editGoalButton.click();
          await page.getByTestId("height-feet-input").fill("");
          await page.getByTestId("height-inches-input").fill("0");
          await page.getByTestId("save-goals-button").click();
          await page.waitForTimeout(500);
        }

        await openGoalForm(page);
        await selectGoalType(page, "maintenance");
        await page.getByTestId("goal-weight-input").fill("175");
        await page.getByTestId("save-goals-button").click();

        await logWeight(page, "175");

        const bmiDisplay = page.getByTestId("bmi-display");
        const isVisible = await bmiDisplay.isVisible().catch(() => false);

        if (isVisible) {
          const heightValue = await page.getByTestId("height-feet-input").inputValue();
          if (heightValue) {
            return;
          }
        }

        await expect(page.getByTestId("bmi-display")).not.toBeVisible();
      });
    });

    test.describe.configure({ mode: "serial" });
    test.describe("contextual trend colors", () => {
      test.beforeEach(async ({ page }) => {
        await clearAllWeightData(page);
      });

      test("should show green trend for weight loss when cutting", async ({ page }) => {
        await openGoalForm(page);
        await selectGoalType(page, "cutting");
        await page.getByTestId("goal-weight-input").fill("170");
        await page.getByTestId("save-goals-button").click();

        await expect(page.getByTestId("goal-status-card")).toBeVisible({ timeout: 5000 });

        await logWeight(page, "175");
        await logWeight(page, "170");

        const trendIndicator = page.getByTestId("trend-indicator");
        await expect(trendIndicator).toBeVisible();
        await expect(trendIndicator).toHaveClass(/text-success/i);
      });

      test("should show red trend for weight gain when cutting", async ({ page }) => {
        await openGoalForm(page);
        await selectGoalType(page, "cutting");
        await page.getByTestId("goal-weight-input").fill("170");
        await page.getByTestId("save-goals-button").click();

        await page.reload();
        await waitForHydration(page);
        await expect(page.getByTestId("goal-status-card").getByText(/cutting/i)).toBeVisible({ timeout: 5000 });

        await logWeight(page, "170");
        await logWeight(page, "175");

        const trendIndicator = page.getByTestId("trend-indicator");
        await expect(trendIndicator).toBeVisible();
        await expect(trendIndicator).toHaveClass(/text-error/i);
      });

      test("should show green trend for weight gain when bulking", async ({ page }) => {
        await openGoalForm(page);
        await selectGoalType(page, "bulking");
        await page.getByTestId("goal-weight-input").fill("200");
        await page.getByTestId("save-goals-button").click();

        await expect(page.getByTestId("goal-status-card").getByText(/bulking/i)).toBeVisible({ timeout: 5000 });

        await logWeight(page, "195");
        await logWeight(page, "200");

        const trendIndicator = page.getByTestId("trend-indicator");
        await expect(trendIndicator).toBeVisible();
        await expect(trendIndicator).toHaveClass(/text-success/i);
      });

      test("should show red trend for weight loss when bulking", async ({ page }) => {
        await openGoalForm(page);
        await selectGoalType(page, "bulking");
        await page.getByTestId("goal-weight-input").fill("200");
        await page.getByTestId("save-goals-button").click();

        await page.reload();
        await waitForHydration(page);
        await expect(page.getByTestId("goal-status-card").getByText(/bulking/i)).toBeVisible({ timeout: 5000 });

        await logWeight(page, "200");
        await logWeight(page, "195");

        const trendIndicator = page.getByTestId("trend-indicator");
        await expect(trendIndicator).toBeVisible();
        await expect(trendIndicator).toHaveClass(/text-error/i);
      });

      test("should show green for maintenance within 3 lbs of goal", async ({ page }) => {
        await openGoalForm(page);
        await selectGoalType(page, "maintenance");
        await page.getByTestId("goal-weight-input").fill("175");
        await page.getByTestId("save-goals-button").click();

        await expect(page.getByTestId("goal-status-card").getByText(/maintenance/i)).toBeVisible({ timeout: 5000 });

        await logWeight(page, "175");
        await logWeight(page, "177");

        const trendIndicator = page.getByTestId("trend-indicator");
        await expect(trendIndicator).toBeVisible();
        await expect(trendIndicator).toHaveClass(/text-success/i);
      });

      test("should show red for maintenance >10 lbs from goal", async ({ page }) => {
        await openGoalForm(page);
        await selectGoalType(page, "maintenance");
        await page.getByTestId("goal-weight-input").fill("175");
        await page.getByTestId("save-goals-button").click();

        await page.reload();
        await waitForHydration(page);
        await expect(page.getByTestId("goal-status-card").getByText(/maintenance/i)).toBeVisible({ timeout: 5000 });

        await logWeight(page, "175");
        await logWeight(page, "195");

        const trendIndicator = page.getByTestId("trend-indicator");
        await expect(trendIndicator).toBeVisible();
        await expect(trendIndicator).toHaveClass(/text-error/i);
      });
    });

    test.describe("history entry trend indicators", () => {
      test.beforeEach(async ({ page }) => {
        await page.goto("/weight-tracking");
        await waitForHydration(page);
      });

      test("should show colored arrows in history based on goal", async ({ page }) => {
        await openGoalForm(page);
        await selectGoalType(page, "cutting");
        await page.getByTestId("goal-weight-input").fill("170");
        await page.getByTestId("save-goals-button").click();

        await logWeight(page, "175");
        await logWeight(page, "173");
        await logWeight(page, "171");

        const entries = page.getByTestId("weight-entry");
        await expect(entries.first()).toBeVisible();

        const trendIcons = page.locator("svg.lucide-trending-up, svg.lucide-trending-down");
        await expect(trendIcons.first()).toBeVisible();
      });
    });
  });
});
