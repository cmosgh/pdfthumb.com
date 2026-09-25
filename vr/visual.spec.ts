import { test, expect } from "@playwright/test";
import { mockAuthentication } from "../tests/auth-helper";

// Visual regression for #137; see vr/README.md.
const PAGES: [string, string, boolean][] = [
  ["home", "/", false],
  ["docs", "/docs", false],
  ["login", "/login", false],
  ["status", "/status", false],
  ["terms", "/terms", false],
  ["notfound", "/nope", false],
  ["overview", "/dashboard/overview", true],
  ["settings", "/dashboard/settings", true],
];

for (const [name, path, authed] of PAGES)
  for (const width of [390, 1280])
    for (const scheme of ["light", "dark"] as const)
      test(`${name} ${width} ${scheme}`, async ({ page }) => {
        await page.clock.setFixedTime(new Date("2026-09-25T12:00:00Z"));
        await page.emulateMedia({
          colorScheme: scheme,
          reducedMotion: "reduce",
        });
        await page.setViewportSize({ width, height: authed ? 1600 : 900 });
        if (authed) await mockAuthentication(page);
        await page.route("**/api/health/*", (r) =>
          r.fulfill({ json: { status: "ok" } }),
        );
        await page.route("**/api/users/*/subscription", (r) =>
          r.fulfill({
            json: {
              currentMonthlyUsage: 640,
              currentPeriodEnd: "2026-10-16T00:00:00.000Z",
              subscriptionType: {
                name: "Free",
                monthlyThumbnailLimit: 1000,
                isHardLimit: true,
              },
            },
          }),
        );
        await page.route("**/api/analytics/summary**", (r) =>
          r.fulfill({
            json: {
              dailyBuckets: [
                { date: "2026-09-17", call_count: 200, error_count: 10 },
                { date: "2026-09-22", call_count: 150, error_count: 5 },
                { date: "2026-09-24", call_count: 100, error_count: 0 },
              ],
            },
          }),
        );
        await page.route("**/api/api-key", (r) =>
          r.fulfill({
            json: [
              {
                id: "k1",
                name: "Production",
                identifier: "ptk_abcd",
                createdAt: "2026-08-01T00:00:00Z",
                expiresAt: null,
                lastUsedAt: "2026-09-20T00:00:00Z",
                enabled: true,
              },
              {
                id: "k2",
                name: "Old key",
                identifier: "ptk_ef12",
                createdAt: "2026-07-01T00:00:00Z",
                expiresAt: null,
                enabled: false,
              },
            ],
          }),
        );
        await page.goto(path);
        await page.locator("footer").waitFor();
        await page.evaluate(() => document.fonts.ready);
        await page.waitForTimeout(400);
        await expect(page).toHaveScreenshot(`${name}-${width}-${scheme}.png`, {
          fullPage: true,
          animations: "disabled",
          maxDiffPixelRatio: 0,
        });
      });
