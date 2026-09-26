import { expect, test, type Page } from "@playwright/test";
import { describeOverflow, widestOverflow } from "./overflow-helper";

// Pricing on its own page (#141): Free, Basic and Pro as self-serve cards,
// Enterprise and On-prem in a band below them, a volume slider that names
// the cheapest plan for a volume, and a short FAQ. The copy is spelled out
// here, not read from constants, so a changed claim fails a test.

const SELF_SERVE = ["free", "basic", "pro"];

const slider = (page: Page) =>
  page.getByRole("slider", { name: "Thumbnails a month" });

// Walks the slider with the keyboard until it reads `volume`.
async function setVolume(page: Page, volume: string) {
  const input = slider(page);
  await input.focus();
  await input.press("Home");
  for (let i = 0; i < 40; i++) {
    const text = await input.getAttribute("aria-valuetext");
    if (text?.startsWith(`${volume} Thumbnails`)) return;
    await input.press("ArrowRight");
  }
  throw new Error(`the slider never reached ${volume}`);
}

test.describe("/pricing (#141)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/pricing");
  });

  test("renders the pricing page with its own title", async ({ page }) => {
    await expect(page.locator("h1")).toHaveText("Pricing");
    await expect(page).toHaveTitle(/^Pricing \|/);
  });

  test("shows Free, Basic and Pro as self-serve cards", async ({ page }) => {
    const cards = page.getByTestId("pricing-self-serve");
    for (const [id, name] of [
      ["free", "Free"],
      ["basic", "Basic"],
      ["pro", "Pro"],
    ]) {
      await expect(
        cards
          .getByTestId(`pricing-card-${id}`)
          .getByRole("heading", { name, exact: true }),
      ).toBeVisible();
    }
    await expect(cards.getByTestId("pricing-card-enterprise")).toHaveCount(0);
    await expect(
      cards.getByTestId("pricing-card-free").getByTestId("pricing-card-price"),
    ).toHaveText("€0");
    for (const id of ["basic", "pro"]) {
      await expect(
        cards
          .getByTestId(`pricing-card-${id}`)
          .getByTestId("pricing-card-price"),
      ).toHaveText("Upcoming");
    }
  });

  test("puts Enterprise and On-prem in a band below the cards", async ({
    page,
  }) => {
    const band = page.getByTestId("pricing-band");
    await expect(band.getByTestId("pricing-card-enterprise")).toContainText(
      "Enterprise",
    );
    await expect(band.getByTestId("pricing-card-enterprise")).toContainText(
      "Volume by contract",
    );
    await expect(band.getByTestId("pricing-on-prem")).toContainText(
      "On-prem edition",
    );
    const cardsBottom = await page
      .getByTestId("pricing-self-serve")
      .evaluate((el) => el.getBoundingClientRect().bottom);
    const bandTop = await band.evaluate((el) => el.getBoundingClientRect().top);
    expect(bandTop).toBeGreaterThan(cardsBottom);
  });

  test("states prices in EUR, with no VAT claim yet", async ({ page }) => {
    const note = page.getByTestId("pricing-currency-note");
    await expect(note).toHaveText("Prices in EUR.");
    await expect(note).toBeVisible();
    await expect(page.getByTestId("volume-result")).toContainText("· EUR");
    // VAT handling waits on pdfthumbnailpro-be#185.
    await expect(page.locator("main")).not.toContainText("VAT");
  });

  test("the slider is a labelled range input", async ({ page }) => {
    const input = slider(page);
    await expect(input).toBeVisible();
    await expect(input).toHaveAttribute("type", "range");
    await expect(input).toHaveAttribute(
      "aria-valuetext",
      /^[\d,]+ Thumbnails a month$/,
    );
  });

  // The cheapest plan that covers the volume, and its price from the data.
  for (const [volume, plan, price] of [
    ["100", "Free", "€0"],
    ["1,000", "Free", "€0"],
    ["2,500", "Basic", "Upcoming"],
    ["10,000", "Basic", "Upcoming"],
    ["25,000", "Pro", "Upcoming"],
    ["100,000", "Pro", "Upcoming"],
  ]) {
    test(`the slider picks ${plan} at ${volume} Thumbnails`, async ({
      page,
    }) => {
      await setVolume(page, volume);
      const result = page.getByTestId("volume-result");
      await expect(result.getByTestId("volume-plan")).toHaveText(plan);
      await expect(result.getByTestId("volume-price")).toHaveText(price);
      await expect(result).not.toContainText("Contact sales");
    });
  }

  test("above Pro's quota the slider points to Enterprise", async ({
    page,
  }) => {
    await setVolume(page, "250,000");
    const result = page.getByTestId("volume-result");
    await expect(result.getByTestId("volume-plan")).toHaveText("Enterprise");
    await expect(result).toContainText("Volume by contract");
    await expect(result.getByTestId("volume-price")).toHaveCount(0);
    await expect(result).toContainText("Contact sales");
  });

  test("the slider goes no higher than it can price", async ({ page }) => {
    const input = slider(page);
    await input.focus();
    await input.press("End");
    await expect(page.getByTestId("volume-plan")).toHaveText("Enterprise");
  });

  test("shows no paid amounts and no yearly toggle", async ({ page }) => {
    // Free's €0 is the one amount (#129), read node by node.
    const text = await page.locator("main").evaluate((main) => {
      const walker = document.createTreeWalker(main, NodeFilter.SHOW_TEXT);
      const parts: string[] = [];
      for (let n = walker.nextNode(); n; n = walker.nextNode()) {
        const t = n.textContent?.trim() ?? "";
        if (t !== "€0") parts.push(t);
      }
      return parts.join("\n");
    });
    expect(text).not.toMatch(/[$€£]\s?\d/);
    await expect(page.getByTestId("billing-period")).toHaveCount(0);
    await expect(
      page.getByRole("button", { name: /year|annual/i }),
    ).toHaveCount(0);
    await expect(page.getByRole("radio", { name: /year|annual/i })).toHaveCount(
      0,
    );
    await expect(page.locator("main")).not.toContainText(/yearly|annually/i);
    await expect(page.locator("main")).not.toContainText(/months free/i);
  });

  test("answers the four pricing questions", async ({ page }) => {
    const faq = page.getByTestId("pricing-faq");
    for (const question of [
      "What counts as a Thumbnail?",
      "What happens when I reach my limit?",
      "Is there overage?",
      "How large can a PDF be?",
    ]) {
      await expect(
        faq.getByRole("heading", { name: question, exact: true }),
      ).toBeVisible();
    }
    await expect(faq).toContainText("10 MB");
    await expect(faq).toContainText(
      "Overage billing starts when paid plans launch. Until then, Free stops at 1,000 Thumbnails a month.",
    );
  });

  test("keeps the overage table and what every plan includes", async ({
    page,
  }) => {
    await expect(page.locator("#overage-pricing")).toBeVisible();
    await expect(page.getByTestId("pricing-every-plan")).toContainText(
      "No watermarks on any plan",
    );
  });
});

test.describe("links to /pricing (#141)", () => {
  test("old /#pricing anchors land on /pricing", async ({ page }) => {
    await page.goto("/#pricing");
    await expect(page).toHaveURL(/\/pricing$/);
    await expect(page.locator("h1")).toHaveText("Pricing");
  });

  test("the landing page has a short teaser that links to /pricing", async ({
    page,
  }) => {
    await page.goto("/");
    const teaser = page.getByTestId("pricing-teaser");
    await expect(teaser).toBeVisible();
    await expect(
      teaser.getByRole("link", { name: /pricing/i }),
    ).toHaveAttribute("href", "/pricing");
    // The cards live on /pricing now.
    await expect(page.getByTestId("pricing-card-free")).toHaveCount(0);
    await expect(page.locator("#overage-pricing")).toHaveCount(0);
  });

  test("the nav, footer and hero point at /pricing", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/");
    await expect(
      page
        .getByRole("banner")
        .getByRole("link", { name: "Pricing", exact: true }),
    ).toHaveAttribute("href", "/pricing");
    await expect(
      page
        .getByRole("contentinfo")
        .getByRole("link", { name: "Pricing", exact: true }),
    ).toHaveAttribute("href", "/pricing");
    await page.getByRole("link", { name: "View Pricing Plans" }).click();
    await expect(page).toHaveURL(/\/pricing$/);
    await expect(page.locator("h1")).toHaveText("Pricing");
  });

  test("the mobile menu's Pricing opens /pricing", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 800 });
    await page.goto("/login");
    await page.getByLabel("Toggle mobile menu").click();
    await page
      .getByLabel("Mobile Menu")
      .getByRole("link", { name: "Pricing" })
      .click();
    await expect(page).toHaveURL(/\/pricing$/);
  });
});

// Every width and both themes: nothing scrolls sideways, and the slider and
// its result stay inside the viewport.
const WIDTHS = [320, 390, 768, 1024, 1440];
for (const width of WIDTHS) {
  for (const colorScheme of ["light", "dark"] as const) {
    test(`/pricing fits ${width}px, ${colorScheme} (#141)`, async ({
      page,
    }) => {
      await page.emulateMedia({ colorScheme });
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/pricing");
      await expect(page.locator("h1")).toBeVisible();
      await page.evaluate(() => document.fonts.ready);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - window.innerWidth,
      );
      expect(
        overflow,
        describeOverflow(await widestOverflow(page.locator("html"), width)),
      ).toBeLessThanOrEqual(0);
      for (const testId of [
        "volume-slider",
        "volume-result",
        "pricing-band",
        "pricing-faq",
        ...SELF_SERVE.map((id) => `pricing-card-${id}`),
      ]) {
        const box = await page
          .getByTestId(testId)
          .evaluate((el) => el.getBoundingClientRect());
        expect(box.left, `${testId} at ${width}px`).toBeGreaterThanOrEqual(0);
        expect(box.right, `${testId} at ${width}px`).toBeLessThanOrEqual(width);
      }
    });
  }
}
