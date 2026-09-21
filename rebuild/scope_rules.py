"""Rebuild scope rules - authoritative source for history reconstruction.

Locked decisions (full spec recorded in docs/history-rebuild.md):

    R1  vocabulary: customer-web, customer-mobile, provider-web, provider-mobile,
                    backend, provider, shared, shared-web, shared-mobile, cicd, repo
    R2  pre-split flat apps map to the *customer* applications
    R3  `shared` only for code genuinely consumed by more than one surface
    R4  multi-surface commits are split per surface where separable
    R5  `provider` is reserved for the PRV phase/roadmap ladder
    R10 tags identify the completed unit; provider-phaseNN-v1 is preserved

    Ruling 1  design-system / i18n *infrastructure* -> shared-web / shared-mobile
    Ruling 2  directory split/rename/move commits   -> refactor(repo)
    Ruling 3  new unit tags; only provider-phaseNN-v1 is re-pointed
    Ruling 4  wip/mixed-phase20-maps excluded, branch untouched
"""

from __future__ import annotations

VERSION = 1

#: Ordered - first matching prefix wins.
PATH_RULES: list[tuple[str, str, str]] = [
    ("applications/frontend/web/web-user/", "customer-web", "post-split"),
    ("applications/frontend/web/web-provider/", "provider-web", "post-split"),
    ("applications/frontend/mobile/user-app/", "customer-mobile", "post-split"),
    ("applications/frontend/mobile/provider-app/", "provider-mobile", "post-split"),
    ("applications/frontend/web/", "customer-web", "pre-split (R2)"),
    ("applications/frontend/mobile/", "customer-mobile", "pre-split (R2)"),
    ("applications/backend/", "backend", ""),
    (".github/", "cicd", ""),
    ("security/", "cicd", ""),
    ("infra/", "cicd", ""),
    ("scripts/", "cicd", ""),
    ("docker-compose.yml", "cicd", ""),
    (".gitleaks.toml", "cicd", ""),
    (".pre-commit-config.yaml", "cicd", ""),
    ("docs/", "repo", ""),
    ("AGENTS.md", "repo", ""),
    ("README.md", "repo", ""),
    (".gitignore", "repo", ""),
    (".gitattributes", "repo", ""),
    ("storage_mar.json", "repo", ""),
]

#: Paths that must never appear in the rebuilt history.
EXCLUDED_PREFIXES: tuple[str, ...] = (
    ".git-history-backup/",
    ".claude/",
)

#: Surfaces that describe an application (used by R6/R8 module naming).
APP_SURFACES: tuple[str, ...] = (
    "customer-web",
    "customer-mobile",
    "provider-web",
    "provider-mobile",
)

#: Recognised scopes in the rebuilt history.
VALID_SCOPES: tuple[str, ...] = (
    "customer-web",
    "customer-mobile",
    "provider-web",
    "provider-mobile",
    "backend",
    "provider",
    "shared",
    "shared-web",
    "shared-mobile",
    "cicd",
    "repo",
)

#: Legacy scopes that must not survive into the rebuilt history.
LEGACY_SCOPES: tuple[str, ...] = (
    "web",
    "web-user",
    "web-provider",
    "mobile",
    "frontend",
    "provider-app",
)

#: Semantic overrides keyed by full SHA in the *current* dev lineage.
#: Path-derived classification cannot express these (R2/R3 + Rulings 1-2).
#: action: single | needs_split | needs_review
OVERRIDES: dict[str, dict[str, str]] = {
    # --- Ruling 2: repository structure changes -> refactor(repo) -------------
    "ed420407f0a34002400c3a97305e61bf013f535c": {
        "type": "refactor",
        "scope": "repo",
        "action": "single",
        "note": "structural: split frontend/web into web-user and web-provider (Ruling 2)",
    },
    "35511867b4dff86d763bb310941400185e1d43a8": {
        "type": "refactor",
        "scope": "repo",
        "action": "single",
        "note": "structural: nest web-user and web-provider under web/ (Ruling 2)",
    },
    "35ba7f4c1c137c79b84555bc70517427e66adb18": {
        "type": "refactor",
        "scope": "repo",
        "action": "single",
        "note": "structural: move customer app into mobile/user-app (Ruling 2)",
    },
    # --- backend reorganisation (not repo-level) -----------------------------
    "aa98be0d22f0faac74eacb1532cd1de9b7625d29": {
        "type": "refactor",
        "scope": "backend",
        "action": "single",
        "note": "backend: split app/integrations into internal/external",
    },
    # --- Ruling 1: design-system / i18n infrastructure -----------------------
    "3289378b4de69bd08d517847af9476201efbdd90": {
        "type": "feat",
        "scope": "shared-web",
        "action": "single",
        "note": "Ruling 1: web i18n infrastructure",
    },
    "2b69997de7de4ef03e23b602773520f41046d1aa": {
        "type": "feat",
        "scope": "shared-mobile",
        "action": "single",
        "note": "Ruling 1: mobile i18n infrastructure",
    },
    "47c8bef60773f4ac471be8214d39260950067fe5": {
        "type": "feat",
        "scope": "shared-web",
        "action": "single",
        "note": "Ruling 1: shared primitives (Tabs/Checkbox/Switch)",
    },
    "8311323cee4806763358580dc1e8376f789116ed": {
        "type": "feat",
        "scope": "shared-web",
        "action": "single",
        "note": "Ruling 1: shared dialogs + wizard primitives",
    },
    "4bbd2268b006e450e19f2fb9da5cfff6ebb40fa2": {
        "type": "feat",
        "scope": "shared-web",
        "action": "single",
        "note": "Ruling 1: design-system pass",
    },
    # --- R4: split across shared i18n surfaces -------------------------------
    # 8e8ce8c8 touches the pre-split web + mobile language files. R4 splits
    # it into shared-web + shared-mobile (Ruling 1 infrastructure).
    "8e8ce8c8a89f956d9dccbe0df1c08ce3987705a4": {
        "action": "needs_split",
        "note": "R4 split: web language file -> shared-web, mobile language file -> shared-mobile (Ruling 1)",
    },
    # 56749f43 is backend-only (attribution unit/integration tests).
    "56749f43f8cc262b0c53c743f41f91b402ab015a": {
        "type": "feat",
        "scope": "backend",
        "action": "single",
        "note": "backend-only attribution tests, no frontend files",
    },
    # --- R4 candidates: genuinely multi-surface ------------------------------
    "26c53e031f415d68bf608276f6352e1a22526f35": {
        "action": "needs_split",
        "note": "client attribution headers touch customer-web + customer-mobile + provider-web (R4)",
    },
    "d54a5190ba15b72a60922e7afb3c3798d99dd306": {
        "type": "docs",
        "scope": "repo",
        "action": "single",
        "note": "docs + READMEs only",
    },
}

#: Conventional-type hints for historical subjects that predate the convention.
TYPE_HINTS: tuple[tuple[str, str], ...] = (
    ("add ", "feat"),
    ("wire ", "feat"),
    ("build ", "feat"),
    ("introduce ", "feat"),
    ("fix ", "fix"),
    ("correct ", "fix"),
    ("resolve ", "fix"),
    ("update ", "chore"),
    ("remove ", "chore"),
    ("delete ", "chore"),
    ("move ", "refactor"),
    ("split ", "refactor"),
    ("nest ", "refactor"),
    ("rename ", "refactor"),
    ("apply ", "chore"),
    ("document ", "docs"),
)

