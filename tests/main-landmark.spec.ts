import { expect, test } from "./fixtures";
import { mockAuthentication, mockEmptyAccount } from "./auth-helper";

// #166: dashboard routes rendered the dashboard layout's <main> inside the
// site shell's <main>, so every dashboard page had two main landmarks.
// /dashboardx is a 404 whose path merely starts with "/dashboard".
const PUBLIC_ROUTES = [
  "/",
  "/docs",
  "/pricing",
  "/login",
  "/security",
  "/dashboardx",
];
const DASHBOARD_ROUTES = [
  "/dashboard/overview",
  "/dashboard/usage",
  "/dashboard/settings",
];

for (const route of PUBLIC_ROUTES) {
  test(`${route} has exactly one main landmark (#166)`, async ({ page }) => {
    await page.goto(route);
    await expect(page.getByRole("main")).toHaveCount(1);
  });
}

test.describe("dashboard", () => {
  test.beforeEach(async ({ page }) => {
    await mockAuthentication(page);
    await mockEmptyAccount(page);
  });

  for (const route of DASHBOARD_ROUTES) {
    test(`${route} has exactly one main landmark (#166)`, async ({ page }) => {
      await page.goto(route);
      await expect(page.getByRole("main")).toHaveCount(1);
    });
  }
});
