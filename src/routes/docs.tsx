import { createFileRoute } from "@tanstack/react-router";
import {
  PUBLIC_API_URL,
  API_LIMITS,
  APP_NAME,
  SWAGGER_URL,
} from "../constants";
import ApiReference from "../components/docs/ApiReference";
import {
  buttonClasses,
  cx,
  Code,
  CodeBlock,
  Container,
  Heading,
  RouterTextLink,
  Text,
  TextLink,
} from "../components/ui";

export const Route = createFileRoute("/docs")({
  head: () => ({
    meta: [{ title: `Documentation | ${APP_NAME}` }],
  }),
  component: DocsPage,
});

// The quickstart follows the backend's thumbnail controller and the live
// OpenAPI spec (#126). The reference below has an example per language,
// and Swagger's "Try it out" runs them.
const FIRST_REQUEST = `curl -X POST "${PUBLIC_API_URL}/thumbnail/page?page=1&width=400" \\
  -H "x-api-key: $PDFTHUMB_API_KEY" \\
  -F "file=@document.pdf" \\
  -o page-1.jpg`;

const ENDPOINTS = [
  {
    id: "page",
    path: "/api/thumbnail/page",
    text: (
      <>
        one page as a JPEG. <Code>page</Code> is 1-based and required.
      </>
    ),
  },
  {
    id: "zip",
    path: "/api/thumbnail/zip",
    text: <>every page as JPEGs in a ZIP; each page counts as one Thumbnail.</>,
  },
  {
    id: "count",
    path: "/api/thumbnail/count",
    text: (
      <>
        the page count as <Code>{`{"pageCount":12}`}</Code>; it doesn't use your
        quota.
      </>
    ),
  },
];

function DocsPage() {
  const { maxUploadMB, minWidthPx, maxWidthPx } = API_LIMITS;
  return (
    <Container className="py-16 max-w-3xl" data-testid="docs-page">
      <Heading
        as="h1"
        size="4xl"
        weight="extrabold"
        tone="heading"
        className="mb-4"
      >
        Documentation
      </Heading>
      <Text tone="fg-muted" className="mb-4">
        {APP_NAME} turns PDFs into thumbnails over a REST API. This page gets
        you to a first thumbnail; the API reference lists every endpoint,
        parameter and response.
      </Text>
      <a
        href={SWAGGER_URL}
        className={cx(buttonClasses({ variant: "swagger" }), "mb-12")}
        data-testid="docs-swagger-link"
      >
        Open the API reference (Swagger)
      </a>

      <section className="mb-12">
        <Heading
          as="h2"
          size="2xl"
          weight="bold"
          tone="heading"
          className="mb-4"
        >
          1. Get an API key
        </Heading>
        <Text tone="fg-muted" className="mb-4">
          Sign in and create a key under{" "}
          <RouterTextLink to="/dashboard/settings" tone="underline">
            Dashboard → Settings
          </RouterTextLink>
          . The full key is shown only once, when you create it, so store it
          somewhere safe. You can revoke it there at any time.
        </Text>
      </section>

      <section className="mb-12">
        <Heading
          as="h2"
          size="2xl"
          weight="bold"
          tone="heading"
          className="mb-4"
        >
          2. Authenticate
        </Heading>
        <Text tone="fg-muted" className="mb-4">
          Send the key in the <Code>x-api-key</Code> header on every request.
          The examples below read it from an environment variable:
        </Text>
        <CodeBlock className="mb-6">
          {'export PDFTHUMB_API_KEY="your-api-key"'}
        </CodeBlock>
      </section>

      <section className="mb-12">
        <Heading
          as="h2"
          size="2xl"
          weight="bold"
          tone="heading"
          className="mb-4"
        >
          3. Make a request
        </Heading>
        <Text tone="fg-muted" className="mb-4">
          Upload the PDF as multipart form data in the <Code>file</Code> field.
          This renders page 1 at 400 px wide:
        </Text>
        <CodeBlock className="mb-6" data-testid="docs-first-request">
          {FIRST_REQUEST}
        </CodeBlock>
        <Text tone="fg-muted" className="mb-4">
          <Code>width</Code> is optional, and the height follows the page's
          aspect ratio. The API has three endpoints, each answering{" "}
          <Code>201 Created</Code>:
        </Text>
        <Text
          as="ul"
          list="disc"
          tone="fg-muted"
          className="pl-6 space-y-2 mb-4"
        >
          {ENDPOINTS.map((endpoint) => (
            <li key={endpoint.path}>
              <TextLink href={`#ref-${endpoint.id}`} tone="underline">
                <Code>POST {endpoint.path}</Code>
              </TextLink>
              : {endpoint.text}
            </li>
          ))}
        </Text>
        <Text tone="fg-muted" className="mb-4">
          The{" "}
          <TextLink href="#reference" tone="underline">
            reference
          </TextLink>{" "}
          below documents each one, with examples in curl, TypeScript, Python,
          C#, Java, Go and PHP. In the{" "}
          <TextLink href={SWAGGER_URL} tone="underline">
            Swagger API reference
          </TextLink>{" "}
          you can run them with your key.
        </Text>
      </section>

      <section className="mb-12" data-testid="docs-limits">
        <Heading
          as="h2"
          size="2xl"
          weight="bold"
          tone="heading"
          className="mb-4"
        >
          Limits and errors
        </Heading>
        <Text as="ul" list="disc" tone="fg-muted" className="pl-6 space-y-3">
          <li>
            A missing or invalid key gets <Code>401 Unauthorized</Code>.
          </li>
          <li>
            PDFs up to {maxUploadMB} MB. A larger upload gets{" "}
            <Code>413 Payload Too Large</Code>.
          </li>
          <li>
            <Code>width</Code> is a whole number of pixels from{" "}
            {minWidthPx.toLocaleString("en-US")} to{" "}
            {maxWidthPx.toLocaleString("en-US")}. Anything else gets{" "}
            <Code>400 Bad Request</Code>, as do a file that isn't a PDF and a
            page number past the end of the document.
          </li>
          <li>
            Each plan includes a monthly number of Thumbnails (see{" "}
            <TextLink href="/#pricing" tone="underline">
              pricing
            </TextLink>
            ) and caps the pages in one ZIP: a larger document gets{" "}
            <Code>413 Payload Too Large</Code>, with a message naming the cap.
            When a plan with a hard monthly limit runs out, requests get{" "}
            <Code>403 Forbidden</Code> with{" "}
            <Code>Monthly thumbnail limit reached.</Code> The quota resets
            monthly, on the day your plan started, at 00:00 UTC.
          </li>
          <li>
            Requests are rate-limited per minute. Past the limit you get{" "}
            <Code>429 Too Many Requests</Code> with a <Code>Retry-After</Code>{" "}
            header saying how many seconds to wait.
          </li>
        </Text>
      </section>

      <section id="reference" className="scroll-mt-24">
        <Heading
          as="h2"
          size="2xl"
          weight="bold"
          tone="heading"
          className="mb-4"
        >
          API reference
        </Heading>
        <ApiReference />
      </section>
    </Container>
  );
}
