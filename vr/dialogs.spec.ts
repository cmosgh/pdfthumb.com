import { test, expect, Page, Locator } from "@playwright/test";
import { mockAuthentication } from "../tests/auth-helper";

// Visual regression for the states a page load doesn't reach: open dialogs,
// the admin page, and hover/focus on primary buttons (#146); see
// vr/README.md. Same clock, mocks and settle as vr/visual.spec.ts.
const NOW = "2026-09-25T12:00:00Z";
const SCHEMES = ["light", "dark"] as const;
const WIDTHS = [390, 1280];

async function setup(
  page: Page,
  scheme: (typeof SCHEMES)[number],
  width: number,
  authed: boolean,
) {
  await page.clock.setFixedTime(new Date(NOW));
  await page.emulateMedia({ colorScheme: scheme, reducedMotion: "reduce" });
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
}

async function settle(page: Page) {
  await page.locator("footer").waitFor();
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(400);
}

const shot = (page: Page, name: string) =>
  expect(page).toHaveScreenshot(name, {
    fullPage: true,
    animations: "disabled",
    maxDiffPixelRatio: 0,
  });

// The element plus room for its focus ring and shadow.
async function shotAround(page: Page, target: Locator, name: string) {
  const box = await target.boundingBox();
  if (!box) throw new Error(`${name}: target not visible`);
  const pad = 16;
  await expect(page).toHaveScreenshot(name, {
    clip: {
      x: Math.max(0, Math.floor(box.x - pad)),
      y: Math.max(0, Math.floor(box.y - pad)),
      width: Math.ceil(box.width + 2 * pad),
      height: Math.ceil(box.height + 2 * pad),
    },
    animations: "disabled",
    maxDiffPixelRatio: 0,
  });
}

for (const width of WIDTHS)
  for (const scheme of SCHEMES) {
    const suffix = `${width}-${scheme}.png`;

    test(`revoke dialog ${width} ${scheme}`, async ({ page }) => {
      await setup(page, scheme, width, true);
      await page.goto("/dashboard/settings");
      await page.getByTestId("revoke-api-key-button").first().click();
      await expect(
        page.getByRole("dialog", { name: "Revoke API Key" }),
      ).toBeVisible();
      await settle(page);
      await shot(page, `dialog-revoke-${suffix}`);
    });

    test(`key generated dialog ${width} ${scheme}`, async ({ page }) => {
      await setup(page, scheme, width, true);
      await page.route("**/api/api-key/generate", (r) =>
        r.fulfill({
          json: {
            id: "k3",
            name: "CI runner",
            apiKey: "ptk_live_0123456789abcdef0123456789abcdef",
            createdAt: "2026-09-25T12:00:00Z",
          },
        }),
      );
      await page.goto("/dashboard/settings");
      await page.getByTestId("generate-api-key-button").click();
      await page.getByTestId("api-key-name-input").fill("CI runner");
      // The page re-syncs the list after generating; shoot once it has.
      const resynced = page.waitForResponse(
        (r) =>
          r.url().endsWith("/api/api-key") && r.request().method() === "GET",
      );
      await page.getByTestId("generate-api-key-submit").click();
      await resynced;
      await expect(page.getByTestId("api-key-generated-dialog")).toBeVisible();
      await settle(page);
      await shot(page, `dialog-key-generated-${suffix}`);
    });

    // A refresh that 401s shows the modal (see tests/auth-refresh.spec.ts).
    test(`session expired ${width} ${scheme}`, async ({ page }) => {
      await setup(page, scheme, width, true);
      // Four minutes from expiry on the fixed clock: the refresh fires at once.
      await page.addInitScript(
        (expiresAt) => {
          localStorage.setItem(
            "auth_tokens",
            JSON.stringify({
              accessToken: "access-dead",
              refreshToken: "refresh-dead",
              expiresAt,
            }),
          );
        },
        Date.parse(NOW) + 4 * 60 * 1000,
      );
      await page.route("**/api/auth/refresh", (r) =>
        r.fulfill({
          status: 401,
          json: { statusCode: 401, message: "Invalid refresh token" },
        }),
      );
      await page.goto("/dashboard/overview");
      await expect(
        page.getByRole("dialog", { name: "Your session expired" }),
      ).toBeVisible();
      await settle(page);
      await shot(page, `dialog-session-expired-${suffix}`);
    });

    test(`admin ${width} ${scheme}`, async ({ page }) => {
      await setup(page, scheme, width, true);
      await page.addInitScript(() => {
        localStorage.setItem(
          "auth_user",
          JSON.stringify({
            id: "test-user-123",
            email: "test@example.com",
            name: "Test User",
            picture: "https://example.com/avatar.jpg",
            roles: ["ADMIN"],
          }),
        );
      });
      await page.route("**/api/auth/me", (r) =>
        r.fulfill({
          json: {
            id: "test-user-123",
            email: "test@example.com",
            displayName: "Test User",
            roles: ["ADMIN"],
          },
        }),
      );
      // A cold load of /dashboard/admin runs the guard before the stored
      // session is read and redirects, so get there from the sidebar.
      await page.goto("/dashboard/overview");
      // (a dispatched click: at 390 px the sidebar sits outside the viewport).
      await page.getByRole("link", { name: "Admin" }).dispatchEvent("click");
      await expect(page).toHaveURL(/\/dashboard\/admin$/);
      await expect(
        page.getByRole("heading", { name: "Admin Panel" }),
      ).toBeVisible();
      await settle(page);
      await shot(page, `admin-${suffix}`);
    });
  }

// Hover and keyboard focus, clipped to the button, at desktop width.
for (const scheme of SCHEMES) {
  const cases: [string, string, boolean, (p: Page) => Locator][] = [
    [
      "dashboard-generate",
      "/dashboard/settings",
      true,
      (p) => p.getByTestId("generate-api-key-button"),
    ],
    [
      "hero-primary",
      "/",
      false,
      (p) => p.getByRole("link", { name: "View Pricing Plans" }),
    ],
  ];
  for (const [name, path, authed, locate] of cases) {
    test(`${name} hover ${scheme}`, async ({ page }) => {
      await setup(page, scheme, 1280, authed);
      await page.goto(path);
      await settle(page);
      const target = locate(page);
      await target.hover();
      await page.waitForTimeout(200);
      await shotAround(page, target, `${name}-hover-1280-${scheme}.png`);
    });

    test(`${name} focus ${scheme}`, async ({ page }) => {
      await setup(page, scheme, 1280, authed);
      await page.goto(path);
      await settle(page);
      const target = locate(page);
      // A key press first, so the focus counts as keyboard focus.
      await page.keyboard.press("Shift");
      await target.focus();
      await page.waitForTimeout(200);
      await shotAround(page, target, `${name}-focus-1280-${scheme}.png`);
    });
  }
}
