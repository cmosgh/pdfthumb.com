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
});
