import { test, expect } from "@playwright/test";

test.describe("Sets", () => {
  test.describe("create", () => {
    test.skip("should add a set to the current workout", async ({ page }) => {
      // TODO: Implement this test
    });

    test.skip("should require movement, weight, and reps to add a set", async ({ page }) => {
      // TODO: Implement this test
    });

    test.skip("should display the new set in the workout", async ({ page }) => {
      // TODO: Implement this test
    });
  });

  test.describe("read", () => {
    test.skip("should display sets with movement name, weight, and reps", async ({ page }) => {
      // TODO: Implement this test
    });

    test.skip("should show sets in the order they were added", async ({ page }) => {
      // TODO: Implement this test
    });
  });

  test.describe("delete", () => {
    test.skip("should remove a set from the current workout", async ({ page }) => {
      // TODO: Implement this test
    });

    test.skip("should update the sets list after deletion", async ({ page }) => {
      // TODO: Implement this test
    });
  });
});
