import React, { useState } from "react";
import {
  API_ROUTES,
  SNIPPET_LANGUAGES,
  type ApiRoute,
  type SnippetLanguage,
} from "@/docs/apiReference.ts";
import {
  Code,
  CodeBlock,
  Heading,
  Table,
  TableFrame,
  Tabs,
  TBody,
  Td,
  Text,
  Th,
  THead,
} from "@/components/ui";

// The examples are real files in docs-snippets/, which CI compiles
// (scripts/check-doc-snippets.sh); the page shows them verbatim.
const SNIPPETS = import.meta.glob<string>("../../../docs-snippets/*/*", {
  query: "?raw",
  import: "default",
  eager: true,
});

const snippet = (route: ApiRoute, language: SnippetLanguage) => {
  const file = SNIPPET_LANGUAGES.find((l) => l.id === language)!.file;
  return SNIPPETS[`../../../docs-snippets/${route.id}/${file}`] ?? "";
};

const tabId = (route: ApiRoute, language: SnippetLanguage) =>
  `docs-tab-${route.id}-${language}`;
const panelId = (route: ApiRoute) => `docs-panel-${route.id}`;

// The chosen language is a per-visitor convenience, so storage may fail.
const STORAGE_KEY = "pdfthumb.docs.language";

function storedLanguage(): SnippetLanguage {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (SNIPPET_LANGUAGES.some((l) => l.id === stored)) {
      return stored as SnippetLanguage;
    }
  } catch {
    // Private mode or blocked storage: fall back to curl.
  }
  return "curl";
}

interface RouteReferenceProps {
  route: ApiRoute;
  language: SnippetLanguage;
  onLanguage: (language: SnippetLanguage) => void;
}

const RouteReference: React.FC<RouteReferenceProps> = ({
  route,
  language,
  onLanguage,
}) => (
  <section
    id={`ref-${route.id}`}
    data-testid={`docs-route-${route.id}`}
    className="mb-16 scroll-mt-24"
  >
    <Heading
      as="h3"
      size="xl"
      weight="bold"
      tone="heading"
      mono
      className="mb-2"
    >
      {route.method} {route.path}
    </Heading>
    <Text tone="fg-muted" className="mb-4">
      {route.summary}
    </Text>
    <Text tone="fg-muted" className="mb-4">
      Authenticate with the <Code>x-api-key</Code> header.
    </Text>

    <Heading as="h4" weight="semibold" tone="heading" className="mb-2">
      Request
    </Heading>
    <TableFrame variant="docs" className="mb-6">
      <Table density="compact" data-testid="docs-fields">
        <THead>
          <tr>
            <Th className="text-left">Field</Th>
            <Th className="text-left">In</Th>
            <Th className="text-left">Type</Th>
            <Th className="text-left">Description</Th>
          </tr>
        </THead>
        <TBody>
          {route.fields.map((field) => (
            <tr key={field.name}>
              <Td tone="fg-muted" className="align-top">
                <Code>{field.name}</Code>
                <Text as="div" size="xs" className="mt-1">
                  {field.required ? "required" : "optional"}
                </Text>
              </Td>
              <Td tone="fg-muted" className="align-top">
                {field.in === "form" ? "form data" : "query"}
              </Td>
              <Td tone="fg-muted" className="align-top">
                {field.type}
              </Td>
              <Td tone="fg-muted" className="align-top">
                {field.description}
              </Td>
            </tr>
          ))}
        </TBody>
      </Table>
    </TableFrame>

    <Heading as="h4" weight="semibold" tone="heading" className="mb-2">
      Response
    </Heading>
    <Text tone="fg-muted" className="mb-4">
      <Code>{route.response.status} Created</Code>,{" "}
      <Code>{route.response.contentType}</Code>: {route.response.description}
    </Text>

    <Heading as="h4" weight="semibold" tone="heading" className="mb-2">
      Errors
    </Heading>
    <Text
      as="ul"
      list="disc"
      tone="fg-muted"
      // Long codes (NO_ACTIVE_SUBSCRIPTION) break rather than widen the page
      className="pl-6 space-y-1 mb-6 wrap-anywhere"
      data-testid="docs-errors"
    >
      {route.errors.map((error) => (
        <li key={error.status}>
          <Code>{error.status}</Code>{" "}
          {error.codes.map((code, i) => (
            <React.Fragment key={code}>
              {i > 0 && ", "}
              <Code>{code}</Code>
            </React.Fragment>
          ))}
          : {error.when}
        </li>
      ))}
    </Text>

    <Heading as="h4" weight="semibold" tone="heading" className="mb-2">
      Example
    </Heading>
    <Tabs
      items={SNIPPET_LANGUAGES}
      value={language}
      onChange={onLanguage}
      idFor={(l) => tabId(route, l)}
      panelId={panelId(route)}
      label={`Example language for ${route.path}`}
      className="mb-2"
    />
    <CodeBlock
      id={panelId(route)}
      role="tabpanel"
      aria-labelledby={tabId(route, language)}
      tabIndex={0}
      data-testid="docs-snippet"
      data-language={language}
    >
      {snippet(route, language)}
    </CodeBlock>
  </section>
);

const ApiReference: React.FC = () => {
  const [language, setLanguage] = useState<SnippetLanguage>(storedLanguage);
  const choose = (next: SnippetLanguage) => {
    setLanguage(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Not remembered; the choice still applies on this visit.
    }
  };

  return (
    <div data-testid="docs-reference">
      {API_ROUTES.map((route) => (
        <RouteReference
          key={route.id}
          route={route}
          language={language}
          onLanguage={choose}
        />
      ))}
    </div>
  );
};

export default ApiReference;
