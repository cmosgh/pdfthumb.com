#!/usr/bin/env node
// Fails if a colour is set anywhere but the tokens file (#137).
//
// Components colour themselves with role classes (bg-surface, text-fg-muted,
// ...) defined in src/tokens.css, so a runtime theme (#138) can restyle
// everything by overriding --pt-* custom properties. This check rejects, in
// src/ and index.html outside src/tokens.css:
//   - stock palette names anywhere, in any string or comment ("bg-sky-500",
//     "sky-500" built into a class with .replace(), bg-white, text-black);
//   - dark: colour variants (dark mode swaps variable values instead);
//   - hex colours and rgb()/hsl()/oklch()/oklab() literals.
//
// Usage: node scripts/check-design-tokens.mjs [root]

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const root = process.argv[2] ?? ".";
const TOKENS = "src/tokens.css";

const HUES =
  "slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose";
const PROPS =
  "bg|text|border|ring|ring-offset|divide|from|to|via|fill|stroke|shadow|outline|placeholder|decoration|accent|caret";

const RULES = [
  {
    why: "stock palette colour (use a role from src/tokens.css)",
    re: new RegExp(`\\b(?:${HUES})-(?:50|[1-9]00|950)\\b`, "g"),
  },
  {
    why: "stock white/black utility (use a role from src/tokens.css)",
    re: new RegExp(`\\b(?:${PROPS})-(?:white|black)\\b`, "g"),
  },
  {
    why: "dark: colour variant (set the dark value in src/tokens.css)",
    re: new RegExp(`\\bdark:(?:[a-z-]+:)*(?:${PROPS})-[a-z]`, "g"),
  },
  {
    why: "colour literal (add a token to src/tokens.css)",
    re: /\b(?:rgba?|hsla?|oklch|oklab)\(/g,
    code: true,
  },
  {
    why: "hex colour (add a token to src/tokens.css)",
    re: /#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3,4})\b/g,
    code: true,
  },
];

// Comments may cite issues ("#137"), so the literal rules skip them. A "//"
// counts as a comment only after whitespace or at the start of a line, so
// URLs in strings stay code.
function stripComments(text) {
  return text
    .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, " "))
    .replace(/<!--[\s\S]*?-->/g, (m) => m.replace(/[^\n]/g, " "))
    .replace(
      /(^|\s)\/\/.*$/gm,
      (m, lead) => lead + " ".repeat(m.length - lead.length),
    );
}

function* files(dir) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) yield* files(path);
    else if (/\.(tsx?|css|html)$/.test(name)) yield path;
  }
}

const targets = [...files(join(root, "src")), join(root, "index.html")];
let failures = 0;
for (const path of targets) {
  const rel = relative(root, path);
  if (rel === TOKENS || rel === "src/routeTree.gen.ts") continue;
  const text = readFileSync(path, "utf8");
  const code = stripComments(text);
  for (const { why, re, code: codeOnly } of RULES) {
    const source = codeOnly ? code : text;
    for (const m of source.matchAll(re)) {
      const line = source.slice(0, m.index).split("\n").length;
      console.error(`${rel}:${line}: ${m[0]}: ${why}`);
      failures++;
    }
  }
}

if (failures) {
  console.error(`${failures} colour(s) outside ${TOKENS}`);
  process.exit(1);
}
console.log(`no colours outside ${TOKENS}`);
