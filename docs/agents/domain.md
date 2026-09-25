# Domain Docs

This repo shares its domain documentation with the backend, which sits next to it at `../pdfthumbnailpro-be`. There is deliberately no `CONTEXT.md` or `docs/adr/` here: one glossary serves both repos.

## Before exploring, read these

- **`../pdfthumbnailpro-be/CONTEXT.md`**: the glossary (Thumbnail, Usage, Licence, SaaS edition, On-prem edition, …).
- **`../pdfthumbnailpro-be/docs/adr/`**: read the ADRs that touch the area you're about to work in. For this repo, that's mostly 0004 (Licences are delivered through the dashboard) and 0006 (images and Releases).

If you resolve a new term or decision with `/domain-modeling`, write it into the backend repo's `CONTEXT.md` or `docs/adr/`, not into a new file here.

## Use the glossary's vocabulary

When your output names a domain concept (in an issue title, a refactor proposal, a hypothesis, a test name), use the term as defined in `CONTEXT.md`. Don't drift to synonyms the glossary explicitly avoids.

If the concept you need isn't in the glossary yet, that's a signal: either you're inventing language the project doesn't use (reconsider) or there's a real gap (note it for `/domain-modeling`).

## Flag ADR conflicts

If your output contradicts an existing ADR, surface it explicitly rather than silently overriding:

> _Contradicts ADR-0004 (licence lifecycle), but worth reopening because…_
