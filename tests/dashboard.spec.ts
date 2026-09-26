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

// Answers /api/users/:id/subscription with `subscription` (null: the empty
// 200 the API sends when there is none); `request` resolves with the request.
async function mockSubscription(page: Page, subscription: object | null) {
  let answered!: (request: Request) => void;
  const request = new Promise<Request>((resolve) => (answered = resolve));
  await page.route("**/api/users/*/subscription", (route) => {
    answered(route.request());
    return subscription
      ? route.fulfill({ json: subscription })
      : route.fulfill({ status: 200, body: "" });
  });
  return { request };
}

// Answers GET /api/api-key with `keys`; `request` resolves with the request.
async function mockApiKeys(page: Page, keys: object[]) {
  let answered!: (request: Request) => void;
  const request = new Promise<Request>((resolve) => (answered = resolve));
  await page.route("**/api/api-key", (route) => {
    answered(route.request());
    return route.fulfill({ json: keys });
  });
  return { request };
}

function apiKey(lastUsedAt?: string) {
  return {
    id: "key-1",
    name: "Production",
    identifier: "pt_live****abcd",
    createdAt: "2026-09-20T10:00:00.000Z",
    expiresAt: null,
    lastUsedAt: lastUsedAt ?? null,
    enabled: true,
  };
}

function subscription(
  plan: { name: string; monthlyThumbnailLimit: number; isHardLimit: boolean },
  used: number,
) {
  return {
    id: "sub-1",
    userId: "test-user-123",
    currentMonthlyUsage: used,
    currentPeriodStart: "2026-09-16T00:00:00.000Z",
    currentPeriodEnd: "2026-10-16T00:00:00.000Z",
    status: "active",
    subscriptionType: {
      id: "type-1",
      description: "For trying the API",
      rateLimitPerMinute: 10,
      maxPdfSizeMB: 10,
      zipPageCap: 20,
      overusageCostPerThumbnail: plan.isHardLimit ? null : "0.0040",
      ...plan,
    },
  };
}

// 2026-09-25 12:00 UTC: 20.5 days before the period ends.
const NOW = new Date("2026-09-25T12:00:00Z");

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
    await expect(page.locator('aside a:has-text("Usage")')).toBeVisible();
    // Analytics showed invented data (#112); Usage replaced it (#120).
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
      { date: daysAgo(2), call_count: 1200, error_count: 7 },
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

  // #119: the plan, its quota and when it resets, from the subscription.
  test("overview shows the plan and its quota", async ({ page }) => {
    await page.clock.setFixedTime(NOW);
    const sub = await mockSubscription(
      page,
      subscription(
        { name: "Free", monthlyThumbnailLimit: 1000, isHardLimit: true },
        640,
      ),
    );
    await page.goto("/dashboard/overview");

    const widget = page.getByTestId("plan-quota");
    await expect(widget.getByTestId("plan-quota-summary")).toHaveText(
      "Free · 640 of 1,000 Thumbnails used · resets 16 Oct (in 21 days)",
    );
    await expect(widget.getByTestId("plan-quota-limit")).toHaveText(
      "Hard limit: requests past the quota are refused until it resets.",
    );
    const bar = widget.getByRole("progressbar");
    await expect(bar).toHaveAttribute("aria-valuenow", "640");
    await expect(bar).toHaveAttribute("aria-valuemax", "1000");

    const request = await sub.request;
    expect(new URL(request.url()).pathname).toBe(
      "/api/users/test-user-123/subscription",
    );
    expect(request.headers()["authorization"]).toBe("Bearer mock-access-token");
  });

  // ICU prints "Sept" for September in en-GB; the reset day says "Sep".
  test("a September reset day reads Sep", async ({ page }) => {
    await page.clock.setFixedTime(new Date("2026-09-01T12:00:00Z"));
    await mockSubscription(page, {
      ...subscription(
        { name: "Free", monthlyThumbnailLimit: 1000, isHardLimit: true },
        10,
      ),
      currentPeriodEnd: "2026-09-16T00:00:00.000Z",
    });
    await page.goto("/dashboard/overview");

    await expect(page.getByTestId("plan-quota-summary")).toHaveText(
      "Free · 10 of 1,000 Thumbnails used · resets 16 Sep (in 15 days)",
    );
  });

  test("a plan with overage says so, without the price", async ({ page }) => {
    await page.clock.setFixedTime(NOW);
    await mockSubscription(
      page,
      subscription(
        { name: "Basic", monthlyThumbnailLimit: 10000, isHardLimit: false },
        10400,
      ),
    );
    await page.goto("/dashboard/overview");

    const widget = page.getByTestId("plan-quota");
    await expect(widget.getByTestId("plan-quota-summary")).toHaveText(
      "Basic · 10,400 of 10,000 Thumbnails used · resets 16 Oct (in 21 days)",
    );
    await expect(widget.getByTestId("plan-quota-limit")).toHaveText(
      "Past the quota, each Thumbnail is billed as overage.",
    );
    // Prices aren't public.
    await expect(widget).not.toContainText("0.004");
    await expect(widget).not.toContainText("€");
    // A bar can't run past full.
    await expect(widget.getByRole("progressbar")).toHaveAttribute(
      "aria-valuenow",
      "10000",
    );
    // Past the limit there's nothing left to project to (#143).
    await expect(widget.getByTestId("plan-quota-projection")).toHaveCount(0);
  });

  test("overview says so when there is no plan", async ({ page }) => {
    await mockSubscription(page, null);
    await page.goto("/dashboard/overview");
    await expect(page.getByTestId("plan-quota-empty")).toHaveText(
      "You don't have a plan yet. See plans",
    );
    await expect(
      page.getByTestId("plan-quota-empty").getByRole("link"),
    ).toHaveAttribute("href", "/#pricing");
    await expect(page.getByTestId("plan-quota-summary")).toHaveCount(0);
  });

  test("overview says so when the plan can't be loaded", async ({ page }) => {
    await page.route("**/api/users/*/subscription", (route) =>
      route.fulfill({ status: 500, json: { message: "boom" } }),
    );
    await page.goto("/dashboard/overview");
    await expect(page.getByTestId("plan-quota-error")).toHaveText(
      "Your plan couldn't be loaded. Try again later.",
    );
    await expect(page.getByTestId("plan-quota-summary")).toHaveCount(0);
  });

  // #143: where the month is heading at this period's rate, marked on the bar.
  test("a projection under the limit is marked, with no warning", async ({
    page,
  }) => {
    await page.clock.setFixedTime(NOW);
    // 200 in 9.5 of 30 days: about 632 by the reset.
    await mockSubscription(
      page,
      subscription(
        { name: "Free", monthlyThumbnailLimit: 1000, isHardLimit: true },
        200,
      ),
    );
    await page.goto("/dashboard/overview");

    const widget = page.locator("main main").getByTestId("plan-quota");
    const projection = widget.getByTestId("plan-quota-projection");
    await expect(projection).toHaveText(
      "At this rate you'll use about 632 of 1,000 by 16 Oct.",
    );
    await expect(widget).not.toContainText("you'll reach");
    const bar = widget.getByRole("progressbar");
    await expect(bar).toHaveAccessibleDescription(
      "At this rate you'll use about 632 of 1,000 by 16 Oct.",
    );
    const marker = widget.getByTestId("plan-quota-projection-marker");
    await expect(marker).toBeAttached();
    await expect(marker).toHaveAttribute("style", /left: 63\.2%/);
  });

  test("a projection over the limit says when it's reached", async ({
    page,
  }) => {
    await page.clock.setFixedTime(NOW);
    // 400 in 9.5 days: 1,000 after 23.75 days, on 9 Oct.
    await mockSubscription(
      page,
      subscription(
        { name: "Free", monthlyThumbnailLimit: 1000, isHardLimit: true },
        400,
      ),
    );
    await page.goto("/dashboard/overview");

    const widget = page.locator("main main").getByTestId("plan-quota");
    await expect(widget.getByTestId("plan-quota-projection")).toHaveText(
      "At this rate you'll reach 1,000 around 9 Oct.",
    );
    await expect(widget.getByRole("progressbar")).toHaveAccessibleDescription(
      "At this rate you'll reach 1,000 around 9 Oct.",
    );
    await expect(
      widget.getByTestId("plan-quota-projection-marker"),
    ).toHaveAttribute("style", /left: 100%/);
  });

  test("no projection in the first 3 days of a period", async ({ page }) => {
    // 2.5 days in
    await page.clock.setFixedTime(new Date("2026-09-18T12:00:00Z"));
    await mockSubscription(
      page,
      subscription(
        { name: "Free", monthlyThumbnailLimit: 1000, isHardLimit: true },
        300,
      ),
    );
    await page.goto("/dashboard/overview");

    const widget = page.locator("main main").getByTestId("plan-quota");
    await expect(widget.getByTestId("plan-quota-summary")).toHaveText(
      "Free · 300 of 1,000 Thumbnails used · resets 16 Oct (in 28 days)",
    );
    await expect(widget.getByTestId("plan-quota-projection")).toHaveCount(0);
    await expect(
      widget.getByTestId("plan-quota-projection-marker"),
    ).toHaveCount(0);
  });

  // #143: a checklist to the first thumbnail, ticked from the key list and
  // the requests the chart shows.
  test("a new user without a key sees the checklist, step 1 open", async ({
    page,
  }) => {
    await mockApiKeys(page, []);
    await mockAnalyticsSummary(page, []);
    await page.goto("/dashboard/overview");

    const checklist = page.locator("main main").getByTestId("first-thumbnail");
    await expect(checklist.getByRole("heading")).toHaveText(
      "Your first thumbnail",
    );
    const steps = checklist.getByRole("listitem");
    await expect(steps).toHaveCount(3);
    await expect(steps.nth(0)).toHaveText("To do: Create an API key");
    await expect(steps.nth(1)).toHaveText("To do: Make your first request");
    await expect(steps.nth(2)).toHaveText("To do: See it on the chart below");
    await expect(steps.nth(0).getByRole("link")).toHaveAttribute(
      "href",
      "/dashboard/settings",
    );
    await expect(steps.nth(1).getByRole("link")).toHaveAttribute(
      "href",
      "/docs#first-request",
    );
  });

  test("a key that hasn't been used ticks step 1 only", async ({ page }) => {
    await mockApiKeys(page, [apiKey()]);
    await mockAnalyticsSummary(page, []);
    await page.goto("/dashboard/overview");

    const steps = page
      .locator("main main")
      .getByTestId("first-thumbnail")
      .getByRole("listitem");
    await expect(steps.nth(0)).toHaveText("Done: Create an API key");
    await expect(steps.nth(1)).toHaveText("To do: Make your first request");
    await expect(steps.nth(2)).toHaveText("To do: See it on the chart below");
  });

  test("the checklist hides once a request succeeded", async ({ page }) => {
    const keys = await mockApiKeys(page, [apiKey(`${daysAgo(0)}T08:00:00Z`)]);
    const summary = await mockAnalyticsSummary(page, [
      { date: daysAgo(0), call_count: 3, error_count: 1 },
    ]);
    await page.goto("/dashboard/overview");

    await keys.request;
    await summary.request;
    await expect(page.getByTestId("requests-total")).toHaveText(
      "3 requests in the last 30 days: 2 successful, 1 failed",
    );
    await expect(
      page.locator("main main").getByTestId("first-thumbnail"),
    ).toHaveCount(0);
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
