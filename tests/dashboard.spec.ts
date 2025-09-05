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

    // Check if new metric cards are displayed with proper titles
    await expect(page.locator('text="Total PDFs Processed"')).toBeVisible();
    await expect(
      page.locator('text="Total Thumbnails Generated"'),
    ).toBeVisible();
    await expect(page.locator('text="Total API Calls"')).toBeVisible();
    await expect(page.locator('text="Monthly Growth"')).toBeVisible();

    // Check if metric values are displayed
    await expect(page.locator('text="125,847"')).toBeVisible();
    await expect(page.locator('text="251,694"')).toBeVisible();
    await expect(page.locator('text="892,341"')).toBeVisible();
    await expect(page.locator('text="15.3"')).toBeVisible();
  });

  test("should display usage trends chart", async ({ page }) => {
    await page.goto("/dashboard/overview");

    // Check if chart title is visible
    await expect(
      page.locator('text="Usage Trends - Last 15 Days"'),
    ).toBeVisible();

    // Check if chart container is present
    await expect(page.locator(".recharts-responsive-container")).toBeVisible();

    // Check if chart legend is present
    await expect(page.locator('text="pdfsProcessed"')).toBeVisible();
    await expect(page.locator('text="thumbnailsGenerated"')).toBeVisible();
    await expect(page.locator('text="apiCalls"')).toBeVisible();
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
