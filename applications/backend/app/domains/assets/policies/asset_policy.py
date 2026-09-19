"""AssetPolicy — authorization questions for asset operations (section 26)."""
from __future__ import annotations

from typing import Any


class AssetPolicy:
    """Answers CAN-questions; enforcement happens at API + SQL layers too."""

    @staticmethod
    def can_view(principal: Any, asset: Any) -> bool:
        raise NotImplementedError("AssetPolicy.can_view")

    @staticmethod
    def can_update(principal: Any, asset: Any) -> bool:
        raise NotImplementedError("AssetPolicy.can_update")

    @staticmethod
    def can_archive(principal: Any, asset: Any) -> bool:
        raise NotImplementedError("AssetPolicy.can_archive")

    @staticmethod
    def can_sell(principal: Any, asset: Any) -> bool:
        raise NotImplementedError("AssetPolicy.can_sell")
