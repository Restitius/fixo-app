# Git workflow operations

The authoritative policy is [git-staging.md](../applications/backend/docs/git-staging.md).
Only `dev`, `staging`, and `main` are permanent. Page and module branches are
temporary integration branches, not additional permanent environments.

## Starting and integrating work

Fetch origin, verify a clean worktree, and update dev with `git pull --ff-only`.
If dev diverges, stop and review the commits instead of resetting or force-pushing.
Create `module/<name>` from dev for a completed release batch. Start each
`fix/<task>` or `feature/<task>` and its `page/<name>` from the current module
tip. Merge the feature into the page and the page into the module before
starting the next page. This keeps each page's graph diamond short while the
module receives exactly one merge into dev. For unrelated work, start a new
module batch from the then-current dev tip.
Open reviewed PRs in this order:

1. `fix/*` or `feature/*` into `page/*`: fix tests and code review.
2. `page/*` into `module/*`: complete page validation.
3. `module/*` into `dev`: functional, integration, security, authorization,
   validation, and regression evidence for the complete module.
4. `dev` into `staging`: stable, completed milestone only.
5. `staging` into `main`: QA/UAT, regression, security, performance, and
   deployment verification, plus release approval.

Fill in the PR validation checkboxes and evidence. The flow check validates
branch routing and evidence presence; it cannot prove that testing occurred.
Reviewers must verify results. Prefer merge commits for integration and promotion
to retain ancestry for safe branch deletion; do not rewrite historical commits
merely to simplify the graph. Delete a temporary branch after its PR is merged
and its tip is an ancestor of the destination. Never delete the three permanent
branches. Avoid automatic deletion of all PR heads: dev and staging are PR heads too.

## GitHub activation

Apply the JSON rulesets in `security/policies/` to their matching branches.
Require `git-flow-gate`, `pr-gate`, and `security-gate`, with reviewed PRs and
no force pushes. Also apply `integration-ruleset.json` to temporary page/module
branches. Local JSON files alone do not configure GitHub.

CI actions are pinned to verified upstream commits recorded in
`ci-action-pins.json`. Validate their runs before activating required checks. Deployment
workflows also require operational validation: production currently tests the
exact main SHA against staging, which a normal promotion merge changes, and
staging artifact retrieval must resolve the successful build run. These are
existing deployment gaps; do not promote a release until resolved and tested.

## Existing history migration

Back up all Git refs to a verified bundle outside the repository before pruning.
Delete only temporary local branches already reachable from dev. Preserve
unmerged branches for review, even when their names are old. Do not delete tags,
stash entries, checkpoint refs, or remote branches as part of local cleanup.
Archived merge commits remain visible: removing branch names does not rewrite
history. Audit the live remote before attempting remote cleanup.

The owner explicitly authorized a one-time full history rebuild on 2026-09-19.
This does not authorize routine force pushes. See `history-rebuild.md` for the
recovery inventory, source verification, and outstanding promotion gates.
