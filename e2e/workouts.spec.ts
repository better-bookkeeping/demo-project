import { test, expect } from "@playwright/test";

test.describe("Workouts", () => {
  test.describe("create", () => {
    test.skip("should start a new workout from the current workout page", async ({ page }) => {
      // TODO: Implement this test
    });

    test.skip("should show the workout date after starting", async ({ page }) => {
      // TODO: Implement this test
    });
  });

  test.describe("read", () => {
    test.skip("should display the current active workout", async ({ page }) => {
      // TODO: Implement this test
    });

    test.skip("should show 'No active workout' when none exists", async ({ page }) => {
      // TODO: Implement this test
    });

    test.skip("should display completed workouts in workout history", async ({ page }) => {
      // TODO: Implement this test
    });
  });

  test.describe("complete", () => {
    test.skip("should mark the current workout as completed", async ({ page }) => {
      // TODO: Implement this test
    });

    test.skip("should move completed workout to history", async ({ page }) => {
      // TODO: Implement this test
    });
  });

  test.describe("delete", () => {
    test.skip("should delete selected workouts from history", async ({ page }) => {
      // TODO: Implement this test
    });

    test.skip("should allow selecting multiple workouts for deletion", async ({ page }) => {
      // TODO: Implement this test
    });
  });
});
