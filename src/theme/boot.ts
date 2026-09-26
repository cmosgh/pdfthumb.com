// The runtime theme (#138, docs/theming.md), applied before first paint.
//
// nginx inlines the deployment's theme JSON into index.html as
// <script type="application/json" id="pt-theme">. The vite plugin
// (runtimeThemePlugin.ts) inlines this function right after it as a classic
// script, so it runs while <head> is parsed, before <body> exists.
//
// It must stay self-contained: the plugin ships its source text, so it can't
// use imports or anything outside its own body.

export interface RuntimeTheme {
  name: string;
  logo?: { light: string; dark: string };
}

declare global {
  interface Window {
    __PT_THEME__?: RuntimeTheme;
  }
}

// `tokens` is every --pt-* token tokens.css declares, without the prefix.
export function bootRuntimeTheme(tokens: string[]): void {
  const warn = (message: string) => console.warn(`[theme] ${message}`);
  const isObject = (value: unknown): value is Record<string, unknown> =>
    typeof value === "object" && value !== null && !Array.isArray(value);

  let theme: unknown;
  try {
    const source = document.getElementById("pt-theme")?.textContent ?? "";
    // No theme (vite dev and preview have no SSI): the default applies.
    if (!source.trim() || source.includes("<!--#")) return;
    theme = JSON.parse(source);
  } catch {
    warn("the theme is not valid JSON; using the default theme");
    return;
  }
  if (!isObject(theme)) {
    warn("the theme is not a JSON object; using the default theme");
    return;
  }

  const name =
    typeof theme.name === "string" && /^[a-z0-9-]+$/.test(theme.name)
      ? theme.name
      : "custom";

  // The CSS property a token's value must be valid for.
  const property = (token: string) =>
    token.startsWith("font-")
      ? "font-family"
      : token.startsWith("radius-")
        ? "border-radius"
        : "color";

  // html:root and html.dark outrank tokens.css's :root and .dark wherever
  // the stylesheet lands, and .dark wins over :root as it does there.
  const style = document.createElement("style");
  style.id = "pt-theme-tokens";
  document.head.append(style);
  const sheet = style.sheet as CSSStyleSheet;

  for (const [mode, selector] of [
    ["light", "html:root"],
    ["dark", "html.dark"],
  ] as const) {
    const values = theme[mode];
    if (values === undefined) continue;
    if (!isObject(values)) {
      warn(`"${mode}" is not an object; ignored`);
      continue;
    }
    const rule = sheet.cssRules[
      sheet.insertRule(`${selector} {}`, sheet.cssRules.length)
    ] as CSSStyleRule;
    for (const [token, value] of Object.entries(values)) {
      if (!tokens.includes(token)) {
        warn(`${mode}: unknown token "${token}"; ignored`);
      } else if (
        typeof value !== "string" ||
        !CSS.supports(property(token), value)
      ) {
        warn(`${mode}: invalid ${property(token)} for "${token}"; ignored`);
      } else {
        rule.style.setProperty(`--pt-${token}`, value);
      }
    }
  }

  // A logo is a same-origin path or an https URL; dark falls back to light.
  const logoUrl = (value: unknown) => {
    if (typeof value !== "string") return undefined;
    if (/^\/(?!\/)/.test(value) || /^https:\/\//.test(value)) return value;
    warn(`logo "${value}" is not a same-origin path or https URL; ignored`);
    return undefined;
  };
  const logo = isObject(theme.logo) ? theme.logo : {};
  const light = logoUrl(logo.light);
  const dark = logoUrl(logo.dark) ?? light;

  document.documentElement.dataset.theme = name;
  window.__PT_THEME__ = {
    name,
    logo: light && dark ? { light, dark } : undefined,
  };
}
