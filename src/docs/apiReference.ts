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

export interface RouteError {
  status: number;
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

// Every thumbnail route shares these; each route adds its own.
const COMMON_ERRORS: RouteError[] = [
  {
    status: 401,
    when: "The x-api-key header is missing or the key is invalid.",
  },
  {
    status: 403,
    when: 'The monthly quota is used up on a plan with a hard limit ("Monthly thumbnail limit reached.").',
  },
  {
    status: 413,
    when: `The file is larger than ${maxUploadMB} MB.`,
  },
  {
    status: 429,
    when: "Too many requests this minute. The Retry-After header says how many seconds to wait.",
  },
];

const NOT_A_PDF = "The file isn't a PDF.";

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
        when: `${NOT_A_PDF} Or page is below 1 or past the last page, or width is outside ${minWidthPx}–${maxWidthPx}.`,
      },
      ...COMMON_ERRORS,
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
        when: `${NOT_A_PDF} Or width is outside ${minWidthPx}–${maxWidthPx}.`,
      },
      ...COMMON_ERRORS.map((error) =>
        error.status === 413
          ? {
              status: 413,
              when: `${error.when} Or the document has more pages than your plan allows in one ZIP (error "zip_page_cap_exceeded"; the message names the cap).`,
            }
          : error,
      ),
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
    errors: [{ status: 400, when: NOT_A_PDF }, ...COMMON_ERRORS],
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
