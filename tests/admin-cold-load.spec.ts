import { test, expect, type Page } from "@playwright/test";
import { mockAuthentication, mockUser } from "./auth-helper";

// A stored ADMIN session: the base mocked session, with the ADMIN role on
// both the stored user and /api/auth/me.
async function mockAdminSession(page: Page) {
  await mockAuthentication(page);
  await page.addInitScript(
    (user) =>
      localStorage.setItem(
        "auth_user",
        JSON.stringify({ ...user, roles: ["ADMIN"] }),
      ),
    mockUser,
  );
  await page.unroute("**/api/auth/me");
  await page.route("**/api/auth/me", (route) =>
    route.fulfill({
      json: {
        id: mockUser.id,
        email: mockUser.email,
        displayName: mockUser.name,
        roles: ["ADMIN"],
      },
    }),
  );
}

test.describe("Admin page cold load", () => {
  test.beforeEach(async ({ page }) => {
    await mockAdminSession(page);
  });

  test("a direct load of /dashboard/admin keeps an admin there", async ({
    page,
  }) => {
    await page.goto("/dashboard/admin");

    await expect(page).toHaveURL(/\/dashboard\/admin$/);
    await expect(
      page.getByRole("heading", { name: "Admin Panel" }),
    ).toBeVisible();
  });

  test("reloading /dashboard/admin keeps an admin there", async ({ page }) => {
    // Get there client-side first, then reload.
    await page.goto("/dashboard/overview");
    await page.getByRole("link", { name: "Admin" }).dispatchEvent("click");
    await expect(page).toHaveURL(/\/dashboard\/admin$/);

    await page.reload();

    await expect(page).toHaveURL(/\/dashboard\/admin$/);
    await expect(
      page.getByRole("heading", { name: "Admin Panel" }),
    ).toBeVisible();
  });
});

// The guard still turns away everyone else on a direct load.
test.describe("Admin page cold load, non-admins", () => {
  test("a direct load sends a signed-in non-admin to the dashboard", async ({
    page,
  }) => {
    await mockAuthentication(page);
    await page.goto("/dashboard/admin");

    await expect(page).toHaveURL(/\/dashboard(\/overview)?$/);
    await expect(
      page.getByRole("heading", { name: "Admin Panel" }),
    ).not.toBeVisible();
  });

  test("a direct load sends a signed-out visitor to /login", async ({
    page,
  }) => {
    await page.goto("/dashboard/admin");

    await expect(page).toHaveURL(/\/login(\?.*)?$/);
  });
});
