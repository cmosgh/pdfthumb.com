# Visual regression (local check)

Screenshots of every page, compared pixel by pixel with baselines taken from
`main`. Use it to prove a refactor has no visible change (#137, #146), or to
see exactly what a styling change touched. It runs locally only; it isn't in
CI.

`vr/visual.spec.ts` shoots `/`, `/docs`, `/login`, `/status`, `/terms`, an
unknown path, `/dashboard/overview` and `/dashboard/settings`, in light and
dark, at 390 and 1280 px: 32 full-page shots. The dashboard pages use a
1600 px tall viewport because their layout is `h-screen`. The API is mocked
and the clock fixed, so two runs of the same build match exactly.

```bash
export PATH=$HOME/.nvm/versions/node/v24.20.0/bin:$PATH \
  LD_LIBRARY_PATH=$HOME/.cache/pw-libs/root/usr/lib/x86_64-linux-gnu \
  FONTCONFIG_FILE=$HOME/.cache/pw-libs/fonts.conf

# 1. Baselines, in a checkout of main:
VR_SNAPSHOTS='/tmp/vr-main/{arg}{ext}' \
  npx playwright test -c vr/playwright.vr.config.ts --update-snapshots
# 2. On the branch, compare (same machine, same fonts):
VR_SNAPSHOTS='/tmp/vr-main/{arg}{ext}' \
  npx playwright test -c vr/playwright.vr.config.ts
```

- Every shot must match with no differing pixel beyond Playwright's default
  per-pixel colour tolerance (0.2). `VR_THRESHOLD=0` drops that tolerance
  and shows every changed pixel, however faint: use it to list the small
  shifts a PR makes.
- On failure, Playwright writes `*-expected.png`, `*-actual.png` and
  `*-diff.png` under `test-results/`.
- `VR_PORT` picks another port (default 4313) when a second worktree is
  serving.
- Baselines depend on the platform (fonts, GPU), so they aren't committed
  (`vr/__snapshots__/` is the default location; keep it out of git).
