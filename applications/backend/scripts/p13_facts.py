"""Phase 13 fact dump: prints (and tees) everything wiring needs.
Run: python scripts/p13_facts.py"""
import ast
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "storage/logs/p13_facts.txt"
OUT.parent.mkdir(parents=True, exist_ok=True)
buf = []


def p(*a):
    buf.append(" ".join(str(x) for x in a))


def src(rel):
    return (ROOT / rel).read_text(encoding="utf-8", errors="replace")


def defs(rel):
    return sorted(set(re.findall(r"^\s*(?:async )?def (\w+)", src(rel), re.M)))


def ast_classes(rel):
    try:
        tree = ast.parse(src(rel))
    except SyntaxError as e:
        return f"SYNTAX ERROR {e}"
    out = []
    for n in ast.walk(tree):
        if isinstance(n, ast.ClassDef):
            ms = [m.name for m in n.body if isinstance(m, (ast.FunctionDef, ast.AsyncFunctionDef))]
            args = {}
            for m in n.body:
                if isinstance(m, (ast.FunctionDef, ast.AsyncFunctionDef)):
                    args[m.name] = [a.arg for a in m.args.args if a.arg != "self"]
            out.append(f"{n.name} methods={list(args.items())}")
    return out


p("== QM methods ==", defs("app/platform/query/sql_query_manager.py"))
p("== WORKFLOW defs ==", defs("app/platform/workflow/workflow_manager.py"))
p("== WF literals ==", sorted(set(re.findall(r"WF\.[A-Z_.]+V?\d*", src("app/platform/workflow/workflow_manager.py")))))
p("== IDENTIFIERS ==", defs("app/shared/helpers/identifiers.py"))
p("== AUTH DEPS ==", defs("app/api/deps/auth.py"))

for rel in [
    "app/ports/persistence/cancellation_repository.py",
    "app/ports/persistence/support_repository.py",
    "app/ports/persistence/dispute_repository.py",
    "app/domains/cancellations/services/cancellation_policy_engine.py",
    "app/domains/cancellations/services/refund_policy_engine.py",
    "app/shared/protection_errors.py",
]:
    p(f"== {rel} ==", ast_classes(rel))

p("== SQL FILES ==")
for d in ["cancellations", "support", "disputes"]:
    base = ROOT / f"app/queries/customers/{d}"
    if not base.exists():
        p(f"{d}: MISSING DIR")
        continue
    for f in sorted(base.glob("*.sql")):
        t = f.read_text(encoding="utf-8", errors="replace")
        params = sorted(set(re.findall(r":([a-z_][a-z0-9_]*)", t)))
        ops = sorted(set(re.findall(r"\b(SELECT|INSERT|UPDATE|DELETE|CALL|SP_[A-Z_]+)\b", t)))
        p(f"{d}/{f.name} params={params} ops={ops}")

reg = src("app/queries/registry.yaml")
m = re.search(r"(  CUS\.MAINTENANCE\.CREATE_PLAN:\n(?:[ ]{4}.*\n?)+)", reg)
p("== REGISTRY sample ==")
p(m.group(1).rstrip() if m else "SAMPLE NOT FOUND")
p("== REGISTRY count ==", len(re.findall(r"^  [A-Z][A-Z0-9.]*:", reg, re.M)))
p("== P13 ids present ==", re.findall(r"^  (CUS\.(?:CANCEL|SUPPORT|DISPUTE)[A-Z0-9_.]*):", reg, re.M))

p("== V1 router includes ==")
for ln in src("app/api/v1/router.py").splitlines():
    if "include_router" in ln or ln.startswith("from"):
        p(ln.strip())

comp = src("app/startup/composition.py")
p("== COMPOSITION maintenance anchors ==")
for i, ln in enumerate(comp.splitlines(), 1):
    if "maintenance" in ln.lower():
        p(i, ln.rstrip())

try:
    mig = src("migrations/versions/0015_phase13_protection.py")
    p("== 0015 revision ==", re.findall(r"revision(?::\s*str)?\s*=\s*['\"]([^'\"]+)", mig))
    p("== 0015 down ==", re.findall(r"down_revision[^\n]+", mig)[:1])
except FileNotFoundError:
    p("== 0015 MISSING ==")

OUT.write_text("\n".join(buf) + "\n", encoding="utf-8")
print("\n".join(buf))
print("FACTS ->", OUT)
