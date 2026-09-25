import { expect, test, type Locator, type Page } from "@playwright/test";
import { CONTACT_RENDER } from "@/constants.ts";

// Plans & pricing copy (#118): the claims follow the driver's decisions
// M1–M15. The copy is spelled out here, not read from constants, so a
// changed claim shows up as a failing test.

const SUPPORT = "support@pdfthumb.com";
const SALES = "sales@pdfthumb.com";

const pricing = (page: Page) => page.getByTestId("pricing-section");
const card = (page: Page, id: string) =>
  pricing(page).getByTestId(`pricing-card-${id}`);

// How a contact address renders depends on Q1 (CONTACT_RENDER).
async function expectContact(scope: Locator, address: string) {
  const link = scope.locator(`a[href="mailto:${address}"]`);
  if (CONTACT_RENDER === "plain") {
    await expect(scope).toContainText(address);
    await expect(link).toHaveCount(0);
  } else {
    await expect(link.first()).toBeVisible();
  }
  if (CONTACT_RENDER === "tbc") {
    await expect(scope).toContainText("[TBC]");
  } else {
    await expect(scope).not.toContainText("TBC");
  }
}

test.describe("pricing page copy (#118)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("names the plans Free, Basic, Pro and Enterprise", async ({ page }) => {
    for (const [id, name] of [
      ["free", "Free"],
      ["basic", "Basic"],
      ["pro", "Pro"],
      ["enterprise", "Enterprise"],
    ]) {
      await expect(
        card(page, id).getByRole("heading", { name, exact: true }),
      ).toHaveCount(1);
    }
    await expect(pricing(page)).not.toContainText("Developer");
    await expect(card(page, "free")).toContainText(
      "For builders and side projects",
    );
  });

  test("each card states its volume, file size and support", async ({
    page,
  }) => {
    const lines: Record<string, string[]> = {
      free: [
        "1,000 Thumbnails a month",
        "PDFs up to 10 MB",
        "Email support, best effort (no response time)",
      ],
      basic: [
        "10,000 Thumbnails a month",
        "PDFs up to 10 MB",
        "Email support, best effort (no response time)",
      ],
      pro: [
        "100,000 Thumbnails a month",
        "PDFs up to 10 MB",
        "Email, next business day",
      ],
      enterprise: [
        "Volume by contract",
        "PDFs up to 10 MB",
        "Contract SLA: business hours (09:00–17:00 Romanian time, EET/EEST, Mon–Fri",
        "next-business-day first response · integration help",
      ],
    };
    for (const [id, expected] of Object.entries(lines)) {
      for (const line of expected) {
        await expect(card(page, id)).toContainText(line);
      }
    }
    for (const id of ["free", "basic", "pro"]) {
      await expectContact(card(page, id), SUPPORT);
    }
    await expectContact(card(page, "enterprise"), SALES);
  });

  test("lists what every plan includes once, below the cards", async ({
    page,
  }) => {
    const shared = pricing(page).getByTestId("pricing-every-plan");
    for (const line of [
      "Same rendering on every plan",
      "Any width from 16 to 1,600 px",
      "No watermarks on any plan",
      "EU-hosted in Germany · API keys stored hashed and revocable",
    ]) {
      await expect(shared).toContainText(line);
    }
  });

  test("drops the claims the product doesn't back", async ({ page }) => {
    const text =
      (await pricing(page).textContent()) +
      ((await page.locator("#overage-pricing").textContent()) ?? "");
    for (const claim of [
      /Basic Thumbnail Quality/,
      /Standard Thumbnail Quality/,
      /High Quality Thumbnails/,
      /Highest Quality/,
      /Unlimited thumbnails/i,
      /Advanced Security Options/,
      /Dedicated Support/,
      /Custom Integrations/,
      /Community Support/,
      /Usage Analytics/,
      /\bEET\b(?!\/EEST)/,
    ]) {
      expect(text).not.toMatch(claim);
    }
    // No per-card watermark line: it is said once, for every plan.
    for (const id of ["free", "basic", "pro", "enterprise"]) {
      await expect(card(page, id)).not.toContainText(/watermark/i);
    }
  });

  test("keeps Privacy First, without the retention claim", async ({ page }) => {
    const features = page.locator("#features");
    await expect(features).not.toContainText("Zero File Retention");
    await expect(
      features.getByRole("heading", { name: "Privacy First", exact: true }),
    ).toBeVisible();
    await expect(features).toContainText(
      "PDFs are processed in memory and never stored. ZIP archives of your thumbnails sit on local disk only while they download, deleted within an hour at most.",
    );
  });

  test("explains that overage billing waits for paid plans", async ({
    page,
  }) => {
    const overage = page.locator("#overage-pricing");
    const m13 =
      "Overage billing starts when paid plans launch. Until then, Free stops at 1,000 Thumbnails a month.";
    const how = overage.locator("tr").filter({ hasText: "How Overages Work" });
    await expect(how.getByText(m13)).toHaveCount(2);
    await expect(overage).not.toContainText("Billed automatically");
    await expect(overage).not.toContainText("Developer");
    const included = overage
      .locator("tr")
      .filter({ hasText: "Monthly Included Thumbnails" });
    await expect(included).toContainText("1,000 Thumbnails a month");
    await expect(included).toContainText("Volume by contract");
  });

  test("offers the On-prem edition below the plans", async ({ page }) => {
    const onPrem = pricing(page).getByTestId("pricing-on-prem");
    await expect(onPrem).toContainText(
      "Run PDFThumb in your own infrastructure (Kubernetes/Helm or AWS via Terraform), with unlimited instances and no per-Thumbnail charges under one annual licence, and counts-only usage reports.",
    );
    // Q-P: the licence price waits for the SaaS prices (Stripe).
    await expect(onPrem).toContainText("Pricing on request");
    await expect(onPrem).not.toContainText(/[$€£]\s?\d/);
    await expect(onPrem).not.toContainText(/trial/i);
    await expectContact(onPrem, SALES);
  });

  test("the footer's Contact Us reaches support", async ({ page }) => {
    await expectContact(page.getByRole("contentinfo"), SUPPORT);
    await expect(page.locator('a[href="#contact"]')).toHaveCount(0);
  });
});
