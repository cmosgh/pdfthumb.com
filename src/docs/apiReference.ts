import { API_LIMITS } from "../constants.ts";

// The thumbnail routes the /docs reference documents (#126). The facts
// follow the backend's thumbnail controller; tests/docs-reference.spec.ts
// checks the names, required flags and bounds against the live OpenAPI spec.

export type RouteId = "page" | "zip" | "count";

export interface RouteField {
  name: string;
  in: "query" | "form";
  type: string;
  required: boolean;
  description: string;
  // Only for numeric fields the spec bounds.
  minimum?: number;
  maximum?: number;
}

// The stable `code` on every API error body (#149), in the spec's order.
// tests/docs-reference.spec.ts checks this list against the spec's enum.
export type ErrorCode =
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NO_ACTIVE_SUBSCRIPTION"
  | "PLAN_FEATURE_REQUIRED"
  | "MONTHLY_LIMIT_REACHED"
  | "RATE_LIMITED"
  | "FILE_TOO_LARGE"
  | "PAGE_TOO_LARGE"
  | "ZIP_PAGE_LIMIT"
  | "INVALID_PDF"
  | "INVALID_REQUEST"
  | "TIMEOUT"
  | "SERVICE_UNAVAILABLE"
  | "INTERNAL_ERROR";

export interface ErrorCodeDoc {
  code: ErrorCode;
  statuses: number[];
  meaning: string;
  action: string;
}

export interface RouteError {
  status: number;
  codes: ErrorCode[];
  when: string;
}

export interface ApiRoute {
  id: RouteId;
  method: "POST";
  path: string;
  summary: string;
  fields: RouteField[];
  response: { status: number; contentType: string; description: string };
  errors: RouteError[];
}

const { maxUploadMB, minWidthPx, maxWidthPx } = API_LIMITS;

const FILE: RouteField = {
  name: "file",
  in: "form",
  type: "PDF file",
  required: true,
  description: `The PDF, as multipart/form-data. Up to ${maxUploadMB} MB.`,
};

const WIDTH: RouteField = {
  name: "width",
  in: "query",
  type: "integer",
  required: false,
  minimum: minWidthPx,
  maximum: maxWidthPx,
  description: `Thumbnail width in pixels, from ${minWidthPx} to ${maxWidthPx.toLocaleString("en-US")}; the height follows the page's aspect ratio. Default: 1.33 pixels per point, about 813 px wide for US Letter.`,
};

export const ERROR_CODES: ErrorCodeDoc[] = [
  {
    code: "UNAUTHORIZED",
    statuses: [401],
    meaning: "No valid API key was sent.",
    action: "Send an active key in the x-api-key header.",
  },
  {
    code: "FORBIDDEN",
    statuses: [403],
    meaning: "The key may not make this request.",
    action: "Check you're using the right key.",
  },
  {
    code: "NO_ACTIVE_SUBSCRIPTION",
    statuses: [403],
    meaning: "Your account has no active plan.",
    action: "Choose or renew a plan in the dashboard.",
  },
  {
    code: "PLAN_FEATURE_REQUIRED",
    statuses: [403],
    meaning:
      "Your plan doesn't include a feature the request needs; the feature field names it.",
    action: "Upgrade to a plan that includes it, or leave out that option.",
  },
  {
    code: "MONTHLY_LIMIT_REACHED",
    statuses: [403],
    meaning: "A plan with a hard monthly limit has no Thumbnails left.",
    action:
      "Wait for the monthly reset, on the day your plan started at 00:00 UTC, or upgrade.",
  },
  {
    code: "RATE_LIMITED",
    statuses: [429],
    meaning: "The per-minute request limit is used up.",
    action:
      "Wait the seconds in the retryAfterSeconds field (or the Retry-After header), then retry.",
  },
  {
    code: "FILE_TOO_LARGE",
    statuses: [413],
    meaning: `The PDF is over your plan's maximum size (at most ${maxUploadMB} MB), given in the limitMB field.`,
    action: "Send a smaller file.",
  },
  {
    code: "PAGE_TOO_LARGE",
    statuses: [413],
    meaning: "A page would render too large.",
    action: "Ask for a smaller width.",
  },
  {
    code: "ZIP_PAGE_LIMIT",
    statuses: [413],
    meaning: "The document has more pages than your plan allows in one ZIP.",
    action: "Render pages one at a time with /api/thumbnail/page, or upgrade.",
  },
  {
    code: "INVALID_PDF",
    statuses: [400],
    meaning: "The file isn't a PDF, or can't be read.",
    action: "Check the file opens in a PDF reader.",
  },
  {
    code: "INVALID_REQUEST",
    statuses: [400, 404],
    meaning: "A bad field, a missing file, or an unknown route.",
    action: "Fix the request; the message field says what's wrong.",
  },
  {
    code: "TIMEOUT",
    statuses: [504],
    meaning: "Rendering didn't finish in time.",
    action: "Retry; for a long document, render pages one at a time.",
  },
  {
    code: "SERVICE_UNAVAILABLE",
    statuses: [503],
    meaning: "The renderer is busy.",
    action: "Retry shortly, waiting longer after each attempt.",
  },
  {
    code: "INTERNAL_ERROR",
    statuses: [500],
    meaning: "Something failed on our side.",
    action: "Retry later.",
  },
];

// Every thumbnail route shares these; each route adds its own.
const AUTH_ERRORS: RouteError[] = [
  {
    status: 401,
    codes: ["UNAUTHORIZED"],
    when: "The x-api-key header is missing or the key is invalid.",
  },
  {
    status: 403,
    codes: ["NO_ACTIVE_SUBSCRIPTION", "MONTHLY_LIMIT_REACHED", "FORBIDDEN"],
    when: "No active plan, the monthly Thumbnails used up on a plan with a hard limit, or the key may not make this request.",
  },
];
const TOO_LARGE: RouteError = {
  status: 413,
  codes: ["FILE_TOO_LARGE"],
  when: `The file is over your plan's maximum size (at most ${maxUploadMB} MB).`,
};
const RATE_LIMITED: RouteError = {
  status: 429,
  codes: ["RATE_LIMITED"],
  when: "Too many requests this minute. Retry after retryAfterSeconds, also sent as the Retry-After header.",
};
const INTERNAL: RouteError = {
  status: 500,
  codes: ["INTERNAL_ERROR"],
  when: "Something failed on our side.",
};
const RENDER_ERRORS: RouteError[] = [
  {
    status: 503,
    codes: ["SERVICE_UNAVAILABLE"],
    when: "The renderer is busy. Retry shortly.",
  },
  {
    status: 504,
    codes: ["TIMEOUT"],
    when: "Rendering didn't finish in time.",
  },
];
const NOT_A_PDF = "The file isn't a PDF, or can't be read.";

export const API_ROUTES: ApiRoute[] = [
  {
    id: "page",
    method: "POST",
    path: "/api/thumbnail/page",
    summary:
      "Renders one page of the PDF as a JPEG. It counts as one Thumbnail.",
    fields: [
      FILE,
      {
        name: "page",
        in: "query",
        type: "integer",
        required: true,
        description: "The page to render, starting at 1.",
      },
      WIDTH,
    ],
    response: {
      status: 201,
      contentType: "image/jpeg",
      description: "The thumbnail.",
    },
    errors: [
      {
        status: 400,
        codes: ["INVALID_PDF", "INVALID_REQUEST"],
        when: `${NOT_A_PDF} Or no file, page is below 1 or past the last page, or width is outside ${minWidthPx}–${maxWidthPx}.`,
      },
      ...AUTH_ERRORS,
      {
        ...TOO_LARGE,
        codes: ["FILE_TOO_LARGE", "PAGE_TOO_LARGE"],
        when: `${TOO_LARGE.when} Or the page would render too large.`,
      },
      RATE_LIMITED,
      INTERNAL,
      ...RENDER_ERRORS,
    ],
  },
  {
    id: "zip",
    method: "POST",
    path: "/api/thumbnail/zip",
    summary:
      "Renders every page of the PDF and returns the JPEGs in one ZIP. Each page counts as one Thumbnail.",
    fields: [FILE, WIDTH],
    response: {
      status: 201,
      contentType: "application/zip",
      description: "A ZIP with one JPEG per page.",
    },
    errors: [
      {
        status: 400,
        codes: ["INVALID_PDF", "INVALID_REQUEST"],
        when: `${NOT_A_PDF} Or no file, or width is outside ${minWidthPx}–${maxWidthPx}.`,
      },
      ...AUTH_ERRORS,
      {
        ...TOO_LARGE,
        codes: ["FILE_TOO_LARGE", "PAGE_TOO_LARGE", "ZIP_PAGE_LIMIT"],
        when: `${TOO_LARGE.when} Or a page would render too large, or the document has more pages than your plan allows in one ZIP.`,
      },
      RATE_LIMITED,
      INTERNAL,
      ...RENDER_ERRORS,
    ],
  },
  {
    id: "count",
    method: "POST",
    path: "/api/thumbnail/count",
    summary:
      "Counts the pages of the PDF. It doesn't use your Thumbnail quota.",
    fields: [FILE],
    response: {
      status: 201,
      contentType: "application/json",
      description: 'The page count, e.g. {"pageCount":12}.',
    },
    errors: [
      {
        status: 400,
        codes: ["INVALID_PDF", "INVALID_REQUEST"],
        when: `${NOT_A_PDF} Or no file.`,
      },
      ...AUTH_ERRORS,
      TOO_LARGE,
      RATE_LIMITED,
      INTERNAL,
    ],
  },
];

export const SNIPPET_LANGUAGES = [
  { id: "curl", label: "curl", file: "curl.sh" },
  { id: "typescript", label: "TypeScript", file: "typescript.ts" },
  { id: "python", label: "Python", file: "python.py" },
  { id: "csharp", label: "C#", file: "csharp.cs" },
  { id: "java", label: "Java", file: "Main.java" },
  { id: "go", label: "Go", file: "main.go" },
  { id: "php", label: "PHP", file: "php.php" },
] as const;

export type SnippetLanguage = (typeof SNIPPET_LANGUAGES)[number]["id"];
