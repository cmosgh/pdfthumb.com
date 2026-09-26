import { API_LIMITS, APP_NAME, SWAGGER_URL } from "../constants.ts";
import { pageThumbnailCurl } from "../utils/curl.ts";
import {
  API_ROUTES,
  ERROR_CODES,
  type ApiRoute,
  type ErrorCodeDoc,
  type RouteError,
  type RouteField,
} from "./apiReference.ts";

// The /docs prose as data (#142). The page renders it, Copy as Markdown
// serializes it (markdown.ts) and search indexes it (search.ts), so the
// three can't drift apart. The route reference comes from API_ROUTES and
// ERROR_CODES the same way.

// Inline text: plain, inline code, a link, or an in-app router link.
export type Span =
  | string
  | { code: string }
  | { href: string; text: Span[] }
  | { to: "/dashboard/settings"; text: Span[] };

export type Block =
  { kind: "p"; spans: Span[] } | { kind: "ul"; items: Span[][] };

// A code block; lang is the Markdown fence's language.
export interface CodeSampleDoc {
  code: string;
  lang: string;
  testId?: string;
}

export interface ProseSection {
  id: string;
  // The sidebar label; title is the heading.
  nav: string;
  title: string;
  blocks: Block[];
  // Shown in the code panel beside the prose.
  code?: CodeSampleDoc;
  testId?: string;
}

const code = (text: string) => ({ code: text });
const link = (href: string, ...text: Span[]) => ({ href, text });

export const DOCS_TITLE = "Documentation";

export const DOCS_INTRO: Span[] = [
  `${APP_NAME} turns PDFs into thumbnails over a REST API. This page gets you to a first thumbnail; the API reference lists every endpoint, parameter and response.`,
];

export const SWAGGER_LINK = {
  href: SWAGGER_URL,
  label: "Open the API reference (Swagger)",
};

// The page's anchors. #first-request is linked from the dashboard's
// first-thumbnail checklist (#143), #error-CODE from usage (#149).
export const routeAnchor = (route: ApiRoute) => `ref-${route.id}`;
export const paramAnchor = (route: ApiRoute, field: RouteField) =>
  `ref-${route.id}-param-${field.name}`;
export const errorAnchor = (error: ErrorCodeDoc) => `error-${error.code}`;

// The quickstart follows the backend's thumbnail controller and the live
// OpenAPI spec (#126). The reference below has an example per language,
// and Swagger's "Try it out" runs them.
const ENDPOINT_TEXT: Record<ApiRoute["id"], Span[]> = {
  page: ["one page as a JPEG. ", code("page"), " is 1-based and required."],
  zip: ["every page as JPEGs in a ZIP; each page counts as one Thumbnail."],
  count: [
    "the page count as ",
    code('{"pageCount":12}'),
    "; it doesn't use your quota.",
  ],
};

export const QUICKSTART_LABEL = "Quickstart";

export const QUICKSTART: ProseSection[] = [
  {
    id: "api-key",
    nav: "Get an API key",
    title: "1. Get an API key",
    blocks: [
      {
        kind: "p",
        spans: [
          "Sign in and create a key under ",
          { to: "/dashboard/settings", text: ["Dashboard → Settings"] },
          ". The full key is shown only once, when you create it, so store it somewhere safe. You can revoke it there at any time.",
        ],
      },
    ],
  },
  {
    id: "authentication",
    nav: "Authentication",
    title: "2. Authenticate",
    blocks: [
      {
        kind: "p",
        spans: [
          "Send the key in the ",
          code("x-api-key"),
          " header on every request. The examples read it from the ",
          code("PDFTHUMB_API_KEY"),
          " environment variable:",
        ],
      },
    ],
    code: { code: 'export PDFTHUMB_API_KEY="your-api-key"', lang: "bash" },
  },
  {
    id: "first-request",
    nav: "First request",
    title: "3. Make a request",
    blocks: [
      {
        kind: "p",
        spans: [
          "Upload the PDF as multipart form data in the ",
          code("file"),
          " field. The example renders page 1 at 400 px wide.",
        ],
      },
      {
        kind: "p",
        spans: [
          code("width"),
          " is optional, and the height follows the page's aspect ratio. The API has three endpoints, each answering ",
          code("201 Created"),
          ":",
        ],
      },
      {
        kind: "ul",
        items: API_ROUTES.map((route) => [
          link(`#${routeAnchor(route)}`, code(`POST ${route.path}`)),
          ": ",
          ...ENDPOINT_TEXT[route.id],
        ]),
      },
      {
        kind: "p",
        spans: [
          "The ",
          link("#reference", "reference"),
          " below documents each one, with examples in curl, TypeScript, Python, C#, Java, Go and PHP. In the ",
          link(SWAGGER_URL, "Swagger API reference"),
          " you can run them with your key.",
        ],
      },
    ],
    code: {
      code: pageThumbnailCurl("document.pdf"),
      lang: "bash",
      testId: "docs-first-request",
    },
  },
];

const { maxUploadMB, minWidthPx, maxWidthPx } = API_LIMITS;

export const LIMITS: ProseSection = {
  id: "limits",
  nav: "Limits",
  title: "Limits",
  blocks: [
    {
      kind: "ul",
      items: [
        [`PDFs up to ${maxUploadMB} MB, depending on your plan.`],
        [
          code("width"),
          ` is a whole number of pixels from ${minWidthPx.toLocaleString("en-US")} to ${maxWidthPx.toLocaleString("en-US")}.`,
        ],
        [
          "Each plan includes a monthly number of Thumbnails (see ",
          link("/pricing", "pricing"),
          ") and caps the pages in one ZIP. The quota resets monthly, on the day your plan started, at 00:00 UTC.",
        ],
        [
          "Requests are rate-limited per minute. Past the limit you get ",
          code("429"),
          " with a ",
          code("Retry-After"),
          " header saying how many seconds to wait.",
        ],
      ],
    },
  ],
};

export const ERRORS = {
  id: "errors",
  nav: "Errors",
  title: "Error codes",
  blocks: [
    {
      kind: "p",
      spans: [
        "Every error is JSON with ",
        code("statusCode"),
        ", a human-readable ",
        code("message"),
        " and a stable ",
        code("code"),
        ". Branch on ",
        code("code"),
        ", not on the message, whose words may change. Some codes carry an extra field: ",
        code("retryAfterSeconds"),
        ", ",
        code("limitMB"),
        " or ",
        code("feature"),
        ".",
      ],
    },
    {
      kind: "p",
      spans: [
        "New codes may be added. A code isn't renamed or removed without notice. Treat an unknown code by its HTTP status.",
      ],
    },
  ] as Block[],
  columns: ["Code", "Status", "Meaning", "What to do"],
  codes: ERROR_CODES,
};

export const LIMITS_LABEL = "Limits and errors";

export const REFERENCE = {
  id: "reference",
  nav: "API reference",
  title: "API reference",
  routes: API_ROUTES,
};

// The fixed words of each route's reference, shared by the page and the
// Markdown.
export const ROUTE_AUTH: Span[] = [
  "Authenticate with the ",
  code("x-api-key"),
  " header.",
];
export const FIELD_COLUMNS = ["Field", "In", "Type", "Description"];
export const fieldIn = (field: RouteField) =>
  field.in === "form" ? "form data" : "query";
export const fieldRequired = (field: RouteField) =>
  field.required ? "required" : "optional";
export const routeResponse = (route: ApiRoute): Span[] => [
  code(`${route.response.status} Created`),
  ", ",
  code(route.response.contentType),
  `: ${route.response.description}`,
];
export const routeError = (error: RouteError): Span[] => [
  code(String(error.status)),
  " ",
  ...error.codes.flatMap((c, i) => (i > 0 ? [", ", code(c)] : [code(c)])),
  `: ${error.when}`,
];
export const routeNavLabel = (route: ApiRoute) =>
  `${route.method} ${route.path.replace("/api/thumbnail", "")}`;

// The sidebar: groups of sections; a route lists its parameters.
export interface NavEntry {
  id: string;
  label: string;
  mono?: boolean;
  children?: NavEntry[];
}
export interface NavGroup {
  label: string;
  entries: NavEntry[];
}

export const DOCS_NAV: NavGroup[] = [
  {
    label: QUICKSTART_LABEL,
    entries: QUICKSTART.map((s) => ({ id: s.id, label: s.nav })),
  },
  {
    label: LIMITS_LABEL,
    entries: [
      { id: LIMITS.id, label: LIMITS.nav },
      { id: ERRORS.id, label: ERRORS.nav },
    ],
  },
  {
    label: REFERENCE.nav,
    entries: API_ROUTES.map((route) => ({
      id: routeAnchor(route),
      label: routeNavLabel(route),
      mono: true,
      children: route.fields.map((field) => ({
        id: paramAnchor(route, field),
        label: field.name,
        mono: true,
      })),
    })),
  },
];

// The sections scroll-spy follows: every sidebar entry but the parameters.
export const SPY_IDS = DOCS_NAV.flatMap((group) =>
  group.entries.map((entry) => entry.id),
);

export const spansText = (spans: Span[]): string =>
  spans
    .map((span) =>
      typeof span === "string"
        ? span
        : "code" in span
          ? span.code
          : spansText(span.text),
    )
    .join("");

export const blocksText = (blocks: Block[]): string =>
  blocks
    .map((block) =>
      block.kind === "p"
        ? spansText(block.spans)
        : block.items.map(spansText).join(" "),
    )
    .join(" ");
