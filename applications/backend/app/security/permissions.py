"""Permission model with wildcard support (pure).

Conventions:
    '*'                  -> global grant
    'assets.*'           -> all actions within a module
    'assets.view'        -> exact action
"""
from __future__ import annotations


def has_permission(granted: frozenset[str] | set[str], required: str) -> bool:
    """Wildcard-aware permission check (pure)."""
    if "*" in granted or required in granted:
        return True
    module = required.split(".", 1)[0]
    return f"{module}.*" in granted


class PermissionRegistry:
    """Simple in-process permission catalogue (DB-backed later)."""

    def __init__(self) -> None:
        self._permissions: set[str] = set()

    def grant(self, permission: str) -> None:
        self._permissions.add(permission)

    def revoke(self, permission: str) -> None:
        self._permissions.discard(permission)

    def has(self, permission: str) -> bool:
        return has_permission(self._permissions, permission)

    def all(self) -> list[str]:
        return sorted(self._permissions)
