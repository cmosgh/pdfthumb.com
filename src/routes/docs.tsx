import { createFileRoute, Link } from "@tanstack/react-router";
import { API_BASE_URL, API_LIMITS, APP_NAME, SWAGGER_URL } from "../constants";

export const Route = createFileRoute("/docs")({
  head: () => ({
    meta: [{ title: `Documentation | ${APP_NAME}` }],
  }),
  component: DocsPage,
});

// The quickstart follows the backend's thumbnail controller and the live
// OpenAPI spec (#126). Swagger has the full examples and "Try it out".
const FIRST_REQUEST = `curl -X POST "${API_BASE_URL}/thumbnail/page?page=1&width=400" \\
  -H "x-api-key: $PDFTHUMB_API_KEY" \\
  -F "file=@document.pdf" \\
  -o page-1.jpg`;

const ENDPOINTS = [
  {
    path: "/api/thumbnail/page",
    text: (
      <>
        one page as a JPEG. <code>page</code> is 1-based and required.
      </>
    ),
  },
  {
    path: "/api/thumbnail/zip",
    text: <>every page as JPEGs in a ZIP; each page counts as one Thumbnail.</>,
  },
  {
    path: "/api/thumbnail/count",
    text: (
      <>
        the page count as <code>{`{"pageCount":12}`}</code>; it doesn't use your
        quota.
      </>
    ),
  },
];

const h2 = "text-2xl font-bold text-slate-800 dark:text-white mb-4";
const p = "text-slate-600 dark:text-slate-300 mb-4";
// Inline code only: the curl block keeps its own dark background.
const code =
  "[&_:is(p,li)_code]:font-mono [&_:is(p,li)_code]:text-sm [&_:is(p,li)_code]:bg-slate-100 dark:[&_:is(p,li)_code]:bg-slate-700 [&_:is(p,li)_code]:px-1 [&_:is(p,li)_code]:rounded";
const link = "text-indigo-600 dark:text-indigo-400 hover:underline";
const pre =
  "bg-slate-900 dark:bg-slate-800 border border-transparent dark:border-slate-700 text-slate-100 text-sm rounded-lg p-4 overflow-x-auto mb-6";

function DocsPage() {
  const { maxUploadMB, minWidthPx, maxWidthPx } = API_LIMITS;
  return (
    <div
      className={`container mx-auto px-4 sm:px-6 lg:px-8 py-16 max-w-3xl ${code}`}
      data-testid="docs-page"
    >
      <h1 className="text-4xl font-extrabold text-slate-800 dark:text-white mb-4">
        Documentation
      </h1>
      <p className={p}>
        {APP_NAME} turns PDFs into thumbnails over a REST API. This page gets
        you to a first thumbnail; the API reference lists every endpoint,
        parameter and response.
      </p>
      <a
        href={SWAGGER_URL}
        className="inline-flex items-center font-semibold rounded-md shadow-sm px-6 py-3 mb-12 bg-indigo-600 text-white hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600"
        data-testid="docs-swagger-link"
      >
        Open the API reference (Swagger)
      </a>

      <section className="mb-12">
        <h2 className={h2}>1. Get an API key</h2>
        <p className={p}>
          Sign in and create a key under{" "}
          <Link to="/dashboard/settings" className={link}>
            Dashboard → Settings
          </Link>
          . The full key is shown only once, when you create it, so store it
          somewhere safe. You can revoke it there at any time.
        </p>
      </section>

      <section className="mb-12">
        <h2 className={h2}>2. Authenticate</h2>
        <p className={p}>
          Send the key in the <code>x-api-key</code> header on every request.
          The examples below read it from an environment variable:
        </p>
        <pre className={pre}>
          <code>export PDFTHUMB_API_KEY="your-api-key"</code>
        </pre>
      </section>

      <section className="mb-12">
        <h2 className={h2}>3. Make a request</h2>
        <p className={p}>
          Upload the PDF as multipart form data in the <code>file</code> field.
          This renders page 1 at 400 px wide:
        </p>
        <pre className={pre}>
          <code>{FIRST_REQUEST}</code>
        </pre>
        <p className={p}>
          <code>width</code> is optional, and the height follows the page's
          aspect ratio. The API has three endpoints, each answering{" "}
          <code>201 Created</code>:
        </p>
        <ul className="list-disc pl-6 space-y-2 mb-4 text-slate-600 dark:text-slate-300">
          {ENDPOINTS.map((endpoint) => (
            <li key={endpoint.path}>
              <code>POST {endpoint.path}</code>: {endpoint.text}
            </li>
          ))}
        </ul>
        <p className={p}>
          The{" "}
          <a href={SWAGGER_URL} className={link}>
            API reference
          </a>{" "}
          has a full example for each, and you can run them there with your key.
        </p>
      </section>

      <section className="mb-12" data-testid="docs-limits">
        <h2 className={h2}>Limits and errors</h2>
        <ul className="list-disc pl-6 space-y-3 text-slate-600 dark:text-slate-300">
          <li>
            A missing or invalid key gets <code>401 Unauthorized</code>.
          </li>
          <li>
            PDFs up to {maxUploadMB} MB. A larger upload gets{" "}
            <code>413 Payload Too Large</code>.
          </li>
          <li>
            <code>width</code> is a whole number of pixels from{" "}
            {minWidthPx.toLocaleString("en-US")} to{" "}
            {maxWidthPx.toLocaleString("en-US")}. Anything else gets{" "}
            <code>400 Bad Request</code>, as do a file that isn't a PDF and a
            page number past the end of the document.
          </li>
          <li>
            Each plan includes a monthly number of Thumbnails (see{" "}
            <a href="/#pricing" className={link}>
              pricing
            </a>
            ) and caps the pages in one ZIP: a larger document gets{" "}
            <code>413 Payload Too Large</code>, with a message naming the cap.
            When a plan with a hard monthly limit runs out, requests get{" "}
            <code>403 Forbidden</code> with{" "}
            <code>Monthly thumbnail limit reached.</code> The quota resets
            monthly, on the day your plan started, at 00:00 UTC.
          </li>
          <li>
            Requests are rate-limited per minute. Past the limit you get{" "}
            <code>429 Too Many Requests</code> with a <code>Retry-After</code>{" "}
            header saying how many seconds to wait.
          </li>
        </ul>
      </section>
    </div>
  );
}
