import { readdirSync, readFileSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";
import Ajv2020 from "ajv/dist/2020.js";

// Runtime themes (#138). In the image, nginx inlines the selected theme into
// index.html through an SSI include (nginx/default.conf). vite preview has no
// SSI, so these tests do nginx's part: they serve the built page with the
// include replaced by a theme's JSON. Same build, different theme.

// The theme's <script> in index.html, and the SSI include inside it.
const SSI_SLOT =
  /<script type="application\/json" id="pt-theme">\s*<!--# include virtual="\/theme.json" -->\s*<\/script>/;
const SSI_INCLUDE = '<!--# include virtual="/theme.json" -->';

// tokens.css's light --pt-accent (indigo-600). The built CSS is minified, so
// tests compare it as the browser resolves it.
const DEFAULT_ACCENT = "oklch(51.1% 0.262 276.966)";

const readJson = (path: string) => JSON.parse(readFileSync(path, "utf8"));
const evergreen = readJson("public/themes/evergreen.json");
const defaultTheme = readJson("public/themes/default.json");
const shippedThemes = readdirSync("public/themes")
  .filter((file) => file.endsWith(".json") && file !== "theme.schema.json")
  .map((file) => readJson(`public/themes/${file}`));
const schema = readJson("public/themes/theme.schema.json");

// Every --pt-* token tokens.css declares.
const cssTokens = [
  ...new Set(
    [
      ...readFileSync("src/tokens.css", "utf8").matchAll(
        /^\s*--pt-([a-z0-9-]+)\s*:/gm,
      ),
    ].map((m) => m[1]),
  ),
].sort();

// Serves every page with the SSI include replaced by `theme` (raw text, so a
// test can also hand over broken JSON).
async function serveTheme(page: Page, theme: string) {
  await page.route("**/*", async (route) => {
    if (route.request().resourceType() !== "document") return route.fallback();
    const response = await route.fetch();
    const html = await response.text();
    expect(html).toMatch(SSI_SLOT);
    await route.fulfill({
      response,
      body: html.replace(SSI_INCLUDE, () => theme),
    });
  });
}

const darkMode = (page: Page) =>
  page.addInitScript(() => localStorage.setItem("theme", "dark"));

const token = (page: Page, name: string) =>
  page.evaluate(
    (n) =>
      getComputedStyle(document.documentElement)
        .getPropertyValue(`--pt-${n}`)
        .trim(),
    name,
  );

// The computed rgb() of a CSS colour, as the browser resolves it.
const rgb = (page: Page, colour: string) =>
  page.evaluate((c) => {
    const probe = document.createElement("div");
    probe.style.color = c;
    document.body.append(probe);
    const value = getComputedStyle(probe).color;
    probe.remove();
    return value;
  }, colour);

// The logo showing: the light and dark ones both render, CSS hides one.
const navLogo = (page: Page) =>
  page.locator("header").getByTestId("brand-logo").filter({ visible: true });

test.describe("Runtime themes", () => {
  test("the built page carries the SSI include nginx fills", async ({
    request,
  }) => {
    const html = await (await request.get("/")).text();
    expect(html).toMatch(SSI_SLOT);
  });

  test("without a theme the default tokens and logo stay", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("html")).not.toHaveAttribute("data-theme");
    expect(await rgb(page, await token(page, "accent"))).toBe(
      await rgb(page, DEFAULT_ACCENT),
    );
    await expect(navLogo(page)).toHaveCount(0);
  });

  test("the sample theme changes the tokens, fonts and logo in light mode", async ({
    page,
  }) => {
    await serveTheme(page, JSON.stringify(evergreen));
    await page.goto("/");

    await expect(page.locator("html")).toHaveAttribute(
      "data-theme",
      "evergreen",
    );
    expect(await token(page, "accent")).toBe(evergreen.light.accent);
    expect(await token(page, "radius-lg")).toBe(evergreen.light["radius-lg"]);
    const body = page.locator("body");
    await expect(body).toHaveCSS(
      "background-color",
      await rgb(page, evergreen.light.page),
    );
    // WebKit drops the quotes around a family name when it serializes.
    const unquoted = (families: string) => families.replaceAll('"', "");
    expect(
      unquoted(await body.evaluate((el) => getComputedStyle(el).fontFamily)),
    ).toBe(unquoted(evergreen.light["font-sans"]));
    await expect(navLogo(page)).toHaveAttribute("src", evergreen.logo.light);
  });

  test("the sample theme applies its dark values and dark logo", async ({
    page,
  }) => {
    await darkMode(page);
    await serveTheme(page, JSON.stringify(evergreen));
    await page.goto("/");

    await expect(page.locator("html")).toHaveClass(/\bdark\b/);
    expect(await token(page, "accent")).toBe(evergreen.dark.accent);
    await expect(page.locator("body")).toHaveCSS(
      "background-color",
      await rgb(page, evergreen.dark.page),
    );
    // A light value also applies in dark where the default dark theme sets
    // nothing (font-sans).
    expect(await token(page, "font-sans")).toBe(evergreen.light["font-sans"]);
    await expect(navLogo(page)).toHaveAttribute("src", evergreen.logo.dark);
  });

  test("the theme is in place before the body is parsed, so the default never paints", async ({
    page,
  }) => {
    await page.addInitScript(() => {
      new MutationObserver((_, observer) => {
        if (!document.body) return;
        observer.disconnect();
        (window as unknown as { __pageAtBody: string }).__pageAtBody =
          getComputedStyle(document.documentElement)
            .getPropertyValue("--pt-page")
            .trim();
      }).observe(document, { childList: true, subtree: true });
    });
    await serveTheme(page, JSON.stringify(evergreen));
    await page.goto("/");

    expect(
      await page.evaluate(
        () => (window as unknown as { __pageAtBody: string }).__pageAtBody,
      ),
    ).toBe(evergreen.light.page);
  });

  test("an invalid value falls back to the default for that token only", async ({
    page,
  }) => {
    await page.goto("/");
    const defaults = {
      accent: await token(page, "accent"),
      radiusLg: await token(page, "radius-lg"),
    };

    await serveTheme(
      page,
      JSON.stringify({
        name: "partial",
        logo: { light: "javascript:alert(1)" },
        light: {
          page: "#123456",
          accent: "not-a-colour",
          "radius-lg": "red",
          bogus: "#fff",
        },
        dark: "not-an-object",
      }),
    );
    await page.goto("/");

    await expect(page.locator("html")).toHaveAttribute("data-theme", "partial");
    expect(await token(page, "page")).toBe("#123456");
    expect(await token(page, "accent")).toBe(defaults.accent);
    expect(await token(page, "radius-lg")).toBe(defaults.radiusLg);
    expect(await token(page, "bogus")).toBe("");
    await expect(navLogo(page)).toHaveCount(0);
  });

  test("broken theme JSON leaves the default theme and a working page", async ({
    page,
  }) => {
    await serveTheme(page, '{"name": "broken", "light": {');
    await page.goto("/");

    await expect(
      page.getByRole("heading", { name: /Instant PDF Thumbnails/i }),
    ).toBeVisible();
    await expect(page.locator("html")).not.toHaveAttribute("data-theme");
    expect(await rgb(page, await token(page, "accent"))).toBe(
      await rgb(page, DEFAULT_ACCENT),
    );
  });

  test("the schema lists exactly the tokens tokens.css declares", () => {
    expect(Object.keys(schema.$defs.tokens.properties).sort()).toEqual(
      cssTokens,
    );
  });

  test("the shipped themes match the schema and hold valid CSS", async ({
    page,
  }) => {
    const validate = new Ajv2020().compile(schema);
    for (const theme of shippedThemes) {
      expect(validate(theme), JSON.stringify(validate.errors)).toBe(true);
    }
    expect(defaultTheme.light).toEqual({});
    expect(defaultTheme.dark).toEqual({});

    await page.goto("/");
    const invalid = await page.evaluate(
      (modes) => {
        const property = (name: string) =>
          name.startsWith("font-")
            ? "font-family"
            : name.startsWith("radius-")
              ? "border-radius"
              : "color";
        return modes.flatMap((tokens) =>
          Object.entries(tokens as Record<string, string>)
            .filter(([name, value]) => !CSS.supports(property(name), value))
            .map(([name]) => name),
        );
      },
      shippedThemes.flatMap((theme) => [theme.light, theme.dark]),
    );
    expect(invalid).toEqual([]);
  });
});
