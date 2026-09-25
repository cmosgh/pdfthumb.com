# #137 design tokens: working notes and visual regression

Work in progress on `refactor/137-design-tokens`. This folder holds the local
visual-regression harness and the colour inventory the tokens are built from.
Decide before the PR whether `vr/` stays in the repo (as a documented local
check) or goes.

## Visual regression (local, chromium)

`vr/visual.spec.ts` screenshots `/`, `/docs`, `/login`, `/status`, `/terms`,
an unknown path, `/dashboard/overview` and `/dashboard/settings`, in light and
dark, at 390 and 1280 px (32 shots, full page; the dashboard pages use a
1600 px tall viewport because the layout is `h-screen`). The API is mocked and
the clock fixed, so two runs of the same build match pixel for pixel
(`maxDiffPixelRatio: 0`).

```bash
export PATH=$HOME/.nvm/versions/node/v24.20.0/bin:$PATH \
  LD_LIBRARY_PATH=$HOME/.cache/pw-libs/root/usr/lib/x86_64-linux-gnu \
  FONTCONFIG_FILE=$HOME/.cache/pw-libs/fonts.conf

# 1. Baselines from main (69a6bb0 or later), in a checkout of main:
npx playwright test -c vr/playwright.vr.config.ts --update-snapshots
# 2. On the branch, compare (same machine, same fonts):
VR_SNAPSHOTS=/path/to/main/vr/__snapshots__/{arg}{ext} \
  npx playwright test -c vr/playwright.vr.config.ts
```

Baselines are platform-specific (fonts, GPU), so they aren't committed
(`vr/__snapshots__/` is in `.git/info/exclude`). `VR_PORT` picks another
port when a second worktree is running.

## Inventory

`python3 vr/pairs.py > vr/pairs.txt` (from the repo root) lists every colour
utility in `src/` grouped by element and property, as
`count  [state]property  light  dark  files`. On 69a6bb0: **123 distinct
(light, dark) pairs**, 22 hex colours (charts, `BarChart.tsx`,
`RequestsPerDay.tsx`), `gray-*` and `slate-*` mixed, and 28 files with
`dark:` colour variants.

## Token plan (about 25 roles)

Values live in `--pt-*` custom properties on `:root` and `.dark`, mapped into
Tailwind with `@theme inline { --color-<role>: var(--pt-<role>) }`, so a
runtime theme (#138) overrides `--pt-*` without a rebuild. Light / dark values
below use Tailwind's palette; `gray-*` collapses into `slate-*`.

| Role                                           | Light                                                                                    | Dark                                           | Replaces (main uses)                                                                  |
| ---------------------------------------------- | ---------------------------------------------------------------------------------------- | ---------------------------------------------- | ------------------------------------------------------------------------------------- |
| `page`                                         | slate-50                                                                                 | slate-900                                      | gray-50/slate-900, slate-50/slate-900 page backgrounds                                |
| `surface`                                      | white                                                                                    | slate-800                                      | white/slate-800 (cards, navbar, dialogs: 20)                                          |
| `surface-2`                                    | white                                                                                    | slate-700                                      | white/slate-700 (feature, pricing, login cards)                                       |
| `band`                                         | slate-100                                                                                | slate-800                                      | footer, features section                                                              |
| `muted`                                        | slate-100                                                                                | slate-700                                      | slate-100, gray-50, gray-100, slate-50, slate-200 / slate-700 fills                   |
| `muted-hover`                                  | slate-200                                                                                | slate-600                                      | hover fills, gray-200/slate-500, gray-100/slate-600 buttons                           |
| `code`                                         | slate-900                                                                                | slate-800                                      | code blocks (text `on-code` slate-100)                                                |
| `overlay`                                      | black/50                                                                                 | black/50                                       | modal backdrops                                                                       |
| `heading`                                      | slate-800                                                                                | white                                          | slate-800/white, gray-900/white headings                                              |
| `fg`                                           | slate-800                                                                                | slate-100                                      | slate-800, gray-900, slate-900, gray-700 / slate-100                                  |
| `fg-2`                                         | slate-700                                                                                | slate-200                                      | slate-700/slate-200, gray-700/slate-200                                               |
| `fg-muted`                                     | slate-600                                                                                | slate-300                                      | slate-600/slate-300 (31), gray-500, gray-600, gray-700, slate-700 / slate-300         |
| `fg-subtle`                                    | slate-500                                                                                | slate-400                                      | slate-500/slate-400, slate-600/slate-400, gray-500/-600 / slate-400                   |
| `fg-faint`                                     | slate-400                                                                                | slate-500                                      | gray-400/slate-500                                                                    |
| `on-accent`                                    | white                                                                                    | white                                          | text on accent buttons                                                                |
| `accent`                                       | indigo-600                                                                               | indigo-500                                     | button fills and borders (indigo-600 alone becomes indigo-500 in dark: list it)       |
| `accent-hover`                                 | indigo-700                                                                               | indigo-600                                     |                                                                                       |
| `link`                                         | indigo-600                                                                               | indigo-400                                     | text-indigo-600/400 links and hover text                                              |
| `link-hover`                                   | indigo-700                                                                               | indigo-500                                     |                                                                                       |
| `accent-soft` / `-hover` / `-fg`               | indigo-100 / indigo-200 / indigo-700                                                     | slate-700 / slate-600 / indigo-300             | secondary buttons                                                                     |
| `accent-tint`                                  | indigo-100                                                                               | indigo-500/20                                  | feature icons; indigo-50 hover collapses in                                           |
| `focus`                                        | indigo-500                                                                               | indigo-400                                     | focus rings; `ring-offset` white / slate-900                                          |
| `line` / `line-strong` / `line-input`          | slate-200 / slate-200 / slate-300                                                        | slate-700 / slate-600 / slate-600              | borders, dividers                                                                     |
| `danger` (+ `-hover`, `-fg`, `-soft`, `-line`) | red-600, red-700, red-700, red-50, red-200                                               | red-600, red-700, red-300, red-900/20, red-800 | delete buttons, errors                                                                |
| `success` (+ `-soft`, `-soft-fg`)              | green-600, green-100, green-800                                                          | green-600, green-900, green-200                | key status, generate                                                                  |
| `warning` (+ `-soft`, `-line`, `-fg`)          | amber-500, amber-50, amber-200, amber-800                                                | amber-500, amber-900/20, amber-800, amber-200  | key dialog, status dot                                                                |
| gradients                                      | hero slate-50 → sky-100; CTA indigo-600 → purple-600                                     | slate-800 → sky-900; indigo-700 → purple-700   | Hero, DashboardLayout, CTA                                                            |
| charts                                         | `chart-1` indigo-500, `chart-2` rose-500, `chart-grid` slate-400, `chart-axis` slate-500 | same                                           | hex in `BarChart.tsx`, `RequestsPerDay.tsx` (pass `var(--color-chart-1)` as the fill) |

Open points found so far:

- **Dark-only shadow colours** (`dark:shadow-slate-700`, `/50`, `/60` on the
  navbar, dashboard and cards): Tailwind v4 mixes the shadow colour into the
  shadow value, so a light value must reproduce the default `rgb(0 0 0 / α)`.
  Test `shadow-(color:--pt-shadow)` in the build before choosing.
- **`PricingCard.tsx` builds classes with `.replace()`** on
  `tier.highlightColor` (`bg-indigo-500` / `bg-blue-500` in `types.ts` and
  `constants.ts`). Tailwind can't see them and a literal-class guard wouldn't
  either: replace with static semantic classes, and make the guard also reject
  palette names inside any string in `src/` (not only `className`).
- Check that `var(--color-slate-50)` referenced from plain CSS gets emitted by
  Tailwind v4; if not, use `@theme static` or literal values in the tokens
  file.
- BE #350 is live: drop the tolerant parsing in `src/api.ts`
  (`AnalyticsDailyBucket` `number | string`) and `toDailyRequests`
  (`slice`, `Number`), and the Postgres-shaped mock in
  `tests/dashboard.spec.ts`, while `RequestsPerDay` moves to tokens.
- Tidy while touching them: the duplicated `count` helper
  (`PlanQuota.tsx`, `RequestsPerDay.tsx`), and PlanQuota's `en-GB` month (it
  prints "Sept" for September, like `/status` did before its hand-built
  format).
- Housekeeping from the issue: delete the 0-byte `src/components/CodeBlock.tsx`,
  and move emoji that carry meaning (the 🔒 in `__root.tsx`'s session dialog,
  ⚙ in the sidebar) to SVG.
