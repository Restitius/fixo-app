"""Write Phase 13 SQL adapters implementing the on-disk ports.
Run: python scripts/p13_adapters.py"""
import ast
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def psrc(rel):
    return (ROOT / rel).read_text(encoding="utf-8", errors="replace")


def port_methods(rel):
    tree = ast.parse(psrc(rel))
    out = []
    for n in ast.walk(tree):
        if isinstance(n, ast.ClassDef):
            for m in n.body:
                if isinstance(m, (ast.FunctionDef, ast.AsyncFunctionDef)) and not m.name.startswith("_"):
                    args = [a.arg for a in m.args.args if a.arg != "self"]
                    out.append((m.name, args))
    return out


def sql_params(f):
    t = f.read_text(encoding="utf-8")
    return set(re.findall(r":([a-z_][a-z0-9_]*)", t))


def choose_sql(name, files, used):
    toks = [t for t in name.lower().split("_") if t]
    best, score = None, -1
    for stem in sorted(files):
        if stem in used:
            continue
        s = 0
        if stem == name.lower():
            s = 4
        elif stem in toks:
            s = 3
        elif len(toks) > 1 and all(t in stem or stem == t for t in toks):
            s = 2
        elif any(t == stem for t in toks):
            s = 1
        if s > score:
            best, score = stem, s
    return best


qmsrc = psrc("app/platform/query/sql_query_manager.py")
names = set(re.findall(r"async def (\w+)", qmsrc))
FETCH_ALL = next((n for n in names if "all" in n), None)
FETCH_ONE = next((n for n in names if "one" in n or "first" in n), None)
EXEC = next((n for n in names if n.startswith("execute")), None)
assert FETCH_ALL and FETCH_ONE and EXEC, f"QM methods found: {sorted(names)}"

ADAPTERS = [
    ("app/ports/persistence/cancellation_repository.py",
     "app/adapters/persistence/cancellation_sql_adapter.py",
     "CancellationSqlAdapter", "cancellations", "CUS.CANCEL"),
    ("app/ports/persistence/support_repository.py",
     "app/adapters/persistence/support_sql_adapter.py",
     "SupportSqlAdapter", "support", "CUS.SUPPORT"),
    ("app/ports/persistence/dispute_repository.py",
     "app/adapters/persistence/dispute_sql_adapter.py",
     "DisputeSqlAdapter", "disputes", "CUS.DISPUTE"),
]

for port_rel, out_rel, cls, qdir, prefix in ADAPTERS:
    files = {f.stem.lower(): f for f in sorted((ROOT / f"app/queries/customers/{qdir}").glob("*.sql"))}
    used = set()
    methods, notes = [], []
    for name, args in port_methods(port_rel):
        stem = choose_sql(name, files, used)
        if stem is None:
            notes.append(f"# port method {name}: no SQL file matched")
            continue
        used.add(stem)
        f = files[stem]
        sp = sql_params(f)
        qid = f"{prefix}.{stem.upper()}"
        passing = [a for a in args if a in sp]
        missing = sorted(sp - set(args))
        if missing:
            notes.append(f"# {name}: SQL also needs {missing}")
        t = f.read_text(encoding="utf-8")
        if name.startswith(("list", "fetch", "all")):
            call = FETCH_ALL
        elif name.startswith(("get", "find")):
            call = FETCH_ONE
        elif "RETURNING" in t and name.startswith(("create", "add", "open")):
            call = FETCH_ONE
        else:
            call = EXEC
        sig = ", ".join(["self"] + args)
        body = "{" + ", ".join(f'"{a}": {a}' for a in passing) + "}"
        methods.append(
            f"    async def {name}({sig}):\n"
            f'        return await self._qm.{call}("{qid}", {body})\n'
        )
    code = (
        f'"""{cls} - the only place {qdir} query IDs appear."""\n\n'
        f"from app.platform.query.sql_query_manager import SQLQueryManager\n\n\n"
        f"class {cls}:\n"
        f"    def __init__(self, query_manager: SQLQueryManager):\n"
        f"        self._qm = query_manager\n\n"
        + "\n".join(methods)
        + ("\n" + "\n".join(notes) + "\n" if notes else "")
    )
    out = ROOT / out_rel
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(code + "\n", encoding="utf-8")
    print("WROTE", out_rel, f"methods={len(methods)} sql_used={sorted(used)}")
    for n in notes:
        print("   ", n)
