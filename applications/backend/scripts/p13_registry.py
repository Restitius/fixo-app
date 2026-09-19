"""Append Phase 13 registry entries mechanically from the SQL files.
Run: python scripts/p13_registry.py"""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
REG = ROOT / "app/queries/registry.yaml"
DOM = {"cancellations": "CANCEL", "support": "SUPPORT", "disputes": "DISPUTE"}


def operation(t):
    if re.search(r"\b(SP_[A-Z_]+\s*\(|CALL\s)", t):
        return "execute"
    if re.search(r"\b(INSERT|UPDATE|DELETE)\b", t, re.I):
        return "update"
    return "read"


reg = REG.read_text(encoding="utf-8")
sample = re.search(r"(  CUS\.MAINTENANCE\.CREATE_PLAN:\n(?:[ ]{4}.*\n?)+)", reg)
added = []

for d, pre in DOM.items():
    base = ROOT / f"app/queries/customers/{d}"
    if not base.exists():
        continue
    for f in sorted(base.glob("*.sql")):
        qid = f"CUS.{pre}.{f.stem.upper()}"
        if re.search(rf"^  {re.escape(qid)}:", reg, re.M):
            continue
        t = f.read_text(encoding="utf-8")
        rel = f"customers/{d}/{f.name}"
        if sample:
            body = []
            for ln in sample.group(1).splitlines()[1:]:
                k = ln.split(":")[0].strip()
                indent = ln[: len(ln) - len(ln.lstrip())]
                if k == "sql":
                    body.append(f"{indent}sql: {rel}")
                elif k == "operation":
                    body.append(f"{indent}operation: {operation(t)}")
                else:
                    body.append(ln)
            block = f"  {qid}:\n" + "\n".join(body) + "\n"
        else:
            block = f"  {qid}:\n    sql: {rel}\n    operation: {operation(t)}\n"
        reg = reg.rstrip("\n") + "\n" + block
        added.append(qid)

REG.write_text(reg, encoding="utf-8")
total = len(re.findall(r"^  [A-Z][A-Z0-9.]*:", reg, re.M))
print("ADDED:", added)
print("TOTAL:", total)
try:
    import yaml  # type: ignore

    yaml.safe_load(reg)
    print("YAML OK")
except ImportError:
    print("YAML CHECK SKIPPED (no pyyaml)")
except Exception as e:
    print("YAML FAIL:", e)
