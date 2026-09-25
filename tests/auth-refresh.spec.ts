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

  // The backend's refresh answers only { accessToken, refreshToken }: no
  // expiresIn. Reading it as a duration threw, discarding the rotated pair
  // (#82). A non-string expiresIn must not throw either.
  for (const [label, extra] of [
    ["without expiresIn", {}],
    ["with a numeric expiresIn", { expiresIn: 3600 }],
  ] as const) {
    test(`a refresh ${label} keeps the new tokens for an hour`, async ({
      page,
    }) => {
      await seedNearlyExpiredSession(page);
      const refreshes: Request[] = [];
      await page.route("**/api/auth/refresh", async (route) => {
        refreshes.push(route.request());
        await route.fulfill({
          status: 201,
          json: {
            accessToken: "access-rotated",
            refreshToken: "refresh-rotated",
            ...extra,
          },
        });
      });
      await mockMe(page);

      await page.goto("/dashboard");
      await expect.poll(() => refreshes.length).toBe(1);
      const refreshedAt = Date.now();
      await page.waitForTimeout(1500);

      const tokens = await page.evaluate(() =>
        JSON.parse(localStorage.getItem("auth_tokens") ?? "null"),
      );
      expect(tokens).toMatchObject({
        accessToken: "access-rotated",
        refreshToken: "refresh-rotated",
      });
      expect(tokens.expiresAt).toBeGreaterThan(refreshedAt + 3500_000);
      expect(tokens.expiresAt).toBeLessThan(refreshedAt + 3700_000);
      expect(refreshes).toHaveLength(1);
      await expect(
        page.getByRole("dialog", { name: "Your session expired" }),
      ).toHaveCount(0);
    });
  }

  // Tabs share one localStorage, and a refresh token is single-use: of
  // concurrent refreshes with it, the server lets exactly one through and
  // answers the rest 401 at once (#81). Here the winner's 200 is still in
  // flight when the loser's 401 arrives, so the loser can't yet see the new
  // pair in storage. Only one refresh may go out, and neither tab expires.
  test("two tabs refreshing at once send one refresh and both keep the session", async ({
    context,
    browserName,
  }) => {
    const presented: string[] = [];
    await context.route("**/api/auth/refresh", async (route) => {
      const { refreshToken } = route.request().postDataJSON();
      presented.push(refreshToken);
      if (presented.filter((t) => t === refreshToken).length > 1) {
        await route.fulfill({
          status: 401,
          json: { statusCode: 401, message: "Invalid refresh token" },
        });
        return;
      }
      await new Promise((resolve) => setTimeout(resolve, 2000));
      await route.fulfill({
        json: {
          accessToken: "access-rotated",
          refreshToken: "refresh-rotated",
        },
      });
    });
    await context.route("**/api/auth/me", (route) =>
      route.fulfill({
        json: { id: "user-42", email: "ada@example.com", roles: ["user"] },
      }),
    );

    const first = await context.newPage();
    await seedNearlyExpiredSession(first);
    await first.goto("/dashboard");
    // The second tab opens while the first tab's refresh is in flight.
    const second = await context.newPage();
    await second.goto("/dashboard");

    await expect
      .poll(() => storedRefreshToken(first), { timeout: 5000 })
      .toBe("refresh-rotated");
    await second.waitForTimeout(1000);

    // Firefox can show the second tab the old pair for a moment after the
    // first stored the new one, so that tab may spend the old token on a
    // 401 before adopting the new pair. Elsewhere the lock allows one refresh.
    expect(presented[0]).toBe("refresh-already-rotated");
    expect(presented.length).toBeLessThanOrEqual(
      browserName === "firefox" ? 2 : 1,
    );
    for (const tab of [first, second]) {
      expect(await storedRefreshToken(tab)).toBe("refresh-rotated");
      await expect(
        tab.getByRole("dialog", { name: "Your session expired" }),
      ).toHaveCount(0);
    }
  });

  // Very old browsers have no Web Locks: refreshing must still work there.
  test("refreshes without navigator.locks", async ({ page }) => {
    await page.addInitScript(() =>
      Object.defineProperty(navigator, "locks", { value: undefined }),
    );
    await seedNearlyExpiredSession(page);
    await page.route("**/api/auth/refresh", (route) =>
      route.fulfill({ json: refreshed }),
    );
    await mockMe(page);

    await page.goto("/dashboard");
    await expect
      .poll(() => storedRefreshToken(page))
      .toBe("refresh-from-refresh");
    await expect(
      page.getByRole("dialog", { name: "Your session expired" }),
    ).toHaveCount(0);
  });

  // Firefox hands another tab's localStorage write to this one
  // asynchronously, so a 401 can arrive while storage still shows the token
  // this tab spent. The winner's pair is on its way: wait for it, adopt it.
  test("a 401 whose winning pair reaches this tab a moment later adopts it", async ({
    context,
  }) => {
    // "The other tab" only stores the winning pair: park it on a
    // same-origin script, so no app of its own reacts to storage.
    const winner = await context.newPage();
    await winner.goto("/");
    await winner.goto(
      await winner.evaluate(
        () =>
          document.querySelector<HTMLScriptElement>('script[type="module"]')!
            .src,
      ),
    );
    await context.route("**/api/auth/refresh", async (route) => {
      setTimeout(() => {
        void winner.evaluate(() =>
          localStorage.setItem(
            "auth_tokens",
            JSON.stringify({
              accessToken: "access-from-other-tab",
              refreshToken: "refresh-from-other-tab",
              expiresAt: Date.now() + 60 * 60 * 1000,
            }),
          ),
        );
      }, 300);
      await route.fulfill({
        status: 401,
        json: { statusCode: 401, message: "Invalid refresh token" },
      });
    });
    const tab = await context.newPage();
    await seedNearlyExpiredSession(tab);
    await mockMe(tab);

    await tab.goto("/dashboard");
    await tab.waitForTimeout(1500);
    expect(await storedRefreshToken(tab)).toBe("refresh-from-other-tab");
    await expect(
      tab.getByRole("dialog", { name: "Your session expired" }),
    ).toHaveCount(0);
  });

  test("logging out while another tab refreshes doesn't bring the session back", async ({
    context,
  }) => {
    let refreshes = 0;
    await context.route("**/api/auth/refresh", async (route) => {
      if (++refreshes > 1) {
        await route.fulfill({
          status: 401,
          json: { statusCode: 401, message: "Invalid refresh token" },
        });
        return;
      }
      await new Promise((resolve) => setTimeout(resolve, 1000));
      await route.fulfill({
        json: {
          accessToken: "access-rotated",
          refreshToken: "refresh-rotated",
        },
      });
    });
    await context.route("**/api/auth/logout", (route) =>
      route.fulfill({ json: {} }),
    );
    const refreshing = await context.newPage();
    await seedNearlyExpiredSession(refreshing);
    await mockMe(refreshing);
    await refreshing.goto("/dashboard");

    const other = await context.newPage();
    await mockMe(other);
    await other.goto("/");
    await other.getByRole("button", { name: "Logout" }).click();

    await refreshing.waitForTimeout(2000);
    expect(await storedRefreshToken(refreshing)).toBeNull();
  });
});
