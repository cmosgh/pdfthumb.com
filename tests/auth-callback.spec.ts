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

/** Mocks the exchange endpoint and records every request it receives. */
async function mockExchange(
  page: Page,
  response: { status: number; body: unknown } = { status: 201, body: session },
): Promise<Request[]> {
  const requests: Request[] = [];
  await page.route("**/api/auth/oauth/exchange", async (route) => {
    requests.push(route.request());
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

    const stored = await page.evaluate(() => ({
      tokens: JSON.parse(localStorage.getItem("auth_tokens") ?? "null"),
      user: JSON.parse(localStorage.getItem("auth_user") ?? "null"),
    }));
    expect(stored.tokens).toMatchObject({
      accessToken: "access-from-exchange",
      refreshToken: "refresh-from-exchange",
    });
    expect(stored.user).toMatchObject({
      id: "user-42",
      email: "ada@example.com",
      name: "Ada Lovelace",
    });
  });

  for (const query of ["", "?error=access_denied"]) {
    test(`sends the user to /login with a message when there is no code (${query || "empty query"})`, async ({
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

    await page.goto("/auth/callback?code=single-use-code");
    await expect(page).toHaveURL(/\/dashboard/);

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
});
