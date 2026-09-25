import { test, expect, Page, Request } from "@playwright/test";

// The backend's AuthSession, as returned by POST /api/auth/oauth/exchange.
const session = {
  accessToken: "access-from-exchange",
  refreshToken: "refresh-from-exchange",
  user: {
    id: "user-42",
    email: "ada@example.com",
    displayName: "Ada Lovelace",
    roles: ["user"],
  },
  expiresIn: "1h",
};

/**
 * Mocks the exchange endpoint and records every request it receives. Pass
 * `until` to hold each response back until that promise settles.
 */
async function mockExchange(
  page: Page,
  response: { status: number; body: unknown } = { status: 201, body: session },
  until?: Promise<void>,
): Promise<Request[]> {
  const requests: Request[] = [];
  await page.route("**/api/auth/oauth/exchange", async (route) => {
    requests.push(route.request());
    await until;
    await route.fulfill({ status: response.status, json: response.body });
  });
  await page.route("**/api/auth/me", (route) =>
    route.fulfill({ json: session.user }),
  );
  return requests;
}

test.describe("OAuth callback", () => {
  test("redeems the code and signs the user in", async ({ page }) => {
    const requests = await mockExchange(page);

    await page.goto("/auth/callback?code=single-use-code");

    await expect(page).toHaveURL(/\/dashboard/);
    expect(requests).toHaveLength(1);
    expect(requests[0].method()).toBe("POST");
    expect(requests[0].postDataJSON()).toEqual({ code: "single-use-code" });

    const before = Date.now();
    const stored = await page.evaluate(() => ({
      tokens: JSON.parse(localStorage.getItem("auth_tokens") ?? "null"),
      user: JSON.parse(localStorage.getItem("auth_user") ?? "null"),
    }));
    expect(stored.tokens).toMatchObject({
      accessToken: "access-from-exchange",
      refreshToken: "refresh-from-exchange",
    });
    // expiresIn "1h" is a jsonwebtoken duration: one hour from sign-in.
    expect(stored.tokens.expiresAt).toBeGreaterThan(before + 3500_000);
    expect(stored.tokens.expiresAt).toBeLessThan(before + 3700_000);
    expect(stored.user).toMatchObject({
      id: "user-42",
      email: "ada@example.com",
      name: "Ada Lovelace",
    });
  });

  for (const query of [
    "",
    "?error=access_denied",
    "?code=single-use-code&error=access_denied",
  ]) {
    test(`sends the user to /login with a message and redeems nothing (${query || "empty query"})`, async ({
      page,
    }) => {
      const requests = await mockExchange(page);

      await page.goto(`/auth/callback${query}`);

      await expect(page).toHaveURL(/\/login/);
      await expect(page.getByRole("alert")).toContainText(
        "Google sign-in didn't complete",
      );
      expect(requests).toHaveLength(0);
    });
  }

  test("redeems a code only once, even if the callback mounts again", async ({
    page,
  }) => {
    const requests = await mockExchange(page);
    const rolesLoaded = page.waitForResponse("**/api/auth/me");

    await page.goto("/auth/callback?code=single-use-code");
    await expect(page).toHaveURL(/\/dashboard/);
    // Let fetchMe's role update and the router reload it triggers settle first.
    await rolesLoaded;
    await page.waitForLoadState("networkidle");

    // Remount the callback with the same code in the same page load, the way
    // StrictMode's double effect or a route re-match would. Getting back to
    // /dashboard proves the callback mounted again and finished.
    await page.evaluate(async () => {
      history.pushState({}, "", "/auth/callback?code=single-use-code");
      dispatchEvent(new PopStateEvent("popstate"));
      while (location.pathname !== "/dashboard") {
        await new Promise((resolve) => setTimeout(resolve, 20));
      }
    });

    expect(requests).toHaveLength(1);
  });

  test("redeems a code only once when the callback remounts mid-exchange", async ({
    page,
  }) => {
    let release!: () => void;
    const requests = await mockExchange(
      page,
      undefined,
      new Promise<void>((resolve) => (release = resolve)),
    );

    await page.goto("/auth/callback?code=single-use-code");
    await expect.poll(() => requests.length).toBe(1);

    // Unmount and remount the callback while the first exchange is in flight,
    // which is what StrictMode's double effect does.
    await page.evaluate(() => {
      history.pushState({}, "", "/");
      dispatchEvent(new PopStateEvent("popstate"));
    });
    // Mounting is what matters here, so check the callback is attached.
    const signingIn = page.getByText("Signing you in");
    await expect(signingIn).not.toBeAttached();
    await page.evaluate(() => {
      history.pushState({}, "", "/auth/callback?code=single-use-code");
      dispatchEvent(new PopStateEvent("popstate"));
    });
    await expect(signingIn).toBeAttached();

    release();
    await expect(page).toHaveURL(/\/dashboard/);
    expect(requests).toHaveLength(1);
  });

  test("shows the message when the backend's error redirect lands on /login", async ({
    page,
  }) => {
    await page.goto("/login?error=authentication_failed");

    await expect(page.getByRole("alert")).toContainText(
      "Google sign-in didn't complete",
    );
  });

  test("sends the user to /login with a message when the exchange fails", async ({
    page,
  }) => {
    const requests = await mockExchange(page, {
      status: 401,
      body: { statusCode: 401, message: "Invalid authorization code" },
    });

    await page.goto("/auth/callback?code=expired-code");

    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByRole("alert")).toContainText(
      "Google sign-in didn't complete",
    );
    expect(requests).toHaveLength(1);
    expect(
      await page.evaluate(() => localStorage.getItem("auth_tokens")),
    ).toBeNull();
  });

  test("stores no name when Google gives none, rather than the email", async ({
    page,
  }) => {
    await mockExchange(page, {
      status: 201,
      body: { ...session, user: { ...session.user, displayName: null } },
    });

    await page.goto("/auth/callback?code=single-use-code");
    await expect(page).toHaveURL(/\/dashboard/);

    const user = await page.evaluate(() =>
      JSON.parse(localStorage.getItem("auth_user") ?? "null"),
    );
    expect(user).toMatchObject({ name: "", email: "ada@example.com" });
  });
});
