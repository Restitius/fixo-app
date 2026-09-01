"""Import-graph guard tests — enforce the golden dependency rule.

    Presentation -> Application -> Domain -> Ports
          ^                            |
          |                            v
    Infrastructure <- Managers <- Adapters <- Registry/Definitions

Forbidden edges (fail CI if introduced):

    domains/**        -> platform/** | registries/** | infrastructure/** | integrations/**
    ports/**          -> platform/** | registries/** | infrastructure/** | integrations/**
    platform/**       -> domains/**
    domains/*/services -> any manager/registry infra symbol (query IDs, INT-*,
                         EVT-*, NTF-*, SQLQueryManager, ...)
"""
from __future__ import annotations

import ast
from pathlib import Path

import pytest

APP_ROOT = Path(__file__).resolve().parents[2] / "app"

# Layers that application/domain code must NEVER see.
_INFRA_TOKENS = (
    "app.platform",
    "app.registries",
    "app.infrastructure",
    "app.integrations",
    "app.queries",
    "app.definitions",
)

# Symbols that belong to the adapters/platform layers — never in services.
_INFRA_SYMBOLS = (
    "SQLQueryManager",
    "QueryRegistry",
    "QueryExecutor",
    "IntegrationManager",
    "QueryIds",
    "registry_manager",
    "query_ids",
)


def _iter_python_files(root: Path) -> list[Path]:
    return sorted(p for p in root.rglob("*.py") if "__pycache__" not in str(p))


def _import_targets(tree: ast.Module) -> list[str]:
    """Collect fully-qualified module targets from imports/from-imports."""
    targets: list[str] = []
    for node in ast.walk(tree):
        if isinstance(node, ast.Import):
            targets.extend(alias.name for alias in node.names)
        elif isinstance(node, ast.ImportFrom):
            if node.module:
                targets.append(node.module)
            if node.level:  # relative import (e.g. .services.asset_service)
                targets.append(f".{node.module}" if node.module else ".")
    return targets


def _module_tokens(relative: str) -> list[str]:
    """First 3 path tokens of a module relative to app/ (e.g. domains/assets/x)."""
    parts = [p for p in Path(relative).parts if p not in (".", "..")]
    return parts[:3] or ["?"]


@pytest.fixture(scope="module")
def app_files() -> dict[Path, ast.Module]:
    files: dict[Path, ast.Module] = {}
    for path in _iter_python_files(APP_ROOT):
        try:
            tree = ast.parse(path.read_text(encoding="utf-8"), filename=str(path))
        except SyntaxError:  # pragma: no cover - should not happen
            continue
        files[path] = tree
    return files


def _relative_to_app(path: Path) -> str:
    return path.relative_to(APP_ROOT).as_posix()


def test_domains_and_ports_never_import_infrastructure_layers(app_files: dict[Path, ast.Module]) -> None:
    """application/domain code must only see ports + shared kernel."""
    violations: list[str] = []
    for path, tree in app_files.items():
        rel = _relative_to_app(path)
        if not (rel.startswith("domains/") or rel.startswith("ports/")):
            continue
        for target in _import_targets(tree):
            if any(target == token or target.startswith(token) for token in _INFRA_TOKENS):
                violations.append(f"{rel}: imports {target}")
    assert not violations, "domains/ports imported infrastructure:\n" + "\n".join(violations)


def test_platform_never_imports_domains(app_files: dict[Path, ast.Module]) -> None:
    violations: list[str] = []
    for path, tree in app_files.items():
        rel = _relative_to_app(path)
        if not rel.startswith("platform/"):
            continue
        for target in _import_targets(tree):
            if target == "app.domains" or target.startswith("app.domains"):
                violations.append(f"{rel}: imports {target}")
    assert not violations, "platform imported domains:\n" + "\n".join(violations)


def test_adapters_may_not_import_domains_or_ports_impls(app_files: dict[Path, ast.Module]) -> None:
    """Adapters implement the ports; they must not depend on domain modules."""
    violations: list[str] = []
    for path, tree in app_files.items():
        rel = _relative_to_app(path)
        if not rel.startswith("adapters/"):
            continue
        for target in _import_targets(tree):
            if target == "app.domains" or target.startswith("app.domains"):
                violations.append(f"{rel}: imports {target}")
    assert not violations, "adapters imported domains:\n" + "\n".join(violations)


def test_domain_services_do_not_reference_infra_symbols(app_files: dict[Path, ast.Module]) -> None:
    """No services/* file may name a manager/registry/query-id symbol."""
    violations: list[str] = []
    for path, tree in app_files.items():
        rel = _relative_to_app(path)
        segments = rel.split("/")
        if "services" not in segments:
            continue
        source = path.read_text(encoding="utf-8")
        for symbol in _INFRA_SYMBOLS:
            if symbol in source:
                violations.append(f"{rel}: references {symbol!r}")
    assert not violations, "services referenced infrastructure symbols:\n" + "\n".join(violations)


def test_query_ids_live_only_in_adapters(app_files: dict[Path, ast.Module]) -> None:
    """Query-ID constants are adapter-private and never appear in domains."""
    violations: list[str] = []
    for path in _iter_python_files(APP_ROOT / "domains"):
        rel = _relative_to_app(path)
        source = path.read_text(encoding="utf-8")
        if "ASSET.CREATE" in source or "ASSET.GET_BY_ID" in source:
            violations.append(f"{rel}: contains governed query IDs")
    assert not violations, "domains contained query IDs:\n" + "\n".join(violations)