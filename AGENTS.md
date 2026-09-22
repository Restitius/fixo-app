# Repository Git workflow

Follow [the Git staging policy](applications/backend/docs/git-staging.md) for all work.

- Only `dev`, `staging`, and `main` are permanent branches.
- Start each temporary `module/*` integration branch from current `dev`.
- For the first page in a module batch, start temporary `fix/*` or `feature/*` and `page/*` branches from that module tip. For each later page, start them from the module's current tip so the graph has short page diamonds.
- Route reviewed, tested changes through `fix/feature -> page -> module -> dev -> staging -> main`.
- Never promote unfinished work or bypass page/module validation.
- Delete temporary branches only after successful integration and verification that no unique work is lost.
- Preserve uncommitted work; do not rewrite shared history or force-push as routine cleanup.
- Follow the operational details in [the workflow guide](docs/git-workflow.md).
