import type { SnippetLanguage } from "./apiReference.ts";
import {
  DOCS_INTRO,
  DOCS_TITLE,
  ERRORS,
  FIELD_COLUMNS,
  LIMITS,
  QUICKSTART,
  REFERENCE,
  ROUTE_AUTH,
  SWAGGER_LINK,
  fieldIn,
  fieldRequired,
  routeError,
  routeResponse,
  type Block,
  type CodeSampleDoc,
  type ProseSection,
  type Span,
} from "./content.ts";
import { snippet, snippetLanguage } from "./snippets.ts";

// Copy as Markdown (#142): the /docs page as Markdown, built from the same
// content the page renders, with the examples in the chosen language.

const inlineCode = (text: string) =>
  text.includes("`") ? `\`\` ${text} \`\`` : `\`${text}\``;

function spans(list: Span[], origin: string): string {
  return list
    .map((span) => {
      if (typeof span === "string") return span;
      if ("code" in span) return inlineCode(span.code);
      const target = "to" in span ? span.to : span.href;
      const url = target.startsWith("#")
        ? `${origin}/docs${target}`
        : target.startsWith("/")
          ? `${origin}${target}`
          : target;
      return `[${spans(span.text, origin)}](${url})`;
    })
    .join("");
}

const blocks = (list: Block[], origin: string) =>
  list.map((block) =>
    block.kind === "p"
      ? spans(block.spans, origin)
      : block.items.map((item) => `- ${spans(item, origin)}`).join("\n"),
  );

const fence = (sample: CodeSampleDoc) =>
  `\`\`\`${sample.lang}\n${sample.code.replace(/\n$/, "")}\n\`\`\``;

const cell = (text: string) => text.replace(/\|/g, "\\|");
const table = (columns: string[], rows: string[][]) =>
  [
    `| ${columns.join(" | ")} |`,
    `| ${columns.map(() => "---").join(" | ")} |`,
    ...rows.map((row) => `| ${row.map(cell).join(" | ")} |`),
  ].join("\n");

const prose = (section: ProseSection, origin: string) => [
  `## ${section.title}`,
  ...blocks(section.blocks, origin),
  ...(section.code ? [fence(section.code)] : []),
];

export function docsMarkdown(language: SnippetLanguage, origin: string) {
  const lang = snippetLanguage(language);
  const parts = [
    `# ${DOCS_TITLE}`,
    spans(DOCS_INTRO, origin),
    `[${SWAGGER_LINK.label}](${SWAGGER_LINK.href})`,
    ...QUICKSTART.flatMap((section) => prose(section, origin)),
    ...prose(LIMITS, origin),
    `## ${ERRORS.title}`,
    ...blocks(ERRORS.blocks, origin),
    table(
      ERRORS.columns,
      ERRORS.codes.map((error) => [
        inlineCode(error.code),
        error.statuses.join(", "),
        error.meaning,
        error.action,
      ]),
    ),
    `## ${REFERENCE.title}`,
    ...REFERENCE.routes.flatMap((route) => [
      `### ${route.method} ${route.path}`,
      route.summary,
      spans(ROUTE_AUTH, origin),
      "#### Request",
      table(
        FIELD_COLUMNS,
        route.fields.map((field) => [
          `${inlineCode(field.name)} (${fieldRequired(field)})`,
          fieldIn(field),
          field.type,
          field.description,
        ]),
      ),
      "#### Response",
      spans(routeResponse(route), origin),
      "#### Errors",
      route.errors
        .map((error) => `- ${spans(routeError(error), origin)}`)
        .join("\n"),
      `#### Example (${lang.label})`,
      fence({ code: snippet(route, language), lang: lang.fence }),
    ]),
  ];
  return `${parts.join("\n\n")}\n`;
}
