#!/usr/bin/env node
// Fails if a page or feature component styles itself (#146).
//
// Pages compose, primitives style: colour, border, radius, shadow, typography
// and opacity classes live in src/components/ui/, and everything else picks a
// named variant from there. Layout (padding, margin, gap, flex, grid, size,
// position, display, overflow, text alignment) stays with the caller.
//
// Every string literal and template chunk in src/**/*.ts(x) outside
// src/components/ui/ is read with the TypeScript parser, so JSX text and
// comments never count. A string is checked only when it looks like a class
// list (every word is class-shaped), which keeps prose like "Rounded corners."
// out, and so are JSX props other than *className (tone="underline" names a
// variant). Variant prefixes (hover:, sm:, [&_code]:) are stripped before matching.
//
// Usage: node scripts/check-ui-styling.mjs [root]

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";
import ts from "typescript";

const root = process.argv[2] ?? ".";
const UI = join("src", "components", "ui") + sep;
// boot.ts names CSS properties (font-family, border-radius) to validate a
// runtime theme's values; it renders nothing.
const SKIP = new Set([
  join("src", "routeTree.gen.ts"),
  join("src", "theme", "boot.ts"),
]);

const STYLE = new RegExp(
  "^(?:" +
    [
      "bg-.+",
      "(?:from|via|to)-.+",
      "border(?:-(?!collapse$|separate$|spacing).+)?",
      "divide-.+",
      "ring(?:-.+)?",
      "outline(?:-.+)?",
      "shadow(?:-.+)?",
      "rounded(?:-.+)?",
      "opacity-.+",
      "(?:fill|stroke|placeholder|decoration)-.+",
      "text-(?!(?:left|center|right|justify|start|end|wrap|nowrap|balance|pretty|ellipsis|clip)$).+",
      "font-.+",
      "leading-.+",
      "tracking-.+",
      "uppercase|lowercase|capitalize|normal-case|italic|not-italic",
      "underline|overline|line-through|no-underline",
      "list-(?:disc|decimal|none)",
    ].join("|") +
    ")$",
);

// Class-shaped: lowercase, digits and Tailwind punctuation, with an optional
// leading "!" or "-". A word with capitals, quotes or sentence punctuation
// other than commas (kept for [&_:is(p,li)]: selectors) makes it prose.
const CLASS_WORD = /^[!-]?[a-z0-9[][a-z0-9:_\-/.,[\]&()%#=>*+~@]*$/;

function* files(dir) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) yield* files(path);
    else if (/\.tsx?$/.test(name)) yield path;
  }
}

function* strings(source) {
  const visit = function* (node) {
    if (
      ts.isStringLiteral(node) ||
      ts.isNoSubstitutionTemplateLiteral(node) ||
      ts.isTemplateHead(node) ||
      ts.isTemplateMiddle(node) ||
      ts.isTemplateTail(node)
    ) {
      if (!isVariantProp(node)) yield node;
    }
    for (const child of node.getChildren(source)) yield* visit(child);
  };
  yield* visit(source);
}

// tone="underline" names a primitive's variant, not a class: only JSX
// attributes called className (or fooClassName) carry classes.
function isVariantProp(node) {
  const attr = node.parent;
  return ts.isJsxAttribute(attr) && !/className$/i.test(attr.name.getText());
}

function styleClasses(text) {
  const words = text.split(/\s+/).filter(Boolean);
  if (!words.length || !words.every((w) => CLASS_WORD.test(w))) return [];
  return words.filter((w) => {
    const base = w
      .replace(/^(?:(?:[^:[\]]|\[[^\]]*\])+:)*/, "")
      .replace(/^[!-]/, "");
    return STYLE.test(base);
  });
}

let failures = 0;
for (const path of files(join(root, "src"))) {
  const rel = relative(root, path);
  if (rel.startsWith(UI) || SKIP.has(rel)) continue;
  const text = readFileSync(path, "utf8");
  const source = ts.createSourceFile(
    path,
    text,
    ts.ScriptTarget.Latest,
    true,
    path.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );
  for (const node of strings(source)) {
    const hits = styleClasses(node.text);
    if (!hits.length) continue;
    const { line } = source.getLineAndCharacterOfPosition(
      node.getStart(source),
    );
    console.error(
      `${rel}:${line + 1}: ${hits.join(" ")}: styling outside src/components/ui (use a primitive variant)`,
    );
    failures += hits.length;
  }
}

if (failures) {
  console.error(`${failures} styling class(es) outside src/components/ui`);
  process.exit(1);
}
console.log("no styling classes outside src/components/ui");
