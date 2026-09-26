import React, { useState } from "react";
import {
  SNIPPET_LANGUAGES,
  type ApiRoute,
  type SnippetLanguage,
} from "@/docs/apiReference.ts";
import {
  FIELD_COLUMNS,
  REFERENCE,
  ROUTE_AUTH,
  fieldIn,
  fieldRequired,
  paramAnchor,
  routeAnchor,
  routeError,
  routeResponse,
} from "@/docs/content.ts";
import { snippet } from "@/docs/snippets.ts";
import {
  CodeSample,
  cx,
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
import { Spans } from "./DocsProse";
import { ANCHOR_OFFSET, DocsSection } from "./DocsSection";

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

// The example language, shared by every route and by Copy as Markdown.
export function useSnippetLanguage() {
  const [language, setLanguage] = useState<SnippetLanguage>(storedLanguage);
  const choose = (next: SnippetLanguage) => {
    setLanguage(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Not remembered; the choice still applies on this visit.
    }
  };
  return [language, choose] as const;
}

interface RouteReferenceProps {
  route: ApiRoute;
  language: SnippetLanguage;
  onLanguage: (language: SnippetLanguage) => void;
}

const SubHeading: React.FC<{ id: string; children: React.ReactNode }> = ({
  id,
  children,
}) => (
  <Heading
    as="h4"
    id={id}
    weight="semibold"
    tone="heading"
    className={cx("mb-2", ANCHOR_OFFSET)}
  >
    {children}
  </Heading>
);

const RouteReference: React.FC<RouteReferenceProps> = ({
  route,
  language,
  onLanguage,
}) => {
  const anchor = routeAnchor(route);
  return (
    <DocsSection
      id={anchor}
      data-testid={`docs-route-${route.id}`}
      heading={
        <Heading
          as="h3"
          size="xl"
          weight="bold"
          tone="heading"
          mono
          className="mb-2 wrap-anywhere"
        >
          {route.method} {route.path}
        </Heading>
      }
      panel={
        <>
          <SubHeading id={`${anchor}-example`}>Example</SubHeading>
          <Tabs
            items={SNIPPET_LANGUAGES}
            value={language}
            onChange={onLanguage}
            idFor={(l) => tabId(route, l)}
            panelId={panelId(route)}
            label={`Example language for ${route.path}`}
            className="mb-2"
          />
          <CodeSample
            data-testid="docs-code"
            code={snippet(route, language)}
            preProps={{
              id: panelId(route),
              role: "tabpanel",
              "aria-labelledby": tabId(route, language),
              tabIndex: 0,
              "data-testid": "docs-snippet",
              "data-language": language,
            }}
          />
        </>
      }
    >
      <Text tone="fg-muted" className="mb-4">
        {route.summary}
      </Text>
      <Text tone="fg-muted" className="mb-4">
        <Spans spans={ROUTE_AUTH} />
      </Text>

      <SubHeading id={`${anchor}-parameters`}>Request</SubHeading>
      <TableFrame variant="docs" className="mb-6">
        <Table density="compact" data-testid="docs-fields">
          <THead>
            <tr>
              {FIELD_COLUMNS.map((column) => (
                <Th key={column} className="text-left">
                  {column}
                </Th>
              ))}
            </tr>
          </THead>
          <TBody>
            {route.fields.map((field) => (
              <tr
                key={field.name}
                id={paramAnchor(route, field)}
                className={ANCHOR_OFFSET}
              >
                <Td tone="fg-muted" className="align-top">
                  <Spans spans={[{ code: field.name }]} />
                  <Text as="div" size="xs" className="mt-1">
                    {fieldRequired(field)}
                  </Text>
                </Td>
                <Td tone="fg-muted" className="align-top">
                  {fieldIn(field)}
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

      <SubHeading id={`${anchor}-response`}>Response</SubHeading>
      <Text tone="fg-muted" className="mb-4">
        <Spans spans={routeResponse(route)} />
      </Text>

      <SubHeading id={`${anchor}-errors`}>Errors</SubHeading>
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
            <Spans spans={routeError(error)} />
          </li>
        ))}
      </Text>
    </DocsSection>
  );
};

interface ApiReferenceProps {
  language: SnippetLanguage;
  onLanguage: (language: SnippetLanguage) => void;
}

const ApiReference: React.FC<ApiReferenceProps> = ({
  language,
  onLanguage,
}) => (
  <div data-testid="docs-reference">
    {REFERENCE.routes.map((route) => (
      <RouteReference
        key={route.id}
        route={route}
        language={language}
        onLanguage={onLanguage}
      />
    ))}
  </div>
);

export default ApiReference;
