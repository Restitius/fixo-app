"""Role model and registry (pure mechanics; persistence arrives later)."""
from __future__ import annotations

from dataclasses import dataclass, field


@dataclass(frozen=True)
class Role:
    name: str
    permissions: frozenset[str] = field(default_factory=frozenset)


class RoleRegistry:
    def __init__(self) -> None:
        self._roles: dict[str, Role] = {}

    def register(self, role: Role, *, override: bool = False) -> None:
        if role.name in self._roles and not override:
            raise ValueError(f"Role already registered: {role.name}")
        self._roles[role.name] = role

    def get(self, name: str) -> Role:
        try:
            return self._roles[name]
        except KeyError:
            raise KeyError(f"Unknown role: {name}") from None

    def all(self) -> list[Role]:
        return sorted(self._roles.values(), key=lambda r: r.name)
