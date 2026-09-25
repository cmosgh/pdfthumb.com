import { test, expect, Page, Request } from "@playwright/test";

// POST /api/auth/refresh answers with the same AuthSession as the OAuth
// exchange, so expiresIn is a jsonwebtoken duration string.
const refreshed = {
  accessToken: "access-from-refresh",
  refreshToken: "refresh-from-refresh",
  user: {
    id: "user-42",
    email: "ada@example.com",
    displayName: "Ada Lovelace",
    roles: ["user"],
  },
  expiresIn: "1h",
};

// Four minutes from expiry: inside the 5-minute refresh buffer, so the
// refresh fires at once, but past the 60-second one. Seeded once per tab
// (sessionStorage flag), so reloads see what the app left in storage.
async function seedNearlyExpiredSession(page: Page) {
  await page.addInitScript(() => {
    if (sessionStorage.getItem("seeded")) return;
    sessionStorage.setItem("seeded", "1");
    localStorage.setItem(
      "auth_tokens",
      JSON.stringify({
        accessToken: "access-dead",
        refreshToken: "refresh-already-rotated",
        expiresAt: Date.now() + 4 * 60 * 1000,
      }),
    );
    localStorage.setItem(
      "auth_user",
      JSON.stringify({ id: "user-42", email: "ada@example.com", name: "Ada" }),
    );
  });
}

async function mockMe(page: Page) {
  await page.route("**/api/auth/me", (route) =>
    route.fulfill({
      json: { id: "user-42", email: "ada@example.com", roles: ["user"] },
    }),
  );
}

async function storedRefreshToken(page: Page) {
  return page.evaluate(
    () =>
      JSON.parse(localStorage.getItem("auth_tokens") ?? "null")?.refreshToken ??
      null,
  );
}

test.describe("Token refresh", () => {
  test("stores the refreshed session's expiry and schedules the next refresh an hour out", async ({
    page,
  }) => {
    // A session five minutes and a second from expiry: the proactive refresh
    // fires five minutes before expiry, so about a second after load.
    await page.addInitScript(() => {
      localStorage.setItem(
        "auth_tokens",
        JSON.stringify({
          accessToken: "access-before-refresh",
          refreshToken: "refresh-before-refresh",
          expiresAt: Date.now() + 5 * 60 * 1000 + 1000,
        }),
      );
      localStorage.setItem(
        "auth_user",
        JSON.stringify({
          id: "user-42",
          email: "ada@example.com",
          name: "Ada Lovelace",
          roles: ["user"],
        }),
      );
    });
    const refreshes: Request[] = [];
    await page.route("**/api/auth/refresh", async (route) => {
      refreshes.push(route.request());
      await route.fulfill({ status: 201, json: refreshed });
    });
    await page.route("**/api/auth/me", (route) =>
      route.fulfill({ json: refreshed.user }),
    );

    await page.goto("/dashboard");
    await expect.poll(() => refreshes.length).toBeGreaterThanOrEqual(1);
    const refreshedAt = Date.now();

    // The next refresh is due in 55 minutes, so none should follow now.
    await page.waitForTimeout(2000);
    expect(refreshes).toHaveLength(1);
    expect(refreshes[0].postDataJSON()).toEqual({
      refreshToken: "refresh-before-refresh",
    });

    const tokens = await page.evaluate(() =>
      JSON.parse(localStorage.getItem("auth_tokens") ?? "null"),
    );
    expect(tokens.accessToken).toBe("access-from-refresh");
    expect(tokens.expiresAt).toBeGreaterThan(refreshedAt + 3500_000);
    expect(tokens.expiresAt).toBeLessThan(refreshedAt + 3700_000);
  });

  // #79: a refresh that fails for good must not leave the dead session in
  // storage, or every reload retries it and the modal loops.
  test("a failed refresh clears the session, and Log in again reaches a clean /login", async ({
    page,
  }) => {
    await seedNearlyExpiredSession(page);
    const refreshes: Request[] = [];
    await page.route("**/api/auth/refresh", async (route) => {
      refreshes.push(route.request());
      await route.fulfill({
        status: 401,
        json: { statusCode: 401, message: "Invalid refresh token" },
      });
    });
    await mockMe(page);

    await page.goto("/dashboard");
    const modal = page.getByRole("dialog", { name: "Your session expired" });
    await expect(modal).toBeVisible();
    expect(
      await page.evaluate(() => [
        localStorage.getItem("auth_tokens"),
        localStorage.getItem("auth_user"),
      ]),
    ).toEqual([null, null]);

    await modal.getByRole("link", { name: "Log in again" }).click();
    await expect(page).toHaveURL(/\/login$/);
    await expect(
      page.getByRole("heading", { name: "Sign in to your account" }),
    ).toBeVisible();
    // Long enough for an immediate retry (delay 0) to have fired.
    await page.waitForTimeout(1500);
    await expect(modal).toHaveCount(0);
    expect(refreshes).toHaveLength(1);
  });

  test("a refresh that fails for now (503) keeps the session", async ({
    page,
  }) => {
    await seedNearlyExpiredSession(page);
    await page.route("**/api/auth/refresh", (route) =>
      route.fulfill({ status: 503, json: { message: "Service Unavailable" } }),
    );
    await mockMe(page);

    await page.goto("/dashboard");
    await expect(
      page.getByRole("dialog", { name: "Your session expired" }),
    ).toBeVisible();
    // Not spent: a reload may still renew it once the backend is back.
    expect(await storedRefreshToken(page)).toBe("refresh-already-rotated");
  });

  test("a 401 after another tab already refreshed leaves that tab's tokens alone", async ({
    page,
  }) => {
    await seedNearlyExpiredSession(page);
    await page.route("**/api/auth/refresh", async (route) => {
      // Another tab won the race and stored a fresh session first.
      await page.evaluate(() =>
        localStorage.setItem(
          "auth_tokens",
          JSON.stringify({
            accessToken: "access-from-other-tab",
            refreshToken: "refresh-from-other-tab",
            expiresAt: Date.now() + 60 * 60 * 1000,
          }),
        ),
      );
      await route.fulfill({
        status: 401,
        json: { statusCode: 401, message: "Invalid refresh token" },
      });
    });
    await mockMe(page);

    await page.goto("/dashboard");
    await page.waitForTimeout(1500);
    expect(await storedRefreshToken(page)).toBe("refresh-from-other-tab");
    await expect(
      page.getByRole("dialog", { name: "Your session expired" }),
    ).toHaveCount(0);
  });
});
