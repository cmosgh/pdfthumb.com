import {
  SNIPPET_LANGUAGES,
  type ApiRoute,
  type SnippetLanguage,
} from "./apiReference.ts";

// The examples are real files in docs-snippets/, which CI compiles
// (scripts/check-doc-snippets.sh); the page shows them verbatim.
const SNIPPETS = import.meta.glob<string>("../../docs-snippets/*/*", {
  query: "?raw",
  import: "default",
  eager: true,
});

export const snippetLanguage = (language: SnippetLanguage) =>
  SNIPPET_LANGUAGES.find((l) => l.id === language)!;

export const snippet = (route: ApiRoute, language: SnippetLanguage) =>
  SNIPPETS[
    `../../docs-snippets/${route.id}/${snippetLanguage(language).file}`
  ] ?? "";
