import React, { useState } from "react";
import {
  API_ROUTES,
  SNIPPET_LANGUAGES,
  type ApiRoute,
  type SnippetLanguage,
} from "@/docs/apiReference.ts";

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

const cell = "px-3 py-2 align-top text-sm text-slate-600 dark:text-slate-300";
const head =
  "px-3 py-2 text-left text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-300";

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
    <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2 font-mono">
      {route.method} {route.path}
    </h3>
    <p className="text-slate-600 dark:text-slate-300 mb-4">{route.summary}</p>
    <p className="text-slate-600 dark:text-slate-300 mb-4">
      Authenticate with the <code>x-api-key</code> header.
    </p>

    <h4 className="font-semibold text-slate-800 dark:text-white mb-2">
      Request
    </h4>
    <div className="overflow-x-auto mb-6 rounded-lg border border-slate-200 dark:border-slate-700">
      <table
        className="min-w-full divide-y divide-slate-200 dark:divide-slate-700"
        data-testid="docs-fields"
      >
        <thead className="bg-slate-100 dark:bg-slate-700">
          <tr>
            <th className={head}>Field</th>
            <th className={head}>In</th>
            <th className={head}>Type</th>
            <th className={head}>Description</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
          {route.fields.map((field) => (
            <tr key={field.name}>
              <td className={cell}>
                <code>{field.name}</code>
                <div className="text-xs mt-1">
                  {field.required ? "required" : "optional"}
                </div>
              </td>
              <td className={cell}>
                {field.in === "form" ? "form data" : "query"}
              </td>
              <td className={cell}>{field.type}</td>
              <td className={cell}>{field.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>

    <h4 className="font-semibold text-slate-800 dark:text-white mb-2">
      Response
    </h4>
    <p className="text-slate-600 dark:text-slate-300 mb-4">
      <code>{route.response.status} Created</code>,{" "}
      <code>{route.response.contentType}</code>: {route.response.description}
    </p>

    <h4 className="font-semibold text-slate-800 dark:text-white mb-2">
      Errors
    </h4>
    <ul
      className="list-disc pl-6 space-y-1 mb-6 text-slate-600 dark:text-slate-300"
      data-testid="docs-errors"
    >
      {route.errors.map((error) => (
        <li key={error.status}>
          <code>{error.status}</code>: {error.when}
        </li>
      ))}
    </ul>

    <h4 className="font-semibold text-slate-800 dark:text-white mb-2">
      Example
    </h4>
    <div
      role="tablist"
      aria-label={`Example language for ${route.path}`}
      className="flex flex-wrap gap-1 mb-2"
    >
      {SNIPPET_LANGUAGES.map((l, index) => {
        const selected = l.id === language;
        return (
          <button
            key={l.id}
            id={tabId(route, l.id)}
            type="button"
            role="tab"
            aria-selected={selected}
            aria-controls={panelId(route)}
            tabIndex={selected ? 0 : -1}
            onClick={() => onLanguage(l.id)}
            onKeyDown={(event) => {
              // The WAI-ARIA tabs pattern: arrows move and select, wrapping.
              const step =
                event.key === "ArrowRight"
                  ? 1
                  : event.key === "ArrowLeft"
                    ? -1
                    : 0;
              if (!step) return;
              event.preventDefault();
              const count = SNIPPET_LANGUAGES.length;
              const next = SNIPPET_LANGUAGES[(index + step + count) % count].id;
              onLanguage(next);
              document.getElementById(tabId(route, next))?.focus();
            }}
            className={`px-3 py-1 rounded-md text-sm font-medium ${
              selected
                ? "bg-indigo-600 text-white dark:bg-indigo-500"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600"
            }`}
          >
            {l.label}
          </button>
        );
      })}
    </div>
    <pre
      id={panelId(route)}
      role="tabpanel"
      aria-labelledby={tabId(route, language)}
      tabIndex={0}
      data-testid="docs-snippet"
      data-language={language}
      className="bg-slate-900 dark:bg-slate-800 border border-transparent dark:border-slate-700 text-slate-100 text-sm rounded-lg p-4 overflow-x-auto"
    >
      <code>{snippet(route, language)}</code>
    </pre>
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
