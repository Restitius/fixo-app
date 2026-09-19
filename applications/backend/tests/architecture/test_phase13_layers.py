"""Phase 13 architecture guard — cancellations / support / disputes layering.

Ensures the customer-protection domains follow the golden rule:

    Controller -> Service -> Port (domain/application)
                                 ^          |
                                 |          v
                         Adapter -> SQLQueryManager -> Registry -> DB
                                                             (IDs live ONLY here)

Forbidden:
    domains/cancellations|support|disputes -> platform | registries | infrastructure | integrations
    services/* in these domains                -> any CUS.* query ID or manager symbol
    adapters/persistence/*_sql_adapter.py      -> anything but the query manager + port
"""
from __future__ import annotations

import ast
from pathlib import Path

APP_ROOT = Path(__file__).resolve().parents[2] / "app"

_PHASE13_DOMAINS = ("cancellations", "support", "disputes")

_BANNED_MODULES = ("app.platform", "app.registries", "app.infrastructure", "app.integrations")
_BANNED_SYMBOLS = (
    "CUS.CANCEL.", "CUS.SUPPORT.", "CUS.DISPUTE.",
    "SQLQueryManager", "QueryRegistry", "QueryExecutor",
)


def _import_targets(tree: ast.Module) -> list[str]:
    targets: list[str] = []
    for node in ast.walk(tree):
        if isinstance(node, ast.Import):
            targets.extend(alias.name for alias in node.names)
        elif isinstance(node, ast.ImportFrom) and node.module:
            targets.append(node.module)
    return targets


def _phase13_files() -> list[tuple[Path, str]]:
    out: list[tuple[Path, str]] = []
    for name in _PHASE13_DOMAINS:
        root = APP_ROOT / "domains" / name
        for path in sorted(root.rglob("*.py")):
            if "__pycache__" in str(path):
                continue
            out.append((path, path.read_text(encoding="utf-8")))
    return out


def test_phase13_domains_never_import_infrastructure() -> None:
    violations: list[str] = []
    for path, source in _phase13_files():
        tree = ast.parse(source, filename=str(path))
        for target in _import_targets(tree):
            if target.startswith("app."):
                banned = any(target == b or target.startswith(b) for b in _BANNED_MODULES)
                if banned:
                    violations.append(f"{path.relative_to(APP_ROOT)}: imports {target}")
    assert not violations, "Phase 13 domains imported infrastructure:\n" + "\n".join(violations)


def test_phase13_services_do_not_reference_query_ids_or_managers() -> None:
    violations: list[str] = []
    for path, source in _phase13_files():
        if "services" not in str(path):
            continue
        for symbol in _BANNED_SYMBOLS:
            if symbol in source:
                violations.append(f"{path.relative_to(APP_ROOT)}: references {symbol!r}")
    assert not violations, "Phase 13 services referenced infrastructure symbols:\n" + "\n".join(violations)


def test_phase13_query_ids_are_registered_in_the_manifest() -> None:
    """Every CUS.* ID the adapters call must exist in the governed registry."""
    import yaml

    manifest = yaml.safe_load((APP_ROOT / "queries" / "registry.yaml").read_text(encoding="utf-8"))
    registered = set(manifest["queries"])

    expected = {
        "CUS.CANCEL.PREVIEW", "CUS.CANCEL.REQUEST", "CUS.CANCEL.RECORD", "CUS.CANCEL.LIST",
        "CUS.SUPPORT.TICKET.CREATE", "CUS.SUPPORT.TICKET.LIST", "CUS.SUPPORT.TICKET.GET",
        "CUS.SUPPORT.MESSAGE.ADD", "CUS.SUPPORT.MESSAGES.LIST",
        "CUS.DISPUTE.CREATE", "CUS.DISPUTE.LIST", "CUS.DISPUTE.GET",
        "CUS.DISPUTE.EVIDENCE.ADD", "CUS.DISPUTE.EVIDENCE.LIST", "CUS.DISPUTE.WITHDRAW",
    }
    missing = expected - registered
    assert not missing, f"Phase 13 query IDs missing from registry: {sorted(missing)}"


def test_phase13_adapters_own_the_query_ids() -> None:
    """The CUS.* IDs must appear ONLY in adapters/persistence, never in domains."""
    adapter_dir = APP_ROOT / "adapters" / "persistence"
    adapter_text = "\n".join(
        p.read_text(encoding="utf-8")
        for p in adapter_dir.glob("*_sql_adapter.py")
        if any(n in p.name for n in ("cancellation", "support", "dispute"))
    )
    for symbol in _BANNED_SYMBOLS[:3]:
        assert symbol in adapter_text, f"expected {symbol} to live in the adapter layer"

    for path, source in _phase13_files():
        if "services" not in str(path):
            continue
        for symbol in _BANNED_SYMBOLS[:3]:
            assert symbol not in source, f"{symbol!r} leaked into {path.relative_to(APP_ROOT)}"