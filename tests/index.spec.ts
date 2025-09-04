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
      await page.getByLabel('Toggle mobile menu').click();
      // Check for Mobile Navbar
      await expect(page.locator('nav[aria-label="Mobile Menu"]')).toBeVisible();
    } else {
      // Check for Desktop Navbar
      await expect(page.getByRole("navigation")).toBeVisible();
    }
    // Check for Footer (assume it has a contentinfo role)
    await expect(page.getByRole("contentinfo")).toBeVisible();
  });

  test("should render the Pricing section with correct tiers and prices", async ({
    page,
  }) => {
    await page.goto(BASE_URL);
    const pricingSection = page.getByTestId("pricing-section");
    const tiers = PRICING_TIERS;
    await expect(
      pricingSection.getByText(/Flexible Pricing for Every Scale/i),
    ).toBeVisible();
    for (const tier of tiers) {
      // Check the heading is visible
      await expect(
        pricingSection.getByRole("heading", { name: tier.name }),
      ).toBeVisible();
      const pricingCard = await pricingSection.getByTestId(
        `pricing-card-${tier.id}`,
      );
      // Check the pricing card is visible by id
      await expect(pricingCard).toBeVisible();
      // Check the price is visible
      await expect(pricingCard.getByTestId("pricing-card-price")).toBeVisible();
      // check the price text matches
      await expect(
        pricingCard.getByText(`${tier.currency ?? ""}${tier.price}`, {
          exact: true,
        }),
      ).toBeVisible();
    }
  });

  test("should show annual prices for tiers when toggled", async ({ page }) => {
    await page.goto(BASE_URL);
    // Simulate clicking the annual/monthly toggle (assume it has a role or label)
    const toggle = await page.getByRole("button", { name: /annually/i });
    await toggle.click();
    // Only test for existing annual tiers: Basic and Pro
    const annualTiers = PRICING_TIERS.filter((tier) => tier.priceYearly);
    for (const tier of annualTiers) {
      await expect(
        page.getByRole("heading", { name: tier.name }),
      ).toBeVisible();
      await expect(
        page.getByText(`${tier.currency ?? ""}${tier.priceYearly}`),
      ).toBeVisible();
    }
  });
});