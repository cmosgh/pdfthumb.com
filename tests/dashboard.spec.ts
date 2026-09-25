import { test, expect } from "@playwright/test";
import { mockAuthentication } from "./auth-helper";

test.describe("Dashboard Navigation", () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication before each test
    await mockAuthentication(page);
  });

  test("should navigate to dashboard and display layout", async ({ page }) => {
    await page.goto("/dashboard");

    // Check if dashboard layout is visible - use specific selector for sidebar title
    await expect(page.locator('aside h2:text("Dashboard")')).toBeVisible();

    // Check if sidebar navigation links are present
    await expect(page.locator('aside a:has-text("Overview")')).toBeVisible();
    await expect(page.locator('aside a:has-text("Settings")')).toBeVisible();
    // Analytics showed invented data; it's hidden until the rework (#112).
    await expect(page.locator('aside a:has-text("Analytics")')).toHaveCount(0);
  });

  test("should navigate between dashboard sections", async ({ page }) => {
    await page.goto("/dashboard");

    // Navigate to Overview
    await page.click('aside a:has-text("Overview")');
    await expect(page.locator('h1:text("Dashboard Overview")')).toBeVisible();

    // Navigate to Settings
    await page.click('aside a:has-text("Settings")');
    await expect(page.locator('h1:text("Settings")')).toBeVisible();
  });

  // Overview used to render mock totals and Math.random() trends to real
  // users (#112). Until real usage data exists, it shows none.
  test("overview shows no invented usage numbers", async ({ page }) => {
    await page.goto("/dashboard/overview");
    await expect(page.locator('h1:text("Dashboard Overview")')).toBeVisible();
    await expect(page.getByTestId("usage-coming-soon")).toBeVisible();
    await expect(page.getByTestId("metric-card")).toHaveCount(0);
    await expect(page.getByTestId("usage-chart")).toHaveCount(0);
    for (const mockValue of ["125,847", "251,694", "892,341", "-5.2"]) {
      await expect(page.locator("body")).not.toContainText(mockValue);
    }
  });

  test("the Analytics URL leads back to the overview", async ({ page }) => {
    await page.goto("/dashboard/analytics");
    await expect(page).toHaveURL(/\/dashboard\/overview$/);
    await expect(page.locator('h1:text("Dashboard Overview")')).toBeVisible();
    await expect(page.getByTestId("usage-by-file-type-chart")).toHaveCount(0);
  });

  test("should be responsive on mobile", async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/dashboard");

    // Check if mobile menu button is visible - use the first button in the mobile header
    await expect(page.locator("div.md\\:hidden button").first()).toBeVisible();

    // Check if sidebar is hidden by default on mobile
    const sidebar = page.locator("aside");
    await expect(sidebar).not.toBeInViewport();
  });
});
