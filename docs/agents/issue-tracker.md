# Issue tracker: GitHub (the backend repo's issues)

This repo has no issue tracker of its own. All work, dashboard work included, is tracked in the **backend repo's** GitHub Issues: `cmosgh/pdfthumbnailpro-be`. The wayfinder map lives there (#168), and so does every dashboard ticket, e.g. #212 (deploy the SaaS dashboard). Don't open issues on `cmosgh/pdfthumb.com`.

Use the `gh` CLI, always with `-R cmosgh/pdfthumbnailpro-be`. `gh` would otherwise infer this repo from `git remote`.

## Conventions

- **Create an issue**: `gh issue create -R cmosgh/pdfthumbnailpro-be --title "..." --body "..."`. Use a heredoc for multi-line bodies. Start the title or body with "Dashboard:" or mention `pdfthumb.com` so the ticket is clearly about this repo.
- **Read an issue**: `gh issue view <number> -R cmosgh/pdfthumbnailpro-be --json title,body,labels,comments --jq '.body, (.comments[] | "--- \(.author.login) \(.createdAt)\n\(.body)")'`. Plain `gh issue view --comments` fails on this repo with a Projects (classic) deprecation error.
- **List issues**: `gh issue list -R cmosgh/pdfthumbnailpro-be --state open --json number,title,labels,assignees` with appropriate `--label` filters.
- **Comment on an issue**: `gh issue comment <number> -R cmosgh/pdfthumbnailpro-be --body "..."`
- **Apply / remove labels**: `gh issue edit <number> -R cmosgh/pdfthumbnailpro-be --add-label "..."` / `--remove-label "..."`
- **Claim**: `gh issue edit <number> -R cmosgh/pdfthumbnailpro-be --add-assignee @me` before starting any work.
- **Close**: `gh issue close <number> -R cmosgh/pdfthumbnailpro-be --comment "..."`

Pull requests are opened on **this** repo (`cmosgh/pdfthumb.com`). Reference the ticket in full as `cmosgh/pdfthumbnailpro-be#<n>`. A bare `#<n>` would point at this repo, and a `Closes` keyword can't close an issue in another repo, so close the ticket by hand after the merge is verified.

## Pull requests as a triage surface

**PRs as a request surface: no.** This repo is public, and new pull requests are restricted to collaborators (`pull_request_creation_policy=collaborators_only`). Keep that setting: a self-hosted runner on bigmama serves this repo, and a PR from anyone could run code on it.

## When a skill says "publish to the issue tracker"

Create a GitHub issue on `cmosgh/pdfthumbnailpro-be`.

## When a skill says "fetch the relevant ticket"

Run the **Read an issue** command above.

## Wayfinding operations

The map is `cmosgh/pdfthumbnailpro-be#168`. Follow `../pdfthumbnailpro-be/docs/agents/issue-tracker.md` § "Wayfinding operations", adding `-R cmosgh/pdfthumbnailpro-be` to every `gh` call. The map belongs to the backend repo: never start a second map here.
