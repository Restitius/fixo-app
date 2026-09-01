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

from app.api.deps.request_context import RequestContext
from app.domains.assets.dtos.asset_filter_dto import AssetFilterDTO
from app.domains.assets.dtos.create_asset_dto import CreateAssetDTO
from app.domains.assets.dtos.update_asset_dto import UpdateAssetDTO


class AssetService:
    """Use cases: create, list, get, update, sell, revalue, archive, summary."""

    def __init__(self, repository: Any, event_publisher: Any) -> None:
        self._repository = repository
        self._events = event_publisher

    async def create_asset(self, ctx: RequestContext, dto: CreateAssetDTO) -> Any:
        """Validate rules -> repository.add -> emit EVT-AST-CREATED."""
        raise NotImplementedError("AssetService.create_asset")

    async def list_assets(self, ctx: RequestContext, filters: AssetFilterDTO) -> Any:
        """Paginated, ownership-scoped listing via repository.list()."""
        raise NotImplementedError("AssetService.list_assets")

    async def get_asset(self, ctx: RequestContext, asset_id: int) -> Any:
        """Ownership-checked fetch via repository.get()."""
        raise NotImplementedError("AssetService.get_asset")

    async def update_asset(self, ctx: RequestContext, dto: UpdateAssetDTO) -> Any:
        raise NotImplementedError("AssetService.update_asset")

    async def sell_asset(self, ctx: RequestContext, asset_id: int, sale_payload: dict) -> Any:
        """Rules: cannot sell twice; persists status transition; emits event."""
        raise NotImplementedError("AssetService.sell_asset")

    async def revalue_asset(self, ctx: RequestContext, asset_id: int, new_value, reason: str | None) -> Any:
        """repository.revalue + valuation history + EVT-AST-REVALUED."""
        raise NotImplementedError("AssetService.revalue_asset")

    async def archive_asset(self, ctx: RequestContext, asset_id: int) -> Any:
        """Soft-delete via repository.archive; emits EVT-AST-ARCHIVED."""
        raise NotImplementedError("AssetService.archive_asset")

    async def portfolio_summary(self, ctx: RequestContext) -> Any:
        """Aggregates via repository.summary (cache-aware)."""
        raise NotImplementedError("AssetService.portfolio_summary")

