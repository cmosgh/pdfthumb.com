import { test, expect, type Page, type Request } from "@playwright/test";
import { mockAuthentication } from "./auth-helper";

// #120: the Usage page. Every plan sees its own usage; Pro Analytics adds
// response times, up to 13 months of history and a CSV export, and lower
// plans see those locked.

// 2026-09-25 12:00 UTC: 9.5 days into a period of 30 (Sep 16 to Oct 16).
const NOW = new Date("2026-09-25T12:00:00Z");

// YYYY-MM-DD, n days before NOW (the API's day buckets are UTC).
function daysAgo(n: number) {
  return new Date(NOW.getTime() - n * 86_400_000).toISOString().slice(0, 10);
}

function subscription(
  plan: {
    name: string;
    monthlyThumbnailLimit: number;
    isHardLimit: boolean;
    features?: string[];
  },
  used: number,
) {
  return {
    currentMonthlyUsage: used,
    currentPeriodStart: "2026-09-16T00:00:00.000Z",
    currentPeriodEnd: "2026-10-16T00:00:00.000Z",
    inForce: true,
    status: "active",
    subscriptionType: {
      rateLimitPerMinute: 10,
      maxPdfSizeMB: 10,
      zipPageCap: 20,
      overusageCostPerThumbnail: plan.isHardLimit ? null : "0.0040",
      features: [],
      ...plan,
    },
  };
}

const FREE = { name: "Free", monthlyThumbnailLimit: 1000, isHardLimit: true };
const STARTER = {
  name: "Starter",
  monthlyThumbnailLimit: 1000,
  isHardLimit: false,
};
const PRO = {
  name: "Pro",
  monthlyThumbnailLimit: 100_000,
  isHardLimit: false,
  features: ["analytics_pro"],
};

function summary(pro: boolean) {
  const timing = (p50: number, p95: number) =>
    pro ? { p50_duration_ms: p50, p95_duration_ms: p95 } : {};
  return {
    dailyBuckets: [
      {
        date: daysAgo(2),
        call_count: 1200,
        error_count: 7,
        avg_duration_ms: 310,
        unique_api_keys: 2,
        thumbnails_page: 900,
        thumbnails_zip: 2400,
        ...timing(250, 820),
      },
      {
        date: daysAgo(0),
        call_count: 40,
        error_count: 3,
        avg_duration_ms: 290,
        unique_api_keys: 1,
        thumbnails_page: 37,
        thumbnails_zip: 0,
        ...timing(240, 700),
      },
    ],
    byApiKey: [
      {
        apiKeyId: "key-prod",
        requests: 1100,
        failures: 4,
        lastUsedAt: "2026-09-25T10:00:00Z",
      },
      {
        apiKeyId: "key-gone",
        requests: 100,
        failures: 3,
        lastUsedAt: "2026-09-20T10:00:00Z",
      },
      {
        apiKeyId: null,
        requests: 40,
        failures: 3,
        lastUsedAt: "2026-09-23T10:00:00Z",
      },
    ],
    failuresByCode: [
      { code: "RATE_LIMITED", count: 6 },
      { code: "FILE_TOO_LARGE", count: 3 },
      { code: null, count: 1 },
    ],
    ...(pro ? { features: ["analytics_pro"] } : {}),
  };
}

// Answers the summary, the subscription and the key list; `summaries`
// collects the summary requests.
async function mockUsage(
  page: Page,
  plan: Parameters<typeof subscription>[0],
  used: number,
) {
  const pro = plan.features?.includes("analytics_pro") ?? false;
  const summaries: Request[] = [];
  await page.route("**/api/analytics/summary**", (route) => {
    summaries.push(route.request());
    return route.fulfill({ json: summary(pro) });
  });
  await page.route("**/api/users/*/subscription", (route) =>
    route.fulfill({ json: subscription(plan, used) }),
  );
  await page.route("**/api/api-key", (route) =>
    route.fulfill({
      json: [
        {
          id: "key-prod",
          name: "Production",
          identifier: "pt_…abcd",
          createdAt: "2026-09-01T00:00:00Z",
          expiresAt: null,
          enabled: true,
        },
      ],
    }),
  );
  return { summaries };
}

test.describe("Usage page", () => {
  test.beforeEach(async ({ page }) => {
    await mockAuthentication(page);
    await page.clock.setFixedTime(NOW);
  });

  test("the sidebar links to Usage, and the old Analytics URL leads there", async ({
    page,
  }) => {
    await mockUsage(page, FREE, 640);
    await page.goto("/dashboard/analytics");
    await expect(page).toHaveURL(/\/dashboard\/usage$/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Usage");
    await expect(page.locator('aside a:has-text("Usage")')).toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  test("every plan sees its usage for the last 30 days", async ({ page }) => {
    const { summaries } = await mockUsage(page, FREE, 640);
    await page.goto("/dashboard/usage");

    await expect(page.getByTestId("plan-quota-summary")).toHaveText(
      "Free · 640 of 1,000 Thumbnails used · resets 16 Oct (in 21 days)",
    );
    // A hard limit has no overage, and the quota line already says so.
    await expect(page.getByTestId("plan-quota-limit")).toBeVisible();
    await expect(page.getByTestId("overage")).toHaveCount(0);

    await expect(page.getByTestId("requests-total")).toHaveText(
      "1,240 requests in the last 30 days: 1,230 successful, 10 failed",
    );

    const thumbnails = page.getByTestId("thumbnails-per-day");
    await expect(thumbnails.getByTestId("thumbnails-total")).toHaveText(
      "3,337 Thumbnails in the last 30 days: 937 from page requests, 2,400 from ZIPs",
    );
    const rows = thumbnails.locator("table tbody tr");
    await expect(rows).toHaveCount(30);
    await expect(rows.nth(27).locator("td")).toHaveText(["900", "2,400"]);
    await expect(rows.nth(28).locator("td")).toHaveText(["0", "0"]);

    // Busiest first; names joined from the key list.
    const keys = page.getByTestId("usage-by-key").locator("tbody tr");
    await expect(keys).toHaveCount(3);
    await expect(keys.nth(0).locator("th, td")).toHaveText([
      "Production",
      "1,100",
      "4",
      "25 Sep",
    ]);
    await expect(keys.nth(1).locator("th")).toHaveText("Deleted key");
    await expect(keys.nth(2).locator("th")).toHaveText("No API key");

    // Each known code links to its row in the docs.
    const failures = page.getByTestId("failures-by-reason").locator("tbody tr");
    await expect(failures).toHaveCount(3);
    await expect(failures.nth(0)).toContainText("RATE_LIMITED");
    await expect(failures.nth(0)).toContainText("429");
    await expect(failures.nth(0)).toContainText("6");
    await expect(failures.nth(0).getByRole("link")).toHaveAttribute(
      "href",
      "/docs#error-RATE_LIMITED",
    );
    await expect(failures.nth(2)).toContainText("Unknown");
    await expect(failures.nth(2).getByRole("link")).toHaveCount(0);

    // Pro Analytics is shown locked, not hidden.
    const locked = page.getByTestId("pro-analytics-locked");
    await expect(locked).toContainText("p50 and p95 response times");
    await expect(locked).toContainText("13 months");
    await expect(locked).toContainText("CSV export");
    await expect(locked.getByRole("link")).toHaveAttribute("href", "/pricing");
    await expect(page.getByTestId("response-times")).toHaveCount(0);
    await expect(page.getByRole("button", { name: /CSV/ })).toHaveCount(0);
    await expect(page.getByRole("tab", { name: "13 months" })).toHaveCount(0);

    expect(summaries.length).toBeGreaterThan(0);
    for (const request of summaries) {
      expect(new URL(request.url()).searchParams.get("days")).toBe("30");
    }
  });

  test("a plan with overage shows it so far and projected, not billed yet", async ({
    page,
  }) => {
    // 1,900 used 9.5 days into 30: about 6,000 by the reset.
    await mockUsage(page, STARTER, 1900);
    await page.goto("/dashboard/usage");
    await expect(page.getByTestId("overage")).toHaveText(
      "Overage: 900 Thumbnails so far, about 5,000 by 16 Oct at this pace. Billing isn't live yet, so nothing is charged.",
    );
  });

  test("Pro sees response times, 13 months of history and a CSV export", async ({
    page,
  }) => {
    const { summaries } = await mockUsage(page, PRO, 5000);
    let exported: Request | undefined;
    await page.route("**/api/analytics/export.csv**", (route) => {
      exported = route.request();
      return route.fulfill({
        body: "date,call_count\n",
        headers: {
          "content-type": "text/csv",
          "content-disposition": 'attachment; filename="usage.csv"',
        },
      });
    });
    await page.goto("/dashboard/usage");

    await expect(page.getByTestId("pro-analytics-locked")).toHaveCount(0);
    const times = page.getByTestId("response-times");
    await expect(
      times.locator("table tbody tr").nth(27).locator("td"),
    ).toHaveText(["250", "820"]);

    await page.getByRole("tab", { name: "13 months" }).click();
    await expect(page.getByTestId("requests-total")).toContainText(
      "in the last 13 months",
    );
    await expect
      .poll(() =>
        summaries.map((r) => new URL(r.url()).searchParams.get("days")),
      )
      .toContain("395");

    const download = page.waitForEvent("download");
    await page.getByRole("button", { name: "Download CSV" }).click();
    expect((await download).suggestedFilename()).toMatch(/\.csv$/);
    expect(new URL(exported!.url()).searchParams.get("days")).toBe("395");
    expect(exported!.headers()["authorization"]).toBe(
      "Bearer mock-access-token",
    );
  });

  test("the docs give each error code an anchor", async ({ page }) => {
    await page.goto("/docs#error-RATE_LIMITED");
    await expect(page.locator("#error-RATE_LIMITED")).toContainText("429");
  });
});
