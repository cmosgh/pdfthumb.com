import { expect, test, type Page } from "@playwright/test";
import { API_ROUTES } from "@/docs/apiReference.ts";
import { describeOverflow, widestOverflow } from "./overflow-helper";

// The three-pane /docs (#142): a sidebar with scroll-spy, prose, a sticky
// code panel, copy buttons, `/` search and Copy as Markdown.

const DESKTOP = { width: 1280, height: 800 };
const PHONE = { width: 390, height: 800 };

// The sections the sidebar lists, by label and anchor.
const SECTIONS = [
  ["Get an API key", "api-key"],
  ["Authentication", "authentication"],
  ["First request", "first-request"],
  ["Limits", "limits"],
  ["Errors", "errors"],
  ["POST /page", "ref-page"],
  ["POST /zip", "ref-zip"],
  ["POST /count", "ref-count"],
] as const;

// Puts a section's top where a reader lands after following its link,
// without the page's smooth scrolling, once the fonts have settled.
const scrollTo = (page: Page, id: string) =>
  page.evaluate(async (target) => {
    await document.fonts.ready;
    document
      .getElementById(target)!
      .scrollIntoView({ block: "start", behavior: "instant" });
  }, id);

const readClipboard = (page: Page) =>
  page.evaluate(() => navigator.clipboard.readText());

test.describe("three-pane docs on desktop (#142)", () => {
  test.use({ viewport: DESKTOP });

  test("the sidebar lists every section and parameter, each with an anchor", async ({
    page,
  }) => {
    await page.goto("/docs");
    const sidebar = page.getByTestId("docs-sidebar");
    await expect(sidebar).toBeVisible();
    for (const [label, id] of SECTIONS) {
      const link = sidebar.getByRole("link", { name: label, exact: true });
      await expect(link).toHaveAttribute("href", `#${id}`);
      await expect(page.locator(`#${id}`)).toHaveCount(1);
    }
    for (const route of API_ROUTES) {
      for (const field of route.fields) {
        const id = `ref-${route.id}-param-${field.name}`;
        await expect(sidebar.locator(`a[href="#${id}"]`)).toHaveCount(1);
        await expect(page.locator(`#${id}`)).toContainText(field.name);
      }
    }
  });

  test("scroll-spy marks the section in view as current", async ({ page }) => {
    await page.goto("/docs");
    const sidebar = page.getByTestId("docs-sidebar");
    await expect(sidebar).toBeVisible();
    const current = sidebar.locator('[aria-current="location"]');
    for (const [, id] of [SECTIONS[6], SECTIONS[3], SECTIONS[1]]) {
      await scrollTo(page, id);
      await expect(current).toHaveCount(1);
      await expect(current).toHaveAttribute("href", `#${id}`);
    }
  });

  test("the example sits in a sticky panel beside the prose", async ({
    page,
  }) => {
    await page.goto("/docs");
    const panel = page
      .getByTestId("docs-route-page")
      .getByTestId("docs-code-panel");
    await expect(panel).toBeVisible();
    await expect(panel.getByRole("tablist")).toBeVisible();
    expect(await panel.evaluate((el) => getComputedStyle(el).position)).toBe(
      "sticky",
    );
    // Beside the prose, not under it.
    const prose = page
      .getByTestId("docs-route-page")
      .getByRole("heading", { level: 3 });
    const proseBox = (await prose.boundingBox())!;
    const panelBox = (await panel.boundingBox())!;
    expect(panelBox.x).toBeGreaterThan(proseBox.x + 200);
  });

  test("the Search button opens search, and Escape closes it", async ({
    page,
  }) => {
    await page.goto("/docs");
    const button = page.getByTestId("docs-sidebar").getByRole("button", {
      name: /search/i,
    });
    await button.click();
    const dialog = page.getByRole("dialog", { name: /search/i });
    await expect(dialog).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(dialog).toHaveCount(0);
    await expect(button).toBeFocused();
  });
});

test.describe("docs on a phone (#142)", () => {
  test.use({ viewport: PHONE });

  test("one column: no sidebar, and the code panel isn't sticky", async ({
    page,
  }) => {
    await page.goto("/docs");
    await expect(page.getByTestId("docs-sidebar")).toBeHidden();
    const panel = page
      .getByTestId("docs-route-page")
      .getByTestId("docs-code-panel");
    await expect(panel).toBeVisible();
    expect(await panel.evaluate((el) => getComputedStyle(el).position)).toBe(
      "static",
    );
  });

  test("the contents menu opens, closes on Escape and on a link", async ({
    page,
  }) => {
    await page.goto("/docs");
    const button = page.getByRole("button", { name: "Contents" });
    await expect(button).toHaveAttribute("aria-expanded", "false");
    const menu = page.getByTestId("docs-mobile-nav");
    await expect(menu).toBeHidden();

    await button.click();
    await expect(button).toHaveAttribute("aria-expanded", "true");
    await expect(button).toHaveAttribute(
      "aria-controls",
      (await menu.getAttribute("id"))!,
    );
    await expect(menu).toBeVisible();
    await expect(
      menu.getByRole("link", { name: "Get an API key" }),
    ).toBeFocused();

    await page.keyboard.press("Escape");
    await expect(menu).toBeHidden();
    await expect(button).toHaveAttribute("aria-expanded", "false");
    await expect(button).toBeFocused();

    await button.click();
    await menu.getByRole("link", { name: "Errors", exact: true }).click();
    await expect(menu).toBeHidden();
    await expect(page).toHaveURL(/\/docs#errors$/);
    await expect(page.locator("#errors")).toBeInViewport();
  });

  test("a Search button opens search for touch users", async ({ page }) => {
    await page.goto("/docs");
    await page.getByRole("button", { name: /search/i }).click();
    await expect(page.getByRole("dialog", { name: /search/i })).toBeVisible();
  });
});

test.describe("docs features (#142)", () => {
  test("every code block has a copy button", async ({
    page,
    context,
    browserName,
  }) => {
    const clipboard = browserName === "chromium";
    if (clipboard) {
      await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    }
    await page.goto("/docs");
    const blocks = page.getByTestId("docs-page").locator("pre");
    await expect(blocks.first()).toBeVisible();
    const count = await blocks.count();
    expect(count).toBeGreaterThanOrEqual(5);
    const samples = page.getByTestId("docs-page").getByTestId("docs-code");
    await expect(samples).toHaveCount(count);
    for (let i = 0; i < count; i++) {
      const sample = samples.nth(i);
      const button = sample.getByRole("button", { name: "Copy code" });
      await expect(button).toHaveCount(1);
      if (!clipboard) continue;
      await button.click();
      const text = await sample.locator("pre").textContent();
      expect(await readClipboard(page)).toBe(text);
    }
  });

  // The code scrolls sideways, so right padding doesn't keep a long first
  // line clear of the button: the code has to start below it (#178).
  for (const width of [390, 1280]) {
    test(`copy buttons don't cover the code at ${width}px (#178)`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/docs");
      const samples = page.getByTestId("docs-page").getByTestId("docs-code");
      await expect(samples.first()).toBeVisible();
      const overlaps = await samples.evaluateAll((els) =>
        els.flatMap((el, i) => {
          const pre = el.querySelector("pre");
          const button = el.querySelector("button");
          if (!pre || !button) return [`sample ${i}: no pre or button`];
          const preBox = pre.getBoundingClientRect();
          if (preBox.width === 0) return [`sample ${i}: not laid out`];
          const codeTop =
            preBox.top + parseFloat(getComputedStyle(pre).paddingTop);
          const buttonBottom = button.getBoundingClientRect().bottom;
          return codeTop < buttonBottom - 0.5
            ? [
                `sample ${i}: code starts at ${codeTop}, button ends at ${buttonBottom}`,
              ]
            : [];
        }),
      );
      expect(overlaps).toEqual([]);
    });
  }

  test("/ opens search, and a result jumps to its anchor", async ({ page }) => {
    await page.goto("/docs");
    await expect(page.getByTestId("docs-page")).toBeVisible();
    await page.keyboard.press("/");
    const dialog = page.getByRole("dialog", { name: /search/i });
    await expect(dialog).toBeVisible();
    const input = dialog.getByRole("combobox");
    await expect(input).toBeFocused();
    await expect(input).toHaveValue("");

    await input.fill("RATE_LIMITED");
    const options = dialog.getByRole("option");
    await expect(options.first()).toContainText("RATE_LIMITED");
    await expect(options.first()).toHaveAttribute("aria-selected", "true");
    // The arrow keys move the active result.
    await page.keyboard.press("ArrowDown");
    await expect(options.nth(1)).toHaveAttribute("aria-selected", "true");
    await expect(input).toHaveAttribute(
      "aria-activedescendant",
      (await options.nth(1).getAttribute("id"))!,
    );
    await page.keyboard.press("ArrowUp");
    await page.keyboard.press("Enter");

    await expect(dialog).toHaveCount(0);
    await expect(page).toHaveURL(/\/docs#error-RATE_LIMITED$/);
    await expect(page.locator("#error-RATE_LIMITED")).toBeInViewport();
  });

  test("search finds a parameter by its description", async ({ page }) => {
    await page.goto("/docs");
    await expect(page.getByTestId("docs-page")).toBeVisible();
    await page.keyboard.press("/");
    const dialog = page.getByRole("dialog", { name: /search/i });
    await dialog.getByRole("combobox").fill("aspect ratio");
    // The parameter's entry: its name, then its route.
    const option = dialog
      .getByRole("option")
      .filter({ hasText: /^width\s*POST \/api\/thumbnail\/zip/ });
    await option.click();
    await expect(page).toHaveURL(/\/docs#ref-zip-param-width$/);
    await expect(page.locator("#ref-zip-param-width")).toBeInViewport();
  });

  test("/ typed in a text field doesn't open search", async ({ page }) => {
    await page.goto("/docs");
    await expect(page.getByTestId("docs-page")).toBeVisible();
    await page.evaluate(() => {
      const input = document.createElement("input");
      input.setAttribute("data-testid", "probe");
      document.getElementById("api-key")!.append(input);
    });
    const probe = page.getByTestId("probe");
    await probe.focus();
    await page.keyboard.press("/");
    await expect(probe).toHaveValue("/");
    await expect(page.getByRole("dialog")).toHaveCount(0);
  });

  test("Copy as Markdown copies the page as Markdown", async ({
    page,
    context,
    browserName,
  }) => {
    await page.goto("/docs");
    const button = page.getByRole("button", { name: "Copy as Markdown" });
    await expect(button).toBeVisible();
    test.skip(browserName !== "chromium", "reads the clipboard in chromium");
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await button.click();
    const markdown = await readClipboard(page);
    expect(markdown).toMatch(/^# Documentation$/m);
    expect(markdown).toMatch(/^## 3\. Make a request$/m);
    expect(markdown).toMatch(/^### POST \/api\/thumbnail\/zip$/m);
    // The first request as a fenced block.
    expect(markdown).toMatch(
      /^```bash\ncurl -X POST "https:\/\/pdfthumb\.com\/api\/thumbnail\/page/m,
    );
    expect(markdown).toMatch(/^```$/m);
    expect(markdown).toContain("| `RATE_LIMITED` | 429 |");
    expect(markdown).toContain("`x-api-key`");
  });

  test("the dashboard's link to the first request still lands", async ({
    page,
  }) => {
    await page.goto("/docs#first-request");
    await expect(page.locator("#first-request")).toBeInViewport();
    await expect(page.getByTestId("docs-first-request")).toBeVisible();
  });

  for (const width of [320, 390, 768, 1024, 1440]) {
    test(`/docs fits a ${width} px viewport`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/docs");
      await expect(page.getByTestId("docs-page")).toBeVisible();
      await page.evaluate(() => document.fonts.ready);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - window.innerWidth,
      );
      expect(
        overflow,
        describeOverflow(await widestOverflow(page.locator("html"), width)),
      ).toBeLessThanOrEqual(0);
    });
  }
});
