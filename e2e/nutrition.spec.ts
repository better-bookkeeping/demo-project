import { test, expect } from "./fixtures/test-fixtures";

test.describe("Nutrition Tracking", () => {
  test.describe("log food", () => {
    test("should log a food entry with macros", async ({ authenticatedPage }) => {
      await authenticatedPage.goto("/nutrition");
      await authenticatedPage.waitForLoadState("networkidle");

      // Select meal type using native select
      await authenticatedPage.getByLabel("Meal type").selectOption("lunch");

      // Fill in macros
      await authenticatedPage.getByPlaceholder("Calories").fill("500");
      await authenticatedPage.getByPlaceholder("Protein").fill("30");
      await authenticatedPage.getByPlaceholder("Carbs").fill("50");
      await authenticatedPage.getByPlaceholder("Fat").fill("20");

      // Submit
      await authenticatedPage.getByRole("button", { name: "Log Food" }).click();

      // Verify entry appears in food log (use locator to avoid matching select option)
      await expect(authenticatedPage.locator("span").filter({ hasText: "Lunch" })).toBeVisible();
      await expect(authenticatedPage.getByText("500 kcal")).toBeVisible();
    });

    test("should clear form after logging", async ({ authenticatedPage }) => {
      await authenticatedPage.goto("/nutrition");
      await authenticatedPage.waitForLoadState("networkidle");

      await authenticatedPage.getByPlaceholder("Calories").fill("300");
      await authenticatedPage.getByPlaceholder("Protein").fill("20");
      await authenticatedPage.getByPlaceholder("Carbs").fill("30");
      await authenticatedPage.getByPlaceholder("Fat").fill("10");

      await authenticatedPage.getByRole("button", { name: "Log Food" }).click();

      await expect(authenticatedPage.getByText("300 kcal")).toBeVisible();
      await expect(authenticatedPage.getByPlaceholder("Calories")).toHaveValue("");
      await expect(authenticatedPage.getByPlaceholder("Protein")).toHaveValue("");
    });
  });

  test.describe("food log display", () => {
    test("should display food entries in list", async ({ authenticatedPage }) => {
      await authenticatedPage.goto("/nutrition");
      await authenticatedPage.waitForLoadState("networkidle");

      // Log first entry
      await authenticatedPage.getByLabel("Meal type").selectOption("breakfast");
      await authenticatedPage.getByPlaceholder("Calories").fill("400");
      await authenticatedPage.getByPlaceholder("Protein").fill("25");
      await authenticatedPage.getByPlaceholder("Carbs").fill("40");
      await authenticatedPage.getByPlaceholder("Fat").fill("15");
      await authenticatedPage.getByRole("button", { name: "Log Food" }).click();
      await expect(authenticatedPage.getByText("400 kcal")).toBeVisible();

      // Log second entry
      await authenticatedPage.getByLabel("Meal type").selectOption("snack");
      await authenticatedPage.getByPlaceholder("Calories").fill("200");
      await authenticatedPage.getByPlaceholder("Protein").fill("10");
      await authenticatedPage.getByPlaceholder("Carbs").fill("25");
      await authenticatedPage.getByPlaceholder("Fat").fill("8");
      await authenticatedPage.getByRole("button", { name: "Log Food" }).click();

      // Verify both entries are visible (use locator to avoid matching select options)
      await expect(authenticatedPage.locator("span").filter({ hasText: "Breakfast" })).toBeVisible();
      await expect(authenticatedPage.getByText("400 kcal")).toBeVisible();
      await expect(authenticatedPage.locator("span").filter({ hasText: "Snack" })).toBeVisible();
      await expect(authenticatedPage.getByText("200 kcal")).toBeVisible();
    });

    test("should show macro breakdown for entries", async ({ authenticatedPage }) => {
      await authenticatedPage.goto("/nutrition");
      await authenticatedPage.waitForLoadState("networkidle");

      await authenticatedPage.getByPlaceholder("Calories").fill("500");
      await authenticatedPage.getByPlaceholder("Protein").fill("35");
      await authenticatedPage.getByPlaceholder("Carbs").fill("45");
      await authenticatedPage.getByPlaceholder("Fat").fill("18");
      await authenticatedPage.getByRole("button", { name: "Log Food" }).click();

      await expect(authenticatedPage.getByText("P: 35g | C: 45g | F: 18g")).toBeVisible();
    });
  });

  test.describe("delete food entry", () => {
    test("should delete a food entry", async ({ authenticatedPage }) => {
      await authenticatedPage.goto("/nutrition");
      await authenticatedPage.waitForLoadState("networkidle");

      // Add an entry
      await authenticatedPage.getByPlaceholder("Calories").fill("350");
      await authenticatedPage.getByPlaceholder("Protein").fill("22");
      await authenticatedPage.getByPlaceholder("Carbs").fill("35");
      await authenticatedPage.getByPlaceholder("Fat").fill("12");
      await authenticatedPage.getByRole("button", { name: "Log Food" }).click();
      await expect(authenticatedPage.getByText("350 kcal")).toBeVisible();

      // Delete the entry
      await authenticatedPage.getByRole("button", { name: "Delete" }).first().click();

      // Entry should be removed
      await expect(authenticatedPage.getByText("350 kcal")).not.toBeVisible();
    });
  });

  test.describe("daily summary", () => {
    test("should show daily totals", async ({ authenticatedPage }) => {
      await authenticatedPage.goto("/nutrition");
      await authenticatedPage.waitForLoadState("networkidle");

      // Log first entry
      await authenticatedPage.getByPlaceholder("Calories").fill("400");
      await authenticatedPage.getByPlaceholder("Protein").fill("30");
      await authenticatedPage.getByPlaceholder("Carbs").fill("40");
      await authenticatedPage.getByPlaceholder("Fat").fill("15");
      await authenticatedPage.getByRole("button", { name: "Log Food" }).click();
      await expect(authenticatedPage.getByText("400 kcal")).toBeVisible();

      // Log second entry
      await authenticatedPage.getByPlaceholder("Calories").fill("600");
      await authenticatedPage.getByPlaceholder("Protein").fill("40");
      await authenticatedPage.getByPlaceholder("Carbs").fill("50");
      await authenticatedPage.getByPlaceholder("Fat").fill("25");
      await authenticatedPage.getByRole("button", { name: "Log Food" }).click();
      await expect(authenticatedPage.getByText("600 kcal")).toBeVisible();

      // Verify totals (400 + 600 = 1000, etc.)
      await expect(authenticatedPage.getByTestId("daily-calories")).toHaveText("1000");
      await expect(authenticatedPage.getByTestId("daily-protein")).toHaveText("70g");
      await expect(authenticatedPage.getByTestId("daily-carbs")).toHaveText("90g");
      await expect(authenticatedPage.getByTestId("daily-fat")).toHaveText("40g");
    });
  });

  test.describe("charts", () => {
    test("should display calorie trend chart", async ({ authenticatedPage }) => {
      await authenticatedPage.goto("/nutrition");
      await authenticatedPage.waitForLoadState("networkidle");

      // Add an entry to enable charts
      await authenticatedPage.getByPlaceholder("Calories").fill("500");
      await authenticatedPage.getByPlaceholder("Protein").fill("30");
      await authenticatedPage.getByPlaceholder("Carbs").fill("50");
      await authenticatedPage.getByPlaceholder("Fat").fill("20");
      await authenticatedPage.getByRole("button", { name: "Log Food" }).click();
      await expect(authenticatedPage.getByText("500 kcal")).toBeVisible();

      // Chart should be visible
      await expect(authenticatedPage.getByTestId("calorie-chart")).toBeVisible();
    });

    test("should display macros bar chart", async ({ authenticatedPage }) => {
      await authenticatedPage.goto("/nutrition");
      await authenticatedPage.waitForLoadState("networkidle");

      // Add an entry to enable charts
      await authenticatedPage.getByPlaceholder("Calories").fill("500");
      await authenticatedPage.getByPlaceholder("Protein").fill("30");
      await authenticatedPage.getByPlaceholder("Carbs").fill("50");
      await authenticatedPage.getByPlaceholder("Fat").fill("20");
      await authenticatedPage.getByRole("button", { name: "Log Food" }).click();
      await expect(authenticatedPage.getByText("500 kcal")).toBeVisible();

      // Chart should be visible
      await expect(authenticatedPage.getByTestId("macros-chart")).toBeVisible();
    });

    test("should toggle chart date range", async ({ authenticatedPage }) => {
      await authenticatedPage.goto("/nutrition");
      await authenticatedPage.waitForLoadState("networkidle");

      // Add an entry
      await authenticatedPage.getByPlaceholder("Calories").fill("500");
      await authenticatedPage.getByPlaceholder("Protein").fill("30");
      await authenticatedPage.getByPlaceholder("Carbs").fill("50");
      await authenticatedPage.getByPlaceholder("Fat").fill("20");
      await authenticatedPage.getByRole("button", { name: "Log Food" }).click();
      await expect(authenticatedPage.getByText("500 kcal")).toBeVisible();

      // Verify 7 days is initially selected (has the elevated bg)
      await expect(authenticatedPage.getByRole("button", { name: "7 days" })).toHaveClass(/bg-surface-elevated/);

      // Toggle to 30 days
      await authenticatedPage.getByRole("button", { name: "30 days" }).click();
      await expect(authenticatedPage.getByRole("button", { name: "30 days" })).toHaveClass(/bg-surface-elevated/);

      // Toggle back to 7 days
      await authenticatedPage.getByRole("button", { name: "7 days" }).click();
      await expect(authenticatedPage.getByRole("button", { name: "7 days" })).toHaveClass(/bg-surface-elevated/);
    });
  });

  test.describe("navigation", () => {
    test("should show nutrition in navigation", async ({ authenticatedPage }) => {
      await authenticatedPage.goto("/current-workout");
      await authenticatedPage.waitForLoadState("networkidle");

      await expect(authenticatedPage.getByRole("link", { name: "Nutrition" })).toBeVisible();
    });

    test("should navigate to nutrition page from sidebar", async ({ authenticatedPage }) => {
      await authenticatedPage.goto("/current-workout");
      await authenticatedPage.waitForLoadState("networkidle");

      await authenticatedPage.getByRole("link", { name: "Nutrition" }).click();

      await expect(authenticatedPage.getByRole("heading", { name: "Nutrition Tracking" })).toBeVisible();
    });
  });

  test.describe("calorie goal", () => {
    test("should set a calorie goal", async ({ authenticatedPage }) => {
      await authenticatedPage.goto("/nutrition");
      await authenticatedPage.waitForLoadState("networkidle");

      // Set calorie goal
      await authenticatedPage.getByPlaceholder("kcal").fill("2000");
      await authenticatedPage.getByRole("button", { name: "Set" }).click();

      // Wait for success indicator
      await expect(authenticatedPage.locator("svg.text-emerald-400")).toBeVisible();
    });

    test("should show calorie deficit when under goal", async ({ authenticatedPage }) => {
      await authenticatedPage.goto("/nutrition");
      await authenticatedPage.waitForLoadState("networkidle");

      // Set calorie goal first
      await authenticatedPage.getByPlaceholder("kcal").fill("2000");
      await authenticatedPage.getByRole("button", { name: "Set" }).click();
      await expect(authenticatedPage.locator("svg.text-emerald-400")).toBeVisible();

      // Log food entry (500 calories - under goal)
      await authenticatedPage.getByPlaceholder("Calories").fill("500");
      await authenticatedPage.getByPlaceholder("Protein").fill("30");
      await authenticatedPage.getByPlaceholder("Carbs").fill("50");
      await authenticatedPage.getByPlaceholder("Fat").fill("20");
      await authenticatedPage.getByRole("button", { name: "Log Food" }).click();
      await expect(authenticatedPage.getByText("500 kcal")).toBeVisible();

      // Should show deficit (2000 - 500 = 1500 deficit)
      await expect(authenticatedPage.getByTestId("calorie-balance")).toContainText("1500 deficit");
    });

    test("should show calorie surplus when over goal", async ({ authenticatedPage }) => {
      await authenticatedPage.goto("/nutrition");
      await authenticatedPage.waitForLoadState("networkidle");

      // Set calorie goal
      await authenticatedPage.getByPlaceholder("kcal").fill("1000");
      await authenticatedPage.getByRole("button", { name: "Set" }).click();
      await expect(authenticatedPage.locator("svg.text-emerald-400")).toBeVisible();

      // Log food entry exceeding goal
      await authenticatedPage.getByPlaceholder("Calories").fill("1500");
      await authenticatedPage.getByPlaceholder("Protein").fill("50");
      await authenticatedPage.getByPlaceholder("Carbs").fill("100");
      await authenticatedPage.getByPlaceholder("Fat").fill("60");
      await authenticatedPage.getByRole("button", { name: "Log Food" }).click();
      await expect(authenticatedPage.getByText("1500 kcal")).toBeVisible();

      // Should show surplus (1500 - 1000 = 500 surplus)
      await expect(authenticatedPage.getByTestId("calorie-balance")).toContainText("+500 surplus");
    });

    test("should persist calorie goal across page reloads", async ({ authenticatedPage }) => {
      await authenticatedPage.goto("/nutrition");
      await authenticatedPage.waitForLoadState("networkidle");

      // Set calorie goal
      await authenticatedPage.getByPlaceholder("kcal").fill("2500");
      await authenticatedPage.getByRole("button", { name: "Set" }).click();
      await expect(authenticatedPage.locator("svg.text-emerald-400")).toBeVisible();

      // Reload page
      await authenticatedPage.reload();
      await authenticatedPage.waitForLoadState("networkidle");

      // Goal should persist
      await expect(authenticatedPage.getByPlaceholder("kcal")).toHaveValue("2500");
    });
  });
});
