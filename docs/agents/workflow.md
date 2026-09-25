# Workflow

How a change gets from ticket to production in this repo. Each step is done when its check passes.

## The path of a change

1. **Ticket.** New work starts as a GitHub issue carrying three labels: a category (`bug` / `enhancement`), a priority (`P0`–`P3`) and a state (see `docs/agents/triage-labels.md`). Done when the issue carries all three.
2. **Claim.** `gh issue edit N --add-assignee @me` before touching code. Done when you're the assignee.
3. **Red, then green.** Write the Playwright e2e test first and watch it fail on the bug or missing feature, then make it pass. Done when the new test fails on `main` and passes on the branch.
4. **Review.** Run `/code-review` in a separate subagent (Sonnet preferred), never in the session that wrote the code. Done when it reports no blocking findings, or you've fixed them.
5. **Merge gate.** Done when CI is green (build, e2e on chromium, firefox and webkit, image smoke) and `closingIssuesReferences` (`gh api graphql`) lists exactly the issues the PR should close. Then squash-merge.
6. **Verify.** Every push to `main` deploys. Done when `gh run view <deploy run> --log | grep "Ready pod(s) run"` shows the merge commit's SHA, and the behaviour the ticket describes reproduces on https://pdfthumb.com. The digest may repeat the previous one when the built `dist/` is byte-identical, e.g. after a dev-only bump.

## Local Playwright

This machine needs nvm Node 24 plus browser libraries and fonts unpacked under `~/.cache/pw-libs`:

```bash
export PATH=$HOME/.nvm/versions/node/v24.20.0/bin:$PATH \
  LD_LIBRARY_PATH=$HOME/.cache/pw-libs/root/usr/lib/x86_64-linux-gnu \
  FONTCONFIG_FILE=$HOME/.cache/pw-libs/fonts.conf
npx playwright test --project=chromium
```

Without the fonts, text renders 0px tall and every text `toBeVisible` fails.

## Guardrails

- **Authorship.** Commits, PR titles and bodies, and issues carry only the human author: leave out every Claude/Anthropic attribution line (`Co-Authored-By`, `Claude-Session`, "Generated with …").
- **The image is public.** It holds only the static bundle: keep secrets, env files, source maps and backend or business details out of it. `scripts/check-public-bundle.sh` enforces part of this at build time; the rest is on you.
- **Repo settings stay as they are.** PRs are collaborators-only, and the `production` environment deploys only from `main` (why: `docs/agents/issue-tracker.md`); keep them exactly as set.

## Dependabot

- **Node stays on LTS (even) majors.** `.github/dependabot.yml` ignores the odd ones. `.nvmrc` is the one Node version: a Dependabot bump of the Dockerfile's `node` image fails `scripts/check-node-pins.sh` until you update `.nvmrc` on that PR to match.
- **The `tanstack-db` group** keeps `@tanstack/db`, `react-db` and `query-db-collection` together; they pin each other's exact version.
- **One PR at a time:** `@dependabot rebase`, wait until the head contains `origin/main`, then run the merge gate above. A major that needs code changes becomes its own ticket.
- **A dropped security group:** if Dependabot closes a security PR without the fix landing, land it yourself as a lockfile-only `npm update <pkgs>` / `npm audit fix` (see #96).

## Questions

Send questions to the `pdfthumb coordinator` session as lettered options with a recommendation, and carry on with independent work until it relays the answer.
