import { expect, test } from "@playwright/test";
import { PRICING_TIERS } from "@/constants.ts";

// Adjust the URL if your dev server runs on a different port
const BASE_URL = "http://localhost:4173";

test.describe("index.tsx basic render", () => {
  test("should load the app and display the root element", async ({ page }) => {
    await page.goto(BASE_URL);
    const root = await page.$("#root");
    expect(root).not.toBeNull();
  });

  test("should render the Hero section", async ({ page }) => {
    await page.goto(BASE_URL);
    // Assuming the Hero section contains a heading with a unique text, e.g., "PDF Thumbnail Pro"
    await expect(
      page.getByRole("heading", { name: /Instant PDF Thumbnails/i }),
    ).toBeVisible();
  });

  test("should render the Navbar and Footer", async ({ page, isMobile }) => {
    await page.goto(BASE_URL);

    if (isMobile) {
      // Click the mobile menu button
      await page.getByLabel("Toggle mobile menu").click();
      // Check for Mobile Navbar
      await expect(page.locator('nav[aria-label="Mobile Menu"]')).toBeVisible();
    } else {
      // Check for Desktop Navbar
      await expect(page.getByRole("navigation")).toBeVisible();
    }
    // Check for Footer (assume it has a contentinfo role)
    await expect(page.getByRole("contentinfo")).toBeVisible();
  });

  // Prices are withheld for now (#71): every amount reads "Upcoming".
  const pricedTiers = PRICING_TIERS.filter((tier) => tier.price !== "Custom");

  test("shows Upcoming instead of a price on every priced plan", async ({
    page,
  }) => {
    await page.goto(BASE_URL);
    const pricingSection = page.getByTestId("pricing-section");
    await expect(pricingSection).toContainText(
      "Flexible Pricing for Every Scale",
    );
    for (const tier of pricedTiers) {
      const card = pricingSection.getByTestId(`pricing-card-${tier.id}`);
      await expect(card.getByRole("heading", { name: tier.name })).toHaveCount(
        1,
      );
      await expect(card.getByTestId("pricing-card-price")).toHaveText(
        "Upcoming",
      );
      for (const feature of tier.features) {
        await expect(card).toContainText(feature);
      }
    }
  });

  test("shows no price amounts anywhere on the landing page", async ({
    page,
  }) => {
    await page.goto(BASE_URL);
    await expect(page.getByTestId("pricing-section")).toContainText("Upcoming");
    const text = await page.locator("body").textContent();
    expect(text).not.toMatch(/[$€£]\s?\d/);
    // Without prices there is nothing to switch between.
    await expect(page.getByRole("button", { name: /annually/i })).toHaveCount(
      0,
    );
  });

  test("shows Upcoming for the overage rates", async ({ page }) => {
    await page.goto(BASE_URL);
    const row = page
      .locator("#overage-pricing tr")
      .filter({ hasText: "Cost per Additional Thumbnail" });
    await expect(row).not.toContainText("$");
    // Basic and Pro had per-thumbnail rates; Developer is N/A, Enterprise Custom.
    await expect(row.getByText("Upcoming")).toHaveCount(2);
  });

  test("plan buttons are disabled and start no checkout", async ({ page }) => {
    const dialogs: string[] = [];
    page.on("dialog", async (dialog) => {
      dialogs.push(dialog.message());
      await dialog.dismiss();
    });
    await page.goto(BASE_URL);
    for (const tier of pricedTiers) {
      const button = page
        .getByTestId(`pricing-card-${tier.id}`)
        .getByRole("link", { name: "Upcoming" });
      await expect(button).toBeDisabled();
      await button.click({ force: true });
    }
    expect(dialogs).toEqual([]);
  });

  // API keys wait for sign-in and plans (#71): both calls to action are
  // disabled and read "Upcoming" instead of starting a checkout.
  for (const testId of ["navbar-api-key", "cta-api-key"]) {
    test(`${testId} is disabled, says Upcoming and goes nowhere`, async ({
      page,
    }) => {
      const dialogs: string[] = [];
      page.on("dialog", async (dialog) => {
        dialogs.push(dialog.message());
        await dialog.dismiss();
      });
      await page.goto(BASE_URL);
      const cta = page.getByTestId(testId);
      await expect(cta).toHaveText("API keys: Upcoming");
      await expect(cta).toBeDisabled();
      await cta.click({ force: true });
      await expect(page).toHaveURL(`${BASE_URL}/`);
      expect(dialogs).toEqual([]);
    });
  }
});
