import {
  ERRORS,
  LIMITS,
  LIMITS_LABEL,
  QUICKSTART,
  QUICKSTART_LABEL,
  REFERENCE,
  ROUTE_AUTH,
  blocksText,
  errorAnchor,
  fieldIn,
  fieldRequired,
  paramAnchor,
  routeAnchor,
  routeError,
  routeResponse,
  spansText,
  type ProseSection,
} from "./content.ts";

// The /docs search (#142): client-side, over the same content the page
// renders. Every section, error code, route and parameter is an entry
// that jumps to its anchor.

export interface SearchEntry {
  id: string;
  title: string;
  // Where it sits: a group or a route.
  context: string;
  text: string;
}

const prose = (section: ProseSection, context: string): SearchEntry => ({
  id: section.id,
  title: section.title,
  context,
  text: [blocksText(section.blocks), section.code?.code ?? ""].join(" "),
});

export const SEARCH_ENTRIES: SearchEntry[] = [
  ...QUICKSTART.map((section) => prose(section, QUICKSTART_LABEL)),
  prose(LIMITS, LIMITS_LABEL),
  {
    id: ERRORS.id,
    title: ERRORS.title,
    context: LIMITS_LABEL,
    text: blocksText(ERRORS.blocks),
  },
  ...ERRORS.codes.map((error) => ({
    id: errorAnchor(error),
    title: error.code,
    context: ERRORS.title,
    text: `${error.statuses.join(", ")} ${error.meaning} ${error.action}`,
  })),
  ...REFERENCE.routes.flatMap((route) => {
    const name = `${route.method} ${route.path}`;
    return [
      {
        id: routeAnchor(route),
        title: name,
        context: REFERENCE.title,
        text: [
          route.summary,
          spansText(ROUTE_AUTH),
          spansText(routeResponse(route)),
          ...route.errors.map((error) => spansText(routeError(error))),
        ].join(" "),
      },
      ...route.fields.map((field) => ({
        id: paramAnchor(route, field),
        title: field.name,
        context: name,
        text: `${fieldRequired(field)} ${fieldIn(field)} ${field.type}. ${field.description}`,
      })),
    ];
  }),
];

export interface SearchResult {
  entry: SearchEntry;
  // A piece of the text around the first match.
  excerpt: string;
}

const EXCERPT = 110;

function excerpt(text: string, at: number): string {
  if (text.length <= EXCERPT) return text;
  // From the start when the match is near it, else from a word start
  // shortly before the match.
  let start = at < EXCERPT - 40 ? 0 : Math.min(at - 30, text.length - EXCERPT);
  if (start > 0) start = text.indexOf(" ", start) + 1 || start;
  const piece = text.slice(start, start + EXCERPT).trim();
  return `${start > 0 ? "…" : ""}${piece}${start + EXCERPT < text.length ? "…" : ""}`;
}

// Every word of the query must appear in the title, context or text.
// Title matches rank first, then the page's order.
export function searchDocs(
  query: string,
  entries: SearchEntry[] = SEARCH_ENTRIES,
  limit = 20,
): SearchResult[] {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (!terms.length) return [];
  const phrase = terms.join(" ");
  const scored: { result: SearchResult; score: number }[] = [];
  for (const entry of entries) {
    const title = entry.title.toLowerCase();
    const text = entry.text.toLowerCase();
    const haystack = `${title} ${entry.context.toLowerCase()} ${text}`;
    if (!terms.every((term) => haystack.includes(term))) continue;
    const score =
      (title === phrase ? 4 : 0) +
      (title.includes(phrase) ? 2 : 0) +
      (terms.every((term) => title.includes(term)) ? 1 : 0);
    const at = text.indexOf(terms[0]);
    scored.push({
      result: { entry, excerpt: excerpt(entry.text, Math.max(at, 0)) },
      score,
    });
  }
  // Array.prototype.sort is stable, so equal scores keep the page's order.
  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ result }) => result);
}
