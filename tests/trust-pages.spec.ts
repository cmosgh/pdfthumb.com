import { expect, test, type Page } from "@playwright/test";

// #144 part 1: the trust pages exist, the footer reaches them, and no
// internal link anywhere is a dead anchor or leads nowhere.

// Every public page, and so every page whose links we follow.
const PUBLIC_PAGES = [
  "/",
  "/docs",
  "/login",
  "/terms",
  "/privacy",
  "/security",
  "/subprocessors",
  "/status",
];

// The internal links on a page: same origin, as path + hash.
async function internalLinks(page: Page) {
  // A disabled call to action (aria-disabled, the click swallowed) isn't a
  // link anyone can follow.
  return page
    .locator('a[href]:not([aria-disabled="true"])')
    .evaluateAll((anchors) =>
      anchors
        .map((a) => a.getAttribute("href")!)
        .filter(
          (href) => !/^(mailto:|tel:|https?:\/\/(?!localhost))/.test(href),
        ),
    );
}

test.describe("internal links", () => {
  for (const path of PUBLIC_PAGES) {
    test(`every internal link on ${path} resolves (#144)`, async ({ page }) => {
      await page.goto(path);
      await expect(page.locator("footer")).toBeVisible();
      const links = [...new Set(await internalLinks(page))];
      expect(links.length).toBeGreaterThan(0);
      for (const href of links) {
        // "#" and "#something" on a page that lacks it are dead anchors.
        expect(href, `on ${path}`).not.toBe("#");
        expect(href, `on ${path}`).not.toBe("");
        const url = new URL(href, page.url());
        // The dashboard needs a login; its links are covered by its specs.
        if (url.pathname.startsWith("/dashboard")) continue;
        const target = await page.context().newPage();
        await target.goto(url.pathname + url.search);
        await expect(
          target.getByTestId("not-found"),
          `${href} on ${path}`,
        ).toHaveCount(0);
        await expect(target.locator("footer")).toBeVisible();
        if (url.hash) {
          await expect(
            target.locator(`[id="${url.hash.slice(1)}"]`),
            `${href} on ${path}`,
          ).toHaveCount(1);
        }
        await target.close();
      }
    });
  }

  test("an unknown path shows a not-found page", async ({ page }) => {
    await page.goto("/no-such-page");
    await expect(page.getByTestId("not-found")).toBeVisible();
    await expect(page.getByTestId("not-found")).toContainText(
      "This page doesn't exist",
    );
    await expect(
      page.getByTestId("not-found").getByRole("link", { name: "home page" }),
    ).toHaveAttribute("href", "/");
  });
});

test.describe("footer", () => {
  test("reaches Status, Terms, Privacy, Security and Subprocessors", async ({
    page,
  }) => {
    await page.goto("/");
    const footer = page.locator("footer");
    for (const [name, href] of [
      ["API Status", "/status"],
      ["Terms of Service", "/terms"],
      ["Privacy Policy", "/privacy"],
      ["Security", "/security"],
      ["Subprocessors", "/subprocessors"],
    ]) {
      await expect(footer.getByRole("link", { name })).toHaveAttribute(
        "href",
        href,
      );
    }
  });
});

test.describe("holding pages", () => {
  for (const [path, heading, sentence] of [
    ["/terms", "Terms of Service", "Our Terms of Service are being finalised."],
    ["/privacy", "Privacy Policy", "Our Privacy Policy is being finalised."],
  ]) {
    test(`${path} says plainly that it isn't ready`, async ({ page }) => {
      await page.goto(path);
      await expect(page.locator("h1")).toHaveText(heading);
      const body = page.getByTestId("holding-page");
      await expect(body).toContainText(sentence);
      await expect(body).toContainText("Questions: support@pdfthumb.com");
      await expect(page).toHaveTitle(new RegExp(`^${heading} \\|`));
    });
  }
});

// #144 part 2: the landing page points at /security from the hero and the
// pricing section.
test.describe("links to /security", () => {
  test("sit near the hero's calls to action and in the pricing section", async ({
    page,
  }) => {
    await page.goto("/");
    for (const testId of ["hero-security-link", "pricing-security-link"]) {
      await expect(page.getByTestId(testId)).toHaveAttribute(
        "href",
        "/security",
      );
    }
  });
});

// Words a trust page must not say: each one claims more than the BE
// fact-checks on #144 allow (ZIPs touch disk; no own encryption at rest,
// deletion endpoint, key expiry, GitHub sign-in or certification).
const OVERCLAIMS = [
  /never stored/i,
  /in memory, never/i,
  /encrypted at rest/i,
  /is encrypted at rest/i,
  /plaintext/i,
  /GitHub/i,
  /expiry date/i,
  /delete your account/i,
  /SOC ?2 (certified|compliant)/i,
  /ISO ?27001 (certified|compliant)/i,
  /GDPR[- ]compliant/i,
];

test.describe("/security", () => {
  test("is a real page, not a holding page", async ({ page }) => {
    await page.goto("/security");
    await expect(page.locator("h1")).toHaveText("Security");
    await expect(page).toHaveTitle(/^Security \|/);
    await expect(page.getByTestId("holding-page")).toHaveCount(0);
  });

  test("has a section per topic, each reachable by anchor", async ({
    page,
  }) => {
    await page.goto("/security");
    for (const [id, heading] of [
      ["files", "Your files"],
      ["hosting", "Where we run"],
      ["transport", "In transit"],
      ["api-keys", "API keys"],
      ["sign-in", "Sign-in and sessions"],
      ["logs", "What we log"],
      ["not-yet", "What we don't have yet"],
      ["report", "Reporting a problem"],
    ]) {
      const section = page.locator(`section[id="${id}"]`);
      await expect(section.locator("h2")).toHaveText(heading);
      await expect(
        page.getByTestId("security-toc").getByRole("link", { name: heading }),
      ).toHaveAttribute("href", `#${id}`);
    }
  });

  test("says what it can stand behind, and no more", async ({ page }) => {
    await page.goto("/security");
    const main = page.getByTestId("trust-page");
    await expect(main).toContainText("Germany");
    await expect(main).toContainText("support@pdfthumb.com");
    for (const overclaim of OVERCLAIMS) {
      await expect(main).not.toContainText(overclaim);
    }
  });
});

test.describe("/subprocessors", () => {
  test("lists each subprocessor with its purpose and data", async ({
    page,
  }) => {
    await page.goto("/subprocessors");
    await expect(page.locator("h1")).toHaveText("Subprocessors");
    await expect(page).toHaveTitle(/^Subprocessors \|/);
    await expect(page.getByTestId("holding-page")).toHaveCount(0);
    const table = page.getByRole("table");
    await expect(table.getByRole("columnheader")).toHaveText([
      "Subprocessor",
      "Purpose",
      "Data",
    ]);
    await expect(table.getByRole("rowheader")).toHaveText([
      "Hetzner Online GmbH",
      "Google",
      "Namecheap",
    ]);
    await expect(table.locator("tbody tr").first()).toContainText("Germany");
  });

  test("says what isn't used, and no more", async ({ page }) => {
    await page.goto("/subprocessors");
    const main = page.getByTestId("trust-page");
    await expect(main).not.toContainText(/Stripe/);
    for (const overclaim of OVERCLAIMS) {
      await expect(main).not.toContainText(overclaim);
    }
  });
});

test.describe("/status", () => {
  const CHECKED_AT = new Date("2026-09-25T22:10:00Z");

  async function mockHealth(page: Page, live: number, ready: number) {
    for (const [name, status] of [
      ["live", live],
      ["ready", ready],
    ] as const) {
      await page.route(`**/api/health/${name}`, (route) =>
        route.fulfill({
          status,
          json:
            status === 200
              ? { status: "ok", timestamp: CHECKED_AT.toISOString() }
              : { status: "error" },
        }),
      );
    }
  }

  test("shows Operational when the API is live and ready", async ({ page }) => {
    await page.clock.setFixedTime(CHECKED_AT);
    await mockHealth(page, 200, 200);
    await page.goto("/status");
    await expect(page.locator("h1")).toHaveText("API Status");
    await expect(page.getByTestId("status-overall")).toHaveText("Operational");
    await expect(page.getByTestId("status-checked-at")).toHaveText(
      "Checked 25 Sep 2026, 22:10 UTC",
    );
  });

  test("shows Degraded when the API isn't ready", async ({ page }) => {
    await mockHealth(page, 200, 503);
    await page.goto("/status");
    await expect(page.getByTestId("status-overall")).toHaveText("Degraded");
    await expect(page.getByTestId("status-ready")).toContainText("No");
    await expect(page.getByTestId("status-live")).toContainText("Yes");
  });

  test("shows Degraded when the API can't be reached", async ({ page }) => {
    await page.route("**/api/health/*", (route) => route.abort());
    await page.goto("/status");
    await expect(page.getByTestId("status-overall")).toHaveText("Degraded");
  });

  test("claims no history or uptime", async ({ page }) => {
    await mockHealth(page, 200, 200);
    await page.goto("/status");
    await expect(page.getByTestId("status-overall")).toHaveText("Operational");
    await expect(page.locator("main")).not.toContainText("%");
    await expect(page.locator("main")).not.toContainText(/uptime/i);
  });
});
