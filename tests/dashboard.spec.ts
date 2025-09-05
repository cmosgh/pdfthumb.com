import { test, expect } from "@playwright/test";

test.describe("Dashboard Navigation", () => {
  test("should navigate to dashboard and display layout", async ({ page }) => {
    await page.goto("/dashboard");

    // Check if dashboard layout is visible - use specific selector for sidebar title
    await expect(page.locator('aside h2:text("Dashboard")')).toBeVisible();

    // Check if sidebar navigation links are present
    await expect(page.locator('aside a:has-text("Overview")')).toBeVisible();
    await expect(page.locator('aside a:has-text("Analytics")')).toBeVisible();
    await expect(page.locator('aside a:has-text("Settings")')).toBeVisible();
  });

  test("should navigate between dashboard sections", async ({ page }) => {
    await page.goto("/dashboard");

    // Navigate to Overview
    await page.click('aside a:has-text("Overview")');
    await expect(page.locator('h1:text("Dashboard Overview")')).toBeVisible();

    // Navigate to Analytics
    await page.click('aside a:has-text("Analytics")');
    await expect(page.locator('h1:text("Analytics")')).toBeVisible();

    // Navigate to Settings
    await page.click('aside a:has-text("Settings")');
    await expect(page.locator('h1:text("Settings")')).toBeVisible();
  });

  test("should display overview metrics", async ({ page }) => {
    await page.goto("/dashboard/overview");

    // Check if metric cards are displayed
    await expect(page.locator('h3:text("Total API Calls")')).toBeVisible();
    await expect(page.locator('h3:text("Active Projects")')).toBeVisible();
    await expect(page.locator('h3:text("Storage Used")')).toBeVisible();
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
