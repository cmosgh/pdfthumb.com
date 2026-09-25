import { test, expect, Request } from "@playwright/test";

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
    // Seeded once per tab (sessionStorage flag), so reloads see real storage.
    // Four minutes from expiry: inside the 5-minute refresh buffer but past
    // the 60-second one, which is when the loop happened.
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
        JSON.stringify({
          id: "user-42",
          email: "ada@example.com",
          name: "Ada",
        }),
      );
    });
    const refreshes: Request[] = [];
    await page.route("**/api/auth/refresh", async (route) => {
      refreshes.push(route.request());
      await route.fulfill({
        status: 401,
        json: { statusCode: 401, message: "Invalid refresh token" },
      });
    });
    await page.route("**/api/auth/me", (route) =>
      route.fulfill({ json: refreshed.user }),
    );

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
});
