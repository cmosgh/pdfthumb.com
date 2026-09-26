import { expect, test } from "./fixtures";
import { PRICING_TIERS } from "@/constants.ts";

test.describe("index.tsx basic render", () => {
  test("should load the app and display the root element", async ({ page }) => {
    await page.goto("/");
    const root = await page.$("#root");
    expect(root).not.toBeNull();
  });

  test("should render the Hero section", async ({ page }) => {
    await page.goto("/");
    // Assuming the Hero section contains a heading with a unique text, e.g., "PDF Thumbnail Pro"
    await expect(
      page.getByRole("heading", { name: /Instant PDF Thumbnails/i }),
    ).toBeVisible();
  });

  test("should render the Navbar and Footer", async ({ page, isMobile }) => {
    await page.goto("/");

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

  // Paid prices are withheld for now (#71): every amount reads "Upcoming".
  // Free is live at €0 (#129), and Enterprise is Custom. The plans live on
  // /pricing (#141).
  const pricedTiers = PRICING_TIERS.filter(
    (tier) => tier.price !== "Custom" && tier.id !== "free",
  );

  test("shows Upcoming instead of a price on every priced plan", async ({
    page,
  }) => {
    await page.goto("/pricing");
    const pricingSection = page.getByTestId("pricing-page");
    await expect(page.locator("h1")).toHaveText("Pricing");
    for (const tier of pricedTiers) {
      const card = pricingSection.getByTestId(`pricing-card-${tier.id}`);
      await expect(card.getByRole("heading", { name: tier.name })).toHaveCount(
        1,
      );
      await expect(card.getByTestId("pricing-card-price")).toHaveText(
        "Upcoming",
      );
      await expect(card).toContainText(tier.quota);
      for (const feature of tier.features) {
        await expect(card).toContainText(
          typeof feature === "string" ? feature : feature.text,
        );
      }
    }
  });

  for (const path of ["/", "/pricing"]) {
    test(`shows no paid price amounts anywhere on ${path}`, async ({
      page,
    }) => {
      await page.goto(path);
      // Free's €0 is the one amount shown (#129), on its card and in the
      // volume slider (#141). Read text node by text node, so "€0" never
      // runs into the "1,000" after it.
      const text = await page.evaluate(() => {
        const walker = document.createTreeWalker(
          document.body,
          NodeFilter.SHOW_TEXT,
        );
        const parts: string[] = [];
        for (let n = walker.nextNode(); n; n = walker.nextNode()) {
          const t = n.textContent?.trim() ?? "";
          if (t !== "€0") parts.push(t);
        }
        return parts.join("\n");
      });
      expect(text).not.toMatch(/[$€£]\s?\d/);
      // Without prices there is nothing to switch between.
      await expect(page.getByRole("button", { name: /annually/i })).toHaveCount(
        0,
      );
    });
  }

  test("shows Upcoming for the overage rates", async ({ page }) => {
    await page.goto("/pricing");
    const row = page
      .locator("#overage-pricing tr")
      .filter({ hasText: "Cost per Additional Thumbnail" });
    await expect(row).not.toContainText("$");
    // Basic and Pro had per-thumbnail rates; Free is N/A, Enterprise Custom.
    await expect(row.getByText("Upcoming")).toHaveCount(2);
  });

  test("plan buttons are disabled and start no checkout", async ({ page }) => {
    const dialogs: string[] = [];
    page.on("dialog", async (dialog) => {
      dialogs.push(dialog.message());
      await dialog.dismiss();
    });
    await page.goto("/pricing");
    for (const tier of pricedTiers) {
      const button = page
        .getByTestId(`pricing-card-${tier.id}`)
        .getByRole("link", { name: "Upcoming" });
      await expect(button).toBeDisabled();
      await button.click({ force: true });
    }
    expect(dialogs).toEqual([]);
  });

  // Free is live (BE #331): €0, and its button starts sign-up (#129).
  test("the Free card is €0 and Start free leads to sign-in", async ({
    page,
  }) => {
    await page.goto("/pricing");
    const card = page.getByTestId("pricing-card-free");
    await expect(card.getByTestId("pricing-card-price")).toHaveText("€0");
    await expect(card).not.toContainText(/soon/i);
    await expect(card).toContainText("1,000 Thumbnails a month");
    const start = card.getByRole("link", { name: "Start free" });
    await expect(start).toBeEnabled();
    await expect(start).not.toHaveAttribute("aria-disabled", "true");
    await start.click();
    await expect(page).toHaveURL(/\/login$/);
  });

  // Sign-in works and new users get the Free plan (#75): both calls to
  // action lead to /login, where API keys live behind sign-in.
  for (const testId of ["navbar-api-key", "cta-api-key"]) {
    test(`${testId} leads to sign-in, not a checkout`, async ({ page }) => {
      const dialogs: string[] = [];
      page.on("dialog", async (dialog) => {
        dialogs.push(dialog.message());
        await dialog.dismiss();
      });
      await page.goto("/");
      const cta = page.getByTestId(testId);
      await expect(cta).toBeEnabled();
      await cta.click();
      await expect(page).toHaveURL(/\/login$/);
      expect(dialogs).toEqual([]);
    });
  }

  test("the API-key calls to action keep their original labels", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page.getByTestId("navbar-api-key")).toHaveText("Get API Key");
    await expect(page.getByTestId("cta-api-key")).toHaveText(
      "Get Your Free API Key Now",
    );
  });
});
