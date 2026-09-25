import { test, expect, type Page, type Request } from "@playwright/test";
import { mockAuthentication } from "./auth-helper";

// YYYY-MM-DD, n days before today in UTC (the API's day buckets are UTC).
function daysAgo(n: number) {
  return new Date(Date.now() - n * 86_400_000).toISOString().slice(0, 10);
}

// The day as the table labels it, e.g. "Sep 25".
function label(day: string) {
  return new Date(`${day}T00:00:00Z`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

// Answers /api/analytics/summary; `request` resolves with the request it
// answered.
async function mockAnalyticsSummary(page: Page, dailyBuckets: object[]) {
  let answered!: (request: Request) => void;
  const request = new Promise<Request>((resolve) => (answered = resolve));
  await page.route("**/api/analytics/summary**", (route) => {
    answered(route.request());
    return route.fulfill({ json: { dailyBuckets } });
  });
  return { request };
}

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
  // users (#112). It shows only what the API reports.
  test("overview shows no invented usage numbers", async ({ page }) => {
    await mockAnalyticsSummary(page, []);
    await page.goto("/dashboard/overview");
    await expect(page.locator('h1:text("Dashboard Overview")')).toBeVisible();
    await expect(page.getByTestId("requests-per-day")).toBeVisible();
    await expect(page.getByTestId("metric-card")).toHaveCount(0);
    await expect(page.getByTestId("usage-chart")).toHaveCount(0);
    for (const mockValue of ["125,847", "251,694", "892,341", "-5.2"]) {
      await expect(page.locator("body")).not.toContainText(mockValue);
    }
  });

  // #119: requests per day, successful vs failed, from /api/analytics/summary.
  test("overview shows requests per day for the last 30 days", async ({
    page,
  }) => {
    const summary = await mockAnalyticsSummary(page, [
      // Postgres returns DATE_TRUNC as a timestamp and COUNT as a string.
      {
        date: `${daysAgo(2)}T00:00:00.000Z`,
        call_count: "1200",
        error_count: "7",
      },
      { date: daysAgo(0), call_count: 40, error_count: 0 },
    ]);
    await page.goto("/dashboard/overview");

    const widget = page.getByTestId("requests-per-day");
    await expect(widget.getByRole("heading")).toHaveText("Requests per day");
    await expect(widget.getByTestId("requests-total")).toHaveText(
      "1,240 requests in the last 30 days: 1,233 successful, 7 failed",
    );

    // One row per day, zero-filled where the API has no bucket.
    const rows = widget.locator("table tbody tr");
    await expect(rows).toHaveCount(30);
    await expect(rows.last()).toContainText(label(daysAgo(0)));
    await expect(rows.last()).toContainText("40");
    await expect(rows.nth(27)).toContainText("1,193");
    await expect(rows.nth(27)).toContainText("7");
    await expect(rows.nth(28).locator("td")).toHaveText(["0", "0"]);

    const request = await summary.request;
    expect(new URL(request.url()).searchParams.get("days")).toBe("30");
    expect(request.headers()["authorization"]).toBe("Bearer mock-access-token");
  });

  test("overview says so when there are no requests yet", async ({ page }) => {
    await mockAnalyticsSummary(page, []);
    await page.goto("/dashboard/overview");
    await expect(page.getByTestId("requests-total")).toHaveText(
      "No requests in the last 30 days.",
    );
  });

  test("overview says so when requests can't be loaded", async ({ page }) => {
    await page.route("**/api/analytics/summary**", (route) =>
      route.fulfill({ status: 500, json: { message: "boom" } }),
    );
    await page.goto("/dashboard/overview");
    await expect(page.getByTestId("requests-error")).toHaveText(
      "Requests per day couldn't be loaded. Try again later.",
    );
    await expect(page.getByTestId("requests-total")).toHaveCount(0);
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
