"""AssetService — application service orchestrating asset USE CASES.

Flow position (portfolio architecture):

    Controller -> DTO -> AssetService -> Rules/Calculators
                                       -> AssetRepository (PORT)   <-- no SQL/IDs
                                       -> EventPublisher (PORT)    <-- no transports

This service knows NOTHING about SQL lives, how queries are governed, or the
query registry. Those live behind `app.ports.persistence.asset_repository`.
"""
from __future__ import annotations

from typing import Any

from app.domains.assets.dtos.asset_filter_dto import AssetFilterDTO
from app.domains.assets.dtos.create_asset_dto import CreateAssetDTO
from app.domains.assets.dtos.update_asset_dto import UpdateAssetDTO


class AssetService:
    """Use cases: create, list, get, update, sell, revalue, archive, summary."""

    def __init__(self, repository: Any, event_publisher: Any) -> None:
        self._repository = repository
        self._events = event_publisher

    async def create_asset(self, dto: CreateAssetDTO) -> Any:
        """Validate rules -> repository.add -> emit EVT-AST-CREATED."""
        row = await self._repository.add({
            "customer_id": dto.user_id,
            "name": dto.name,
            "asset_type": dto.asset_type,
            "purchase_value": dto.purchase_value,
            "currency": dto.currency,
            "purchased_at": dto.purchased_at,
            "notes": dto.notes,
        })
        if self._events is not None and row:
            from app.events.event import make_event
            await self._events.publish(
                make_event("EVT.AST.CREATED", {"asset_id": row.get("asset_id"), "customer_id": dto.user_id})
            )
        return row

    async def list_assets(self, filters: AssetFilterDTO) -> Any:
        """Paginated, ownership-scoped listing via repository.list()."""
        limit = max(1, min(filters.size, 100))
        offset = max(0, (filters.page - 1) * limit)
        return await self._repository.list({
            "customer_id": filters.user_id,
            "asset_type": filters.asset_type,
            "search": filters.search,
            "limit": limit,
            "offset": offset,
        })

    async def get_asset(self, user_id: str, asset_id: int) -> Any:
        """Ownership-checked fetch via repository.get()."""
        from app.shared.exceptions.hierarchy import NotFoundError

        row = await self._repository.get(user_id, str(asset_id))
        if not row:
            raise NotFoundError("Asset not found")
        return row

    async def update_asset(self, dto: UpdateAssetDTO) -> Any:
        from app.shared.exceptions.hierarchy import ValidationError

        # Every bind the UPDATE query references must exist, even as None
        # (COALESCE(:col, col) still requires the param to be present).
        row = await self._repository.update(dto.user_id, {
            "asset_id": str(dto.asset_id),
            "name": dto.name,
            "asset_type": dto.asset_type,
            "brand": None,
            "serial_number": None,
            "property_id": None,
            "purchased_at": dto.purchased_at,
            "warranty_until": None,
            "notes": dto.notes,
        })
        if not row:
            raise ValidationError("Asset could not be updated")
        return row

    async def sell_asset(self, user_id: str, asset_id: int, sale_payload: dict) -> Any:
        """Rules: cannot sell twice; persists status transition; emits event."""
        raise NotImplementedError("AssetService.sell_asset")

    async def revalue_asset(self, user_id: str, asset_id: int, new_value, reason: str | None) -> Any:
        """repository.revalue + valuation history + EVT-AST-REVALUED."""
        from app.shared.exceptions.hierarchy import ValidationError

        row = await self._repository.revalue(user_id, str(asset_id), new_value, reason)
        if not row:
            raise ValidationError("Asset could not be revalued")
        return row

    async def archive_asset(self, user_id: str, asset_id: int) -> Any:
        """Soft-delete via repository.archive; emits EVT-AST-ARCHIVED."""
        from app.shared.exceptions.hierarchy import NotFoundError

        row = await self._repository.archive(user_id, str(asset_id))
        if not row:
            raise NotFoundError("Asset not found")
        return row

    async def portfolio_summary(self, user_id: str) -> Any:
        """Aggregates via repository.summary (cache-aware)."""
        return await self._repository.summary(user_id)
