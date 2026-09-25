import { expect, test } from "@playwright/test";

// The documentation page (#126): public, links the live Swagger UI, and
// the landing page's documentation links lead to it.

const SWAGGER = "https://pdfthumb.com/api/swagger";

test.describe("documentation page (#126)", () => {
  test("serves /docs without signing in", async ({ page }) => {
    await page.goto("/docs");
    await expect(page).toHaveURL(/\/docs$/);
    await expect(
      page.getByRole("heading", { level: 1, name: /documentation/i }),
    ).toBeVisible();
    await expect(page).toHaveTitle(/Documentation/);
  });

  test("links the live API reference", async ({ page }) => {
    await page.goto("/docs");
    const link = page.getByTestId("docs-swagger-link");
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute("href", SWAGGER);
  });

  test("walks through a key, the header and a first request", async ({
    page,
  }) => {
    await page.goto("/docs");
    const main = page.getByTestId("docs-page");
    await expect(main).toContainText("x-api-key");
    // One curl snippet; the other endpoints are named, and Swagger has
    // their full examples.
    const curls = main.locator("pre").filter({ hasText: "curl" });
    await expect(curls).toHaveCount(1);
    await expect(curls).toContainText(
      "https://pdfthumb.com/api/thumbnail/page",
    );
    await expect(main).toContainText("/api/thumbnail/zip");
    await expect(main).toContainText("/api/thumbnail/count");
    await expect(
      main.getByRole("link", { name: /dashboard/i }).first(),
    ).toHaveAttribute("href", "/dashboard/settings");
  });

  test("states the limits and points at pricing for quotas", async ({
    page,
  }) => {
    await page.goto("/docs");
    const limits = page.getByTestId("docs-limits");
    await expect(limits).toContainText("16");
    await expect(limits).toContainText("1,600");
    await expect(limits).toContainText(/MB/);
    await expect(
      limits.getByRole("link", { name: /pricing/i }),
    ).toHaveAttribute("href", "/#pricing");
    // No SDKs exist: the page must not promise any.
    await expect(page.getByTestId("docs-page")).not.toContainText(
      /client librar|SDK/i,
    );
  });

  for (const [where, locate] of [
    ["hero", "hero-docs-link"],
    ["footer", "footer-docs-link"],
  ] as const) {
    test(`the ${where}'s documentation link lands on /docs`, async ({
      page,
    }) => {
      await page.goto("/");
      await page.getByTestId(locate).click();
      await expect(page).toHaveURL(/\/docs$/);
      await expect(page.getByTestId("docs-page")).toBeVisible();
    });
  }
});
