"""Generate Phase 13 registry entries mechanically from SQL files.

Reads every ``*.sql`` under the cancellations / support / disputes query
folders, extracts ``:param`` placeholders, classifies the operation
(query vs update) and appends the resulting entries to registry.yaml
under a marker so the run stays idempotent.
"""

from __future__ import annotations

import json
import re
from pathlib import Path

BACKEND = Path(__file__).resolve().parents[1]
REGISTRY = BACKEND / "app" / "queries" / "registry.yaml"
MAP_OUT = BACKEND / "storage" / "temporary" / "p13_ids.json"
MARKER = "# === PHASE13-AUTO ==="

# folder -> (query-id prefix)
GROUPS = {
    "cancellations": "CUS.CANCEL",
    "support": "CUS.SUPPORT",
    "disputes": "CUS.DISPUTE",
}

# stem -> friendly ID segment override (filled after first inspection)
STEM_OVERRIDES: dict[str, str] = {}

PARAM_RE = re.compile(r"(?<![:@]):([a-zA-Z_][a-zA-Z0-9_]*)")


def strip_comments(sql: str) -> str:
    out = []
    for line in sql.splitlines():
        cut = line.find("--")
        out.append(line if cut < 0 else line[:cut])
    return "\n".join(out)


def classify(body: str) -> str:
    head = strip_comments(body).lstrip().upper()
    if "SP_" in head or head.startswith(("INSERT", "UPDATE", "DELETE")):
        return "update"
    return "query"


def entry(qid: str, rel: str, op: str, params: list[str]) -> str:
    lines = [f"  {qid}:", f"    sql: {rel}", f"    operation: {op}"]
    if params:
        lines.append("    parameters:")
        lines += [f"      - {p}" for p in params]
    return "\n".join(lines)


def main() -> None:
    text = REGISTRY.read_text(encoding="utf-8-sig")
    if MARKER in text:
        print("ALREADY-DONE")
        return

    built: dict[str, dict] = {}
    blocks: list[str] = [MARKER]

    for folder, prefix in sorted(GROUPS.items()):
        d = BACKEND / "app" / "queries" / "customers" / folder
        for f in sorted(d.glob("*.sql")):
            raw = f.read_text(encoding="utf-8-sig")
            stem_seg = STEM_OVERRIDES.get(f.stem, f.stem.upper().replace("_", "."))
            qid = f"{prefix}.{stem_seg}"
            if qid in built:
                raise SystemExit(f"duplicate id {qid}")
            rel = f"customers/{folder}/{f.name}"
            op = classify(raw)
            params = sorted(set(PARAM_RE.findall(raw)))
            built[qid] = {"op": op, "rel": rel}
            blocks.append(entry(qid, rel, op, params))

    REGISTRY.write_text(text.rstrip("\n") + "\n\n" + "\n\n".join(blocks) + "\n", encoding="utf-8")
    MAP_OUT.write_text(json.dumps(built, indent=2), encoding="utf-8")

    counts: dict[str, int] = {}
    for qid, meta in built.items():
        pref = qid.rsplit(".", 1)[0] if meta["rel"].split("/")[-2] not in ("cancellations", "support", "disputes") else qid.split(".")[1]
        counts[pref] = counts.get(pref, 0) + 1
    print(f"WROTE {len(built)} ENTRIES -> {counts}")


if __name__ == "__main__":
    main()
