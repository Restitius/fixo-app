"""Generate Phase 13 services, routers, bridges and __init__ files.
Run: python scripts/p13_api.py"""
import ast
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def psrc(rel):
    return (ROOT / rel).read_text(encoding="utf-8", errors="replace")


def first_class(rel):
    tree = ast.parse(psrc(rel))
    for n in ast.walk(tree):
        if isinstance(n, ast.ClassDef):
            return n.name
    return None


def methods_of(rel):
    tree = ast.parse(psrc(rel))
    out = []
    for n in ast.walk(tree):
        if isinstance(n, ast.ClassDef):
            for m in n.body:
                if isinstance(m, (ast.FunctionDef, ast.AsyncFunctionDef)) and not m.name.startswith("_"):
                    args = [a.arg for a in m.args.args if a.arg != "self"]
                    out.append((m.name, args))
    return out


auth_defs = re.findall(r"^async def (get_[a-z_]+)|^def (get_[a-z_]+)", psrc("app/api/deps/auth.py"), re.M)
CUST = next((a or b for a, b in auth_defs if "customer" in (a or b)), "get_current_customer")

mrt = psrc("app/domains/maintenance/api/router.py")
RESP = next(iter(re.findall(r"return (\w+)\(", mrt)), None)
imports = [ln for ln in re.findall(r"^(?:from|import) .*$", mrt, re.M) if "maintenance" not in ln]
ERRS = [c for c in (first_class("app/shared/protection_errors.py") or "").split()] or ["ValueError"]
ERR = ERRS[0]

DOMAINS = [
    dict(key="cancellations", mod="cancellations", cap="Cancellations", title="cancellations",
         port="app/ports/persistence/cancellation_repository.py",
         eng=[("CancellationPolicyEngine", "app/domains/cancellations/services/cancellation_policy_engine.py"),
              ("RefundPolicyEngine", "app/domains/cancellations/services/refund_policy_engine.py")]),
    dict(key="support", mod="support", cap="Support", title="support",
         port="app/ports/persistence/support_repository.py", eng=[]),
    dict(key="disputes", mod="disputes", cap="Disputes", title="disputes",
         port="app/ports/persistence/dispute_repository.py", eng=[]),
]

for d in DOMAINS:
    port_cls = first_class(d["port"])
    port_methods = methods_of(d["port"])
    svc_cls = f"{d['cap']}Service"

    ctor = ["        self._repo = repo"]
    ctor_args = ["self", "repo"]
    init_imports = [f"from app.ports.persistence.{d['mod']}_repository import {port_cls}"]
    ann = [f"        repo: {port_cls},"]
    for cls_name, eng_rel in d["eng"]:
        mod = Path(eng_rel).stem
        init_imports.append(f"from app.domains.{d['mod']}.services.{mod} import {cls_name}")
        ctor_args.append(cls_name.lower())
        ann.append(f"        {cls_name.lower()}: {cls_name} | None = None,")
        ctor.append(f"        self._{cls_name.lower()} = {cls_name.lower()}")

    fwd = []
    for name, args in port_methods:
        call_args = ", ".join(a for a in args if a != "customer_id")
        prefix = "customer_id=customer_id, " if "customer_id" in args else ""
        fwd.append(
            f"    async def {name}(self, customer_id: str, {', '.join(a for a in args if a != 'customer_id') or '**_'}):\n"
            f"        return await self._repo.{name}({prefix}{call_args})\n"
        )
    svc = (
        f'"""{svc_cls} - business rules for {d["title"]} (ports only)."""\n\n'
        + "\n".join(sorted(set(init_imports)))
        + f"from app.shared.protection_errors import {ERR}\n\n\n"
        + f"class {svc_cls}:\n"
        + "    def __init__(\n"
        + "\n".join(ann)
        + "    ):\n"
        + "\n".join(ctor)
        + "\n\n" + "\n".join(fwd)
    )
    svc_dir = ROOT / f"app/domains/{d['mod']}/services"
    svc_dir.mkdir(parents=True, exist_ok=True)
    (svc_dir / f"{d['mod']}_service.py").write_text(svc, encoding="utf-8")

    ep = []
    for name, args in port_methods:
        biz = [a for a in args if a != "customer_id"]
        verb = "GET" if name.startswith(("list", "get")) else "POST"
        q = ", ".join(f"{a}: str = ''" for a in biz) if verb == "GET" else ""
        if verb == "GET":
            pass_args = ", ".join(f"{a}={a}" for a in biz) if biz else ""
        else:
            pass_args = ", ".join(f"{a}=payload.get('{a}')" for a in biz) if biz else ""
        sig_extra = f", {q}" if q else ""
        if verb == "POST":
            sig_extra = ", payload: dict = {}"
        ret = f"await svc.{name}(customer_id, {pass_args})" if pass_args else f"await svc.{name}(customer_id)"
        ep.append(
            f'\n\n@router.{verb.lower()}("/{name.replace("_", "/")}")\n'
            f"async def {name}({q.lstrip(', ') + ', ' if q else ''}cust: dict = Depends({CUST}){sig_extra}):\n"
            f'    return {RESP}(await svc.{name}(cust["customer_id"], '
            + (pass_args if pass_args else "") + "))"
        )
    ep_src = "\n".join(ep)
    router = (
        "\n".join(sorted(set(imports))) + "\n"
        + f"from app.domains.{d['mod']}.services.{d['mod']}_service import {svc_cls}\n"
        + "from app.startup.composition import compose\n\n"
        + f'router = APIRouter(prefix="/{d["key"]}", tags=["{d["title"]}"])\n'
        + f"svc = compose.{d['mod']}_service()\n"
        + ep_src + "\n"
    )
    api_dir = ROOT / f"app/domains/{d['mod']}/api"
    api_dir.mkdir(parents=True, exist_ok=True)
    (api_dir / "router.py").write_text(router, encoding="utf-8")

    bridge_tpl = psrc("app/api/v1/maintenance.py")
    bridge = bridge_tpl.replace("maintenance", d["mod"]).replace("Maintenance", d["cap"])
    (ROOT / f"app/api/v1/{d['mod']}.py").write_text(bridge, encoding="utf-8")

    for pkg in [f"app/domains/{d['mod']}", f"app/domains/{d['mod']}/services", f"app/domains/{d['mod']}/api"]:
        p = ROOT / pkg / "__init__.py"
        if not p.exists():
            p.write_text("", encoding="utf-8")
    print(f"WROTE {d['mod']}: service({len(port_methods)} fwd), router({len(port_methods)} eps), bridge")
