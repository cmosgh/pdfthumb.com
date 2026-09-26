# Theming

A deployment picks its brand colours, fonts, radii and logo at runtime, from config: the same image serves any theme, with no rebuild (#138). The light/dark toggle works as before: a theme sets values for both modes.

## How it works

1. Every colour, font and radius is a `--pt-*` custom property in `src/tokens.css` (#137). Components only use role classes built on them.
2. A **theme** is a JSON document of token values, plus an optional logo. The image ships two in `public/themes/`: `default` (the stock look, which changes nothing) and `evergreen` (a sample that proves the mechanism).
3. At container start, nginx takes the theme name from `PDFTHUMB_THEME` (`nginx/theme.conf.template`). A custom `theme.json` mounted at `/etc/pdfthumb/theme.json` overrides the name.
4. nginx inlines the selected theme into `index.html` through SSI, as `<script type="application/json" id="pt-theme">`. The boot script right after it (`src/theme/boot.ts`) validates it and applies it while `<head>` is still being parsed. So the default theme never paints, and no extra request is made.
5. Validation is per token. An unknown token, or a value that isn't valid CSS for its kind, is skipped with a console warning, and that token keeps its default. Broken JSON leaves the whole default theme. A bad theme never breaks the page.

## The format

The schema is `public/themes/theme.schema.json`; `public/themes/evergreen.json` is a complete example.

```json
{
  "$schema": "./theme.schema.json",
  "name": "acme",
  "logo": {
    "light": "/themes/acme-logo.svg",
    "dark": "https://cdn.example.com/acme-dark.svg"
  },
  "light": {
    "accent": "#c2410c",
    "accent-hover": "#9a3412",
    "radius-lg": "1rem"
  },
  "dark": { "accent": "#fb923c" }
}
```

- `name`: lowercase letters, digits and dashes. It lands on `<html data-theme="…">`.
- `light` / `dark`: token values, keyed by the token name without `--pt-`. A light value also applies in dark mode where the default dark theme sets nothing for that token (the fonts and radii, for example).
- Value kinds: `font-*` tokens take a `font-family` list, `radius-*` tokens take a length, and every other token takes a colour (any CSS colour, including `color-mix()`).
- `logo`: the mark beside the product name in the navbar and footer. It must be a same-origin path (`/…`) or an `https://` URL. `dark` falls back to `light`. Without a logo the default icon stays.
- The JSON must not contain `<`, because nginx inlines it into the page. The chart refuses such a theme.

## Tokens

The schema lists every token; `src/tokens.css` has the default values and groups them:

| Group               | Tokens                                                                                                                                                                                                                                                               |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Fonts, radii        | `font-sans`, `font-mono`, `radius-sm`, `radius-md`, `radius-lg`, `radius-xl`                                                                                                                                                                                         |
| Surfaces            | `page`, `surface`, `surface-raised`, `band`, `muted`, `muted-hover`, `neutral`, `neutral-hover`, `chip`, `code`, `code-fg`, `code-line`, `overlay`, `frame`                                                                                                          |
| Text                | `heading`, `fg-strong`, `fg`, `fg-2`, `fg-muted`, `fg-caption`, `fg-subtle`, `fg-label`, `fg-faint`                                                                                                                                                                  |
| Accent              | `accent`, `accent-hover`, `on-accent`, `on-accent-muted`, `link`, `link-hover`, `accent-soft`, `accent-soft-hover`, `accent-soft-fg`, `accent-tint`, `selected`, `focus`                                                                                             |
| Lines               | `line`, `line-strong`, `line-input`                                                                                                                                                                                                                                  |
| States              | `danger`, `danger-hover`, `danger-fg`, `danger-soft`, `danger-line`, `danger-muted`, `danger-muted-hover`, `danger-muted-fg`, `success`, `success-hover`, `success-fg`, `success-muted`, `success-muted-fg`, `warning`, `warning-fg`, `warning-soft`, `warning-line` |
| Gradients           | `hero-start`, `hero-end`, `cta-start`, `cta-end`                                                                                                                                                                                                                     |
| Charts              | `chart-1`, `chart-2`, `chart-grid`, `chart-axis`                                                                                                                                                                                                                     |
| Shadows, scrollbars | `elevation`, `elevation-deep`, `scrollbar-track`, `scrollbar-thumb`, `scrollbar-thumb-hover`                                                                                                                                                                         |

A font the theme names must already be available to the browser: the page loads only Inter.

## Setting it as an operator

**Helm** (`infra/pdfthumb-dashboard`):

```yaml
theme:
  name: evergreen # a shipped theme; production stays "default"
  # or a custom theme, which wins over `name`:
  json: |
    {"name": "acme", "light": {"accent": "#c2410c"}}
```

A changed theme rolls the pods, because nginx reads it at start.

**docker run**, with the same hardening the chart uses:

```sh
docker run --read-only --tmpfs /var/cache/nginx:uid=101,gid=101 --tmpfs /var/run:uid=101,gid=101 \
  -e PDFTHUMB_THEME=evergreen -p 8080:8080 ghcr.io/cmosgh/pdfthumb.com
# a custom theme: mount a directory that holds theme.json
docker run … -v "$PWD/my-theme:/etc/pdfthumb:ro" ghcr.io/cmosgh/pdfthumb.com
```

To check which theme a deployment serves, fetch `/theme.json`.

## Adding a shipped theme

Add `public/themes/<name>.json` (and any logo files next to it). `tests/runtime-theme.spec.ts` checks every token in the schema against `src/tokens.css`, and the shipped themes against the schema and the browser's CSS parser. A new token in `tokens.css` needs its entry in the schema.
