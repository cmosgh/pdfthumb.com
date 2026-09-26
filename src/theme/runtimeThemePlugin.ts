import { readFileSync } from "node:fs";
import type { Plugin } from "vite";
import { bootRuntimeTheme } from "./boot.ts";

// Every --pt-* token a stylesheet declares, without the prefix.
export function tokenNames(css: string): string[] {
  return [
    ...new Set(
      [...css.matchAll(/^\s*--pt-([a-z0-9-]+)\s*:/gm)].map((m) => m[1]),
    ),
  ];
}

const SLOT = "<!-- pt-theme-boot -->";

// Replaces the slot in index.html with bootRuntimeTheme as an inline classic
// script, given the token names in src/tokens.css (#138).
export function runtimeTheme(): Plugin {
  const tokensFile = new URL("../tokens.css", import.meta.url);
  return {
    name: "pdfthumb-runtime-theme",
    transformIndexHtml(html) {
      if (!html.includes(SLOT)) {
        throw new Error(`index.html has no ${SLOT} slot`);
      }
      const tokens = tokenNames(readFileSync(tokensFile, "utf8"));
      const script = `<script>(${bootRuntimeTheme.toString()})(${JSON.stringify(tokens)});</script>`;
      return html.replace(SLOT, () => script);
    },
  };
}
