import { readFileSync } from "node:fs";
import path from "node:path";
import { expect, test } from "@playwright/test";
import { API_ROUTES, SNIPPET_LANGUAGES } from "@/docs/apiReference.ts";

// The route reference on /docs (#126, part 2). The examples live in
// docs-snippets/ and are checked here against the live OpenAPI spec, so a
// backend change to a path, header or field breaks the build.

const SPEC_URL = "https://pdfthumb.com/api/swagger-json";
const SNIPPET_DIR = path.join(process.cwd(), "docs-snippets");

interface SpecParameter {
  name: string;
  in: string;
  required?: boolean;
  schema?: { minimum?: number; maximum?: number };
}
interface SpecOperation {
  parameters?: SpecParameter[];
  security?: Record<string, string[]>[];
  requestBody?: {
    content: Record<
      string,
      { schema: { properties: Record<string, unknown> } }
    >;
  };
}
interface Spec {
  paths: Record<string, Record<string, SpecOperation>>;
  components: {
    securitySchemes: Record<string, { in: string; name: string }>;
  };
}

test.describe("route reference against the live spec (#126)", () => {
  let spec: Spec;
  test.beforeAll(async ({ request }) => {
    const response = await request.get(SPEC_URL);
    expect(response.ok()).toBe(true);
    spec = await response.json();
  });

  for (const route of API_ROUTES) {
    const operation = () => {
      const op = spec.paths[route.path]?.[route.method.toLowerCase()];
      expect(op, `${route.method} ${route.path} in the spec`).toBeDefined();
      return op!;
    };

    test(`${route.path}: the fields match the spec`, () => {
      const op = operation();
      const query = (op.parameters ?? []).filter((p) => p.in === "query");
      const documented = route.fields.filter((f) => f.in === "query");
      expect(documented.map((f) => f.name).sort()).toEqual(
        query.map((p) => p.name).sort(),
      );
      for (const field of documented) {
        const param = query.find((p) => p.name === field.name)!;
        expect(field.minimum).toBe(param.schema?.minimum);
        expect(field.maximum).toBe(param.schema?.maximum);
      }
      const form = op.requestBody?.content["multipart/form-data"];
      expect(Object.keys(form?.schema.properties ?? {})).toEqual(
        route.fields.filter((f) => f.in === "form").map((f) => f.name),
      );
      // The header every example sends is the spec's API-key scheme.
      const schemes = (op.security ?? []).flatMap((s) => Object.keys(s));
      expect(schemes).toContain("x-api-key");
      expect(spec.components.securitySchemes["x-api-key"]).toMatchObject({
        in: "header",
        name: "x-api-key",
      });
    });

    for (const language of SNIPPET_LANGUAGES) {
      test(`${route.path}: the ${language.label} example matches`, () => {
        const source = readFileSync(
          path.join(SNIPPET_DIR, route.id, language.file),
          "utf8",
        );
        const op = operation();
        const url = source.match(
          /https:\/\/pdfthumb\.com(\/api\/[^"'?\s]+)(\?[^"'\s]*)?/,
        );
        expect(url, "the example calls the production API").not.toBeNull();
        expect(url![1]).toBe(route.path);
        // Every query field the example sends exists in the spec, and it
        // sends every required one.
        const sent = [...(url![2] ?? "").matchAll(/[?&]([^=&]+)=/g)].map(
          (m) => m[1],
        );
        const params = (op.parameters ?? []).filter((p) => p.in === "query");
        for (const name of sent) {
          expect(params.map((p) => p.name)).toContain(name);
        }
        for (const required of route.fields.filter(
          (f) => f.in === "query" && f.required,
        )) {
          expect(sent).toContain(required.name);
        }
        expect(source).toContain("x-api-key");
        for (const field of Object.keys(
          op.requestBody?.content["multipart/form-data"]?.schema.properties ??
            {},
        )) {
          expect(source).toMatch(
            new RegExp(`["']${field}["'=]|name=\\\\"${field}\\\\"|${field}=@`),
          );
        }
        if (route.id === "count" && language.id !== "curl") {
          expect(source).toContain("pageCount");
        }
      });
    }
  }
});

test.describe("route reference on /docs (#126)", () => {
  test("documents each route with fields, response and errors", async ({
    page,
  }) => {
    await page.goto("/docs");
    for (const route of API_ROUTES) {
      const section = page.getByTestId(`docs-route-${route.id}`);
      await expect(
        section.getByRole("heading", { name: `POST ${route.path}` }),
      ).toBeVisible();
      for (const field of route.fields) {
        await expect(section.getByTestId("docs-fields")).toContainText(
          field.name,
        );
      }
      await expect(section).toContainText(route.response.contentType);
      for (const status of [400, 401, 403, 413, 429]) {
        await expect(section.getByTestId("docs-errors")).toContainText(
          String(status),
        );
      }
    }
  });

  test("offers the example in seven languages, curl first", async ({
    page,
  }) => {
    await page.goto("/docs");
    const section = page.getByTestId("docs-route-page");
    await expect(section.getByRole("tab")).toHaveText([
      "curl",
      "TypeScript",
      "Python",
      "C#",
      "Java",
      "Go",
      "PHP",
    ]);
    await expect(section.getByTestId("docs-snippet")).toContainText(
      "curl -X POST",
    );
  });

  test("remembers the chosen language across routes and visits", async ({
    page,
  }) => {
    await page.goto("/docs");
    await page
      .getByTestId("docs-route-zip")
      .getByRole("tab", { name: "Python" })
      .click();
    for (const id of ["page", "zip", "count"]) {
      const snippet = page
        .getByTestId(`docs-route-${id}`)
        .getByTestId("docs-snippet");
      await expect(snippet).toHaveAttribute("data-language", "python");
      await expect(snippet).toContainText("import requests");
    }
    await page.reload();
    await expect(
      page.getByTestId("docs-route-count").getByRole("tab", { name: "Python" }),
    ).toHaveAttribute("aria-selected", "true");
  });

  test("the tabs label their panel and move with the arrow keys", async ({
    page,
  }) => {
    await page.goto("/docs");
    const section = page.getByTestId("docs-route-page");
    const curl = section.getByRole("tab", { name: "curl" });
    const panel = section.getByRole("tabpanel");
    const panelId = await panel.getAttribute("id");
    expect(panelId).toBeTruthy();
    await expect(curl).toHaveAttribute("aria-controls", panelId!);
    await expect(panel).toHaveAttribute(
      "aria-labelledby",
      (await curl.getAttribute("id"))!,
    );
    // Only the selected tab is in the tab order.
    await expect(curl).toHaveAttribute("tabindex", "0");
    await expect(section.getByRole("tab", { name: "PHP" })).toHaveAttribute(
      "tabindex",
      "-1",
    );
    await curl.focus();
    await page.keyboard.press("ArrowRight");
    const typescript = section.getByRole("tab", { name: "TypeScript" });
    await expect(typescript).toBeFocused();
    await expect(typescript).toHaveAttribute("aria-selected", "true");
    await page.keyboard.press("ArrowLeft");
    await page.keyboard.press("ArrowLeft");
    await expect(section.getByRole("tab", { name: "PHP" })).toBeFocused();
  });

  test("the landing page promises examples, not client libraries", async ({
    page,
  }) => {
    await page.goto("/");
    const features = page.locator("#features");
    await expect(features).not.toContainText(/client librar/i);
    // The driver's exact wording (#126).
    await expect(
      features.getByText(
        "Simple REST API with an OpenAPI reference and examples in seven languages",
        { exact: true },
      ),
    ).toHaveCount(1);
  });
});
