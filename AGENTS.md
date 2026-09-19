# Repository Git workflow

Follow [the Git staging policy](applications/backend/docs/git-staging.md) for all work.

- Only `dev`, `staging`, and `main` are permanent branches.
- Start temporary `fix/*` or `feature/*` branches from current `dev`.
- Use temporary `page/*` and `module/*` integration branches, also based on `dev`.
- Route reviewed, tested changes through `fix/feature -> page -> module -> dev -> staging -> main`.
- Never promote unfinished work or bypass page/module validation.
- Delete temporary branches only after successful integration and verification that no unique work is lost.
- Preserve uncommitted work; do not rewrite shared history or force-push as routine cleanup.
- Follow the operational details in [the workflow guide](docs/git-workflow.md).
