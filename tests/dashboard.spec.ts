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

    // Check if metric cards are displayed using data attributes
    const metricCards = page.locator('[data-testid="metric-card"]');
    await expect(metricCards.first()).toBeVisible();

    // Check if metric titles are present (should be 4 cards)
    const metricTitles = page.locator('[data-testid="metric-title"]');
    await expect(metricTitles).toHaveCount(4);

    // Check if metric values are present
    const metricValues = page.locator('[data-testid="metric-value"]');
    await expect(metricValues).toHaveCount(4);

    // Check if trend indicators are present (should be 4 trends)
    const metricTrends = page.locator('[data-testid="metric-trend"]');
    await expect(metricTrends).toHaveCount(4);
  });

  test("should display usage trends chart", async ({ page }) => {
    await page.goto("/dashboard/overview");

    // Check if chart container is present using data attribute
    await expect(page.locator('[data-testid="usage-chart"]')).toBeVisible();

    // Check if chart title is present
    await expect(page.locator('[data-testid="chart-title"]')).toBeVisible();

    // Check if chart container is present
    await expect(page.locator('[data-testid="chart-container"]')).toBeVisible();

    // Check if Recharts responsive container is present (implementation detail)
    await expect(page.locator(".recharts-responsive-container")).toBeVisible();
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

  test("should have proper metric card structure", async ({ page }) => {
    await page.goto("/dashboard/overview");

    // Get all metric cards
    const metricCards = page.locator('[data-testid="metric-card"]');
    const cardCount = await metricCards.count();

    // Verify each card has the required structure
    for (let i = 0; i < cardCount; i++) {
      const card = metricCards.nth(i);

      // Each card should have a title
      await expect(card.locator('[data-testid="metric-title"]')).toBeVisible();

      // Each card should have a value
      await expect(card.locator('[data-testid="metric-value"]')).toBeVisible();

      // Check if trend section exists (should be present in all cards)
      const trendSection = card.locator('[data-testid="metric-trend"]');
      await expect(trendSection).toBeVisible();

      // Trend section should have trend value
      await expect(
        trendSection.locator('[data-testid="metric-trend-value"]'),
      ).toBeVisible();
    }
  });
});
