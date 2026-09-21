#!/usr/bin/env python3
"""Build the reconstruction unit manifest from commit-map.tsv."""
from __future__ import annotations
import csv, os, re, sys
_HERE = os.path.dirname(os.path.abspath(__file__))
_ROOT = os.path.abspath(os.path.join(_HERE, "..", ".."))
sys.path.insert(0, os.path.join(_ROOT, "rebuild"))
import scope_rules as R
GENERIC_WORDS = {"web", "mobile", "frontend", "user", "backend",
                 "provider", "repo", "cicd", "web-user", "web-provider",
                 "provider-app", "i18n", "integrations",
                 "chore", "initial", "commit", "fixo", "app", "monorepo",
                 "base", "history", "backup", "scaffold", "files",
                 "swept", "accidentally", "untracked"}
GENERIC_TOKENS = GENERIC_WORDS | {"auth", "real", "add"}
KEYWORD_FEATURES = (
    ("booking-wizard", "booking wizard"),
    ("booking-flow", "booking flow|booking creation|cancel-booking|cancel booking"),
    ("booking", "booking|bookings|e-receipt"),
    ("services", "services|service catalog|service/provider"),
    ("providers", "provider selection|provider profile|provider discovery"),
    ("payments", "payments|charge detail"),
    ("invoices", "invoices|invoice"),
    ("wallet", "wallet|payout"),
    ("history", "cross-platform history feed|history feed"),
    ("loyalty", "loyalty"),
    ("promotions", "promotions"),
    ("notifications", "notifications"),
    ("messages", "message|chat detail|chat|call screen"),
    ("reviews", "review|rating|feedback"),
    ("profile", "profile|settings tab|updateprofile"),
    ("support", "support|helpdesk|help page|ticket"),
    ("dashboard", "dashboard"),
    ("calendar", "calendar|availability"),
    ("activity", "activity"),
    ("timeline", "timeline|step checklist|tick color"),
    ("financial", "financial|ledger|billing"),
    ("rewards", "rewards"),
    ("tools", "tools"),
    ("layout", "layout|full width|detail column|stat card"),
    ("shell", "shell"),
    ("search", "search"),
    ("bookmarks", "bookmark|favorites|favourite"),
    ("customer", "customer"),
    ("onboarding", "onboarding|registration|register|verify-otp|otp"),
    ("i18n", "translate|translation|locale|language"),
    ("migration", "migrate"),
    ("security", "password|hash|secret|leak|idor|audit|runtime failure"),
    ("tables", "bookings-style tables"),
    ("empty-state", "empty state|staggered card"),
    ("reference-rebuild", "rebuild|match reference|reference image|reference layout|reference design|reference exactly|reference|dialog/panel|redesign"),
    ("design-system", "design-system|design system|primitive|premium polish|premium-design|hand-rolled|stat-card|stat card|tabs|checkbox|switch|dialog|tier card|redeem dialog|activity drawer"),
    ("auth-wiring", "registration form|updateprofile|forgot/reset-password|forgot-password|wire .* real|wired to the real|backend wiring|end-to-end backend wiring|token|login bug|protected screens|refreshed token"),
)
# Phase-NN commits on the PRV ladder always group by phase number
# (R5); each phase is one unit regardless of description wording.
BARE_PHASE_RE = re.compile(r"phase[\s\-]*(\d+)\b", re.IGNORECASE)
SUBJECT_TOKEN = re.compile(r"^[a-z]+\(([^)]+)\)\s*[:,]?\s*(.*)$")
PHASE_RE = re.compile(r"phase\s+(\d+)\s*[-:.]\s*(.+)", re.IGNORECASE)
PROV_PHASE_RE = re.compile(
    r"^(?:feat|docs|fix|enrich)\(provider\)\s*:\s*(?:phase\s+(\d+)|(.+))",
    re.IGNORECASE,
)
ROADMAP_RE = re.compile(
    r"^(?:docs|feat)\(provider\)\s*:\s*(?:mark|roadmap)\b(.*)$", re.IGNORECASE)

def slug(t: str, lim: int = 48) -> str:
    t = re.sub(r"[^a-z0-9]+", "-", t.lower()).strip("-")
    parts = [p for p in t.split("-") if p not in GENERIC_WORDS]
    t = "-".join(parts) or t
    return t[:lim].rstrip("-") or "misc"


def feature_for(sub: str) -> str:
    s = sub.strip()
    if "initial commit" in s.lower():
        return "foundation"
    pm = PROV_PHASE_RE.match(s)
    if pm:
        if pm.group(1):
            return f"phase{pm.group(1)}"
        rest = (pm.group(2) or "").strip()
        rm = ROADMAP_RE.match(s)
        if rm:
            return slug(f"roadmap-{rm.group(1)}", 40)
        bp = BARE_PHASE_RE.search(rest)
        if bp:
            return f"phase{bp.group(1)}"
        ph = PHASE_RE.search(rest)
        if ph:
            return slug(ph.group(2).split("(")[0].split(",")[0], 40)
        return slug(rest, 40) if rest else "misc"
    if "initial commit" in s.lower() and "monorepo" in s.lower():
        return "foundation"
    m = SUBJECT_TOKEN.match(s)
    desc = m.group(2).strip() if m else s
    tok = m.group(1).strip().lower() if m else ""
    ph = PHASE_RE.match(desc)
    if ph:
        return slug(ph.group(2).split("(")[0].split(",")[0], 40)
    bp = BARE_PHASE_RE.search(desc)
    if bp:
        return f"phase{bp.group(1)}"
    lowered = desc.lower()
    for feat, pattern in KEYWORD_FEATURES:
        if re.search(pattern, lowered):
            return feat
    if tok and tok not in GENERIC_TOKENS:
        return slug(tok, 40)
    return slug(desc, 40)


def module_for(scope: str, feat: str) -> str:
    if scope in R.APP_SURFACES:
        return f"module/{scope}-{feat}"
    if scope == "provider":
        return f"module/provider-{feat}"
    if scope == "backend":
        return f"module/{feat}-backend"
    return f"module/{scope}-{feat}"


def load_rows() -> list[dict]:
    p = os.path.join(_ROOT, "rebuild", "commit-map.tsv")
    with open(p, encoding="utf-8") as h:
        rows = list(csv.DictReader(h, delimiter="\t"))
    rows.reverse()
    return rows

def build_units(rows: list[dict]) -> list[dict]:
    order: dict = {}
    seq: list = []
    for r in rows:
        old = r["old_subject"]
        if r["status"] == "needs_split":
            surfs = [s for s in r["surfaces"].split(",") if s]
            feat = feature_for(old)
            for sf in surfs:
                key = (sf, feat)
                if key not in order:
                    order[key] = {"id": f"{sf}-{feat}", "surface": sf,
                                  "scope": sf, "feature": feat, "sources": []}
                    seq.append(key)
                order[key]["sources"].append(
                    {"sha": r["sha_full"], "short": r["sha_short"],
                     "split": sf})
        elif r["status"] == "needs_review":
            feat = feature_for(old)
            key = ("shared", feat)
            if key not in order:
                order[key] = {"id": f"shared-{feat}", "surface": "shared",
                              "scope": "shared", "feature": feat,
                              "sources": []}
                seq.append(key)
            order[key]["sources"].append(
                {"sha": r["sha_full"], "short": r["sha_short"], "split": None})
        else:
            scope = r["new_scope"] or "misc"
            feat = feature_for(old)
            if scope == "provider":
                pm = PROV_PHASE_RE.match(old.strip())
                phase = pm.group(1) if (pm and pm.group(1)) else None
                if phase is None:
                    bp = BARE_PHASE_RE.search(old)
                    phase = bp.group(1) if bp else None
                if phase:
                    key = (scope, f"phase{phase}")
                    if key not in order:
                        order[key] = {
                            "id": f"{scope}-phase{phase}",
                            "surface": "backend", "scope": scope,
                            "feature": f"phase{phase}", "sources": []}
                        seq.append(key)
                    order[key]["sources"].append(
                        {"sha": r["sha_full"], "short": r["sha_short"],
                         "split": None})
                    continue
                key = (scope, feat)
                if key not in order:
                    order[key] = {"id": f"{scope}-{feat}", "surface": scope,
                                  "scope": scope, "feature": feat,
                                  "sources": []}
                    seq.append(key)
                order[key]["sources"].append(
                    {"sha": r["sha_full"], "short": r["sha_short"],
                     "split": None})
            else:
                key = (scope, feat)
                if key not in order:
                    order[key] = {"id": f"{scope}-{feat}", "surface": scope,
                                  "scope": scope, "feature": feat,
                                  "sources": []}
                    seq.append(key)
                order[key]["sources"].append(
                    {"sha": r["sha_full"], "short": r["sha_short"],
                     "split": None})
    units = []
    for pos, key in enumerate(seq, start=1):
        u = order[key]
        module = module_for(u["scope"], u["feature"])
        tag = f"provider-{u['feature']}-v1" if u["scope"] == "provider" \
            else f"{u['id']}-v1"
        units.append({"position": pos, "id": u["id"],
                      "surface": u["surface"], "scope": u["scope"],
                      "feature": u["feature"],
                      "page_branch": f"page/{u['id']}",
                      "module_branch": module, "tag": tag,
                      "dev_merge": f"Merge {module} into dev "
                                   f"({u['scope']}: {u['feature']})",
                      "sources": u["sources"]})
    return units

def dump_yaml(units: list[dict]) -> str:
    out = ["# Unit manifest - generated, review before replay.", ""]
    for u in units:
        out.append(f"- position: {u['position']}")
        out.append(f"  id: {u['id']}")
        out.append(f"  surface: {u['surface']}")
        out.append(f"  scope: {u['scope']}")
        out.append(f"  feature: {u['feature']}")
        out.append(f"  page_branch: {u['page_branch']}")
        out.append(f"  module_branch: {u['module_branch']}")
        out.append(f"  tag: {u['tag']}")
        out.append(f"  dev_merge: {u['dev_merge']}")
        out.append("  sources:")
        for s in u["sources"]:
            out.append(f"    - sha: {s['sha']}")
            out.append(f"      short: {s['short']}")
            out.append(f"      split: {s['split'] or ''}")
    return "\n".join(out) + "\n"


def main() -> int:
    units = build_units(load_rows())
    dest = os.path.join(_ROOT, "rebuild", "unit-manifest.yaml")
    with open(dest, "w", encoding="utf-8") as h:
        h.write(dump_yaml(units))
    sp = sum(1 for u in units for s in u["sources"] if s["split"])
    print(f"wrote {dest} ({len(units)} units, {sp} split parts)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())



