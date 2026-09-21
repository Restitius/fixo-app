#!/usr/bin/env python3
"""Generate the first-commit -> latest-commit reconstruction matrix.

Reads the current history read-only and emits:

    rebuild/commit-map.tsv   one row per non-merge commit
    rebuild/merge-map.tsv    one row per merge commit
    rebuild/commit-map.summary.md

Nothing is rewritten here - this is the blueprint for the rebuild.

Usage:
    python scripts/git/classify_commit.py --rev dev
"""

from __future__ import annotations

import argparse
import csv
import os
import re
import subprocess
import sys
from collections import Counter

_HERE = os.path.dirname(os.path.abspath(__file__))
_ROOT = os.path.abspath(os.path.join(_HERE, "..", ".."))
sys.path.insert(0, os.path.join(_ROOT, "rebuild"))

import scope_rules as R  # noqa: E402

SUBJECT_RE = re.compile(r"^(?P<type>[a-z]+)(?:\((?P<scope>[a-z0-9_-]+)\))?(?P<rest>[:,].*)?$")
MERGE_PAGE_TO_MODULE = re.compile(
    r"^(?:Merge|merge:) page/(?P<page>\S+) into module/(?P<module>\S+)", re.IGNORECASE
)
MERGE_MODULE_TO_DEV = re.compile(
    r"^(?:Merge|merge:) module/(?P<module>\S+) into dev", re.IGNORECASE
)

#: Subjects on the PRV phase/roadmap ladder (R5). These live under
#: applications/backend/ but their scope is `provider` by locked rule -
#: path classification must not downgrade them to `backend`.
PROVIDER_LADDER = re.compile(
    r"^(?:feat|fix|docs|enrich)\(provider\)\s*:?", re.IGNORECASE
)

COMMIT_COLS = [
    "sha_full",
    "sha_short",
    "date",
    "status",
    "surfaces",
    "old_scope",
    "new_type",
    "new_scope",
    "new_subject",
    "old_subject",
    "note",
]


def git(*args: str) -> str:
    proc = subprocess.run(
        ["git", *args],
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
        cwd=_ROOT,
    )
    if proc.returncode != 0:
        raise SystemExit(f"git {' '.join(args)} failed: {proc.stderr.strip()}")
    return proc.stdout


def classify_files(files: list[str]) -> tuple[set[str], list[str]]:
    surfaces: set[str] = set()
    unmatched: list[str] = []
    for raw in files:
        path = raw.replace("\\", "/")
        if not path or path.startswith(R.EXCLUDED_PREFIXES):
            continue
        for prefix, surface, _note in R.PATH_RULES:
            if path == prefix.rstrip("/") or path.startswith(prefix):
                surfaces.add(surface)
                break
        else:
            unmatched.append(path)
    return surfaces, unmatched


def infer_type(old_subject: str, old_type: str | None) -> str:
    if old_type:
        return old_type
    lowered = old_subject.lower()
    for hint, hint_type in R.TYPE_HINTS:
        if lowered.startswith(hint):
            return hint_type
    return "chore"


def rewrite_subject(old_subject: str, new_type: str, new_scope: str) -> str:
    match = SUBJECT_RE.match(old_subject)
    if match:
        desc = (match.group("rest") or "").lstrip(":, ").strip()
        if not desc and match.group("scope"):
            desc = ""
    else:
        desc = old_subject.strip()
        desc = desc[:1].lower() + desc[1:] if desc else desc
    return f"{new_type}({new_scope}): {desc}" if desc else f"{new_type}({new_scope})"


def parse_commits(rev: str, *, merges: bool) -> list[dict]:
    flag = ["--merges"] if merges else ["--no-merges"]
    raw = git("log", *flag, "--date=short", "--format=@@%H|%h|%ad|%s", rev)
    commits: list[dict] = []
    for line in raw.splitlines():
        if not line.startswith("@@"):
            continue
        sha, short, date, subject = line[2:].rstrip("\r").split("|", 3)
        commits.append({"sha": sha, "short": short, "date": date, "subject": subject})
    return commits


def files_for(sha: str) -> list[str]:
    raw = git("show", "--name-only", "--format=", sha)
    return [ln.strip() for ln in raw.splitlines() if ln.strip()]


def build_commit_rows(rev: str) -> list[dict]:
    rows: list[dict] = []
    for commit in parse_commits(rev, merges=False):
        sha, subject = commit["sha"], commit["subject"]
        surfaces, unmatched = classify_files(files_for(sha))
        old = SUBJECT_RE.match(subject)
        old_scope = old.group("scope") if old and old.group("scope") else ""
        old_type = old.group("type") if old else None

        override = R.OVERRIDES.get(sha, {})
        action = override.get("action", "")
        note = override.get("note", "")

        if action == "needs_split":
            status, new_scope = "needs_split", ""
        elif action == "needs_review":
            status, new_scope = "needs_review", ""
        elif action == "single":
            status, new_scope = "overridden", override["scope"]
        elif PROVIDER_LADDER.match(subject) and surfaces == {"backend"}:
            # R5: the PRV phase/roadmap ladder keeps scope `provider` even
            # though it lives under applications/backend/.
            status, new_scope = "ok", "provider"
            note = (note + "; " if note else "") + "R5: PRV phase/roadmap ladder keeps provider scope"
            surfaces = {"provider"}
        elif len(surfaces) == 1:
            status, new_scope = "ok", next(iter(surfaces))

        elif len(surfaces) > 1:
            status, new_scope = "needs_split", ""
        else:
            status, new_scope = "needs_review", ""
            if unmatched and not note:
                note = "unmatched paths: " + ", ".join(sorted(set(unmatched))[:3])

        new_type = override.get("type") or infer_type(subject, old_type)
        if not note and old_scope in R.LEGACY_SCOPES:
            note = "legacy scope"
        new_subject = rewrite_subject(subject, new_type, new_scope) if new_scope else ""
        rows.append(
            {
                "sha_full": sha,
                "sha_short": commit["short"],
                "date": commit["date"],
                "status": status,
                "surfaces": ",".join(sorted(surfaces)),
                "old_scope": old_scope,
                "new_type": new_type,
                "new_scope": new_scope,
                "new_subject": new_subject,
                "old_subject": subject,
                "note": note,
            }
        )
    return rows


def build_merge_rows(rev: str) -> list[dict]:
    rows: list[dict] = []
    for commit in parse_commits(rev, merges=True):
        subject = commit["subject"]
        page = MERGE_PAGE_TO_MODULE.match(subject)
        mod = MERGE_MODULE_TO_DEV.match(subject)
        if page:
            kind, branch, module = "page->module", page.group("page"), page.group("module")
            proposed = "Merge page/<<new-page>> into module/<<new-module>> (<<scope>>: <<feature>>)"
        elif mod:
            kind, branch, module = "module->dev", mod.group("module"), mod.group("module")
            proposed = "Merge module/<<new-module>> into dev (<<scope>>: <<feature>>)"
        else:
            kind, branch, module, proposed = "other", "", "", ""
        rows.append(
            {
                "sha_full": commit["sha"],
                "sha_short": commit["short"],
                "date": commit["date"],
                "kind": kind,
                "branch_ref": branch,
                "module_ref": module,
                "old_subject": subject,
                "proposed_subject": proposed,
            }
        )
    return rows


def write_tsv(path: str, rows: list[dict], cols: list[str]) -> None:
    directory = os.path.dirname(path)
    if directory:
        os.makedirs(directory, exist_ok=True)
    with open(path, "w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=cols, delimiter="\t", extrasaction="ignore")
        writer.writeheader()
        writer.writerows(rows)

def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--rev", default="dev")
    parser.add_argument("--out", default=os.path.join(_ROOT, "rebuild"))
    args = parser.parse_args()

    commit_rows = build_commit_rows(args.rev)
    merge_rows = build_merge_rows(args.rev)

    commit_tsv = os.path.join(args.out, "commit-map.tsv")
    merge_tsv = os.path.join(args.out, "merge-map.tsv")
    write_tsv(commit_tsv, commit_rows, COMMIT_COLS)
    write_tsv(
        merge_tsv,
        merge_rows,
        [
            "sha_full",
            "sha_short",
            "date",
            "kind",
            "branch_ref",
            "module_ref",
            "old_subject",
            "proposed_subject",
        ],
    )

    by_status = Counter(r["status"] for r in commit_rows)
    by_surface = Counter(r["new_scope"] for r in commit_rows if r["new_scope"])
    by_kind = Counter(r["kind"] for r in merge_rows)
    legacy = [r for r in commit_rows if r["old_scope"] in R.LEGACY_SCOPES]
    pending = [r for r in commit_rows if r["status"] in {"needs_split", "needs_review"}]

    lines = [
        "# Reconstruction Matrix Summary",
        "",
        f"Source revision: `{args.rev}`",
        f"Non-merge commits: **{len(commit_rows)}** | Merges: **{len(merge_rows)}**",
        "",
        "## Commit status",
        "",
        "| status | count |",
        "| --- | --- |",
    ]
    lines += [f"| {k} | {v} |" for k, v in by_status.most_common()]
    lines += ["", "## Resulting surface (new_scope)", "", "| scope | count |", "| --- | --- |"]
    lines += [f"| {k} | {v} |" for k, v in by_surface.most_common()]
    lines += ["", "## Merge kinds", "", "| kind | count |", "| --- | --- |"]
    lines += [f"| {k} | {v} |" for k, v in by_kind.most_common()]
    lines += ["", "## Legacy scopes still present", "", f"Count: **{len(legacy)}**", ""]
    lines += [f"- `{r['sha_short']}` `{r['old_subject']}`" for r in legacy[:40]]
    lines += ["", f"## Needs ruling ({len(pending)})", ""]
    lines += [
        f"- `{r['sha_short']}` [{r['status']}] `{r['old_subject']}`"
        f" -> surfaces: {r['surfaces'] or '(none)'} ({r['note']})"
        for r in pending
    ]
    summary_path = os.path.join(args.out, "commit-map.summary.md")
    with open(summary_path, "w", encoding="utf-8") as handle:
        handle.write("\n".join(lines) + "\n")

    print(f"wrote {commit_tsv} ({len(commit_rows)} rows)")
    print(f"wrote {merge_tsv} ({len(merge_rows)} rows)")
    print(f"wrote {summary_path}")
    print(f"status: {dict(by_status)}")
    print(f"needs ruling: {len(pending)}")
    print(f"legacy scopes: {len(legacy)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
