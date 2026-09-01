"""AssetController — THIN translation layer (section 35).

Responsibilities: receive request -> context -> DTO -> service -> resource ->
standard response. It NEVER writes SQL, sends emails, calls providers, or
publishes events directly.
"""
from __future__ import annotations

from typing import Any

from app.api.deps.request_context import RequestContext
from app.domains.assets.dtos.create_asset_dto import CreateAssetDTO
from app.domains.assets.dtos.update_asset_dto import UpdateAssetDTO
from app.domains.assets.services.asset_service import AssetService
from app.shared.exceptions.hierarchy import NotImplementedFeatureError


class AssetController:
    """HTTP-facing orchestrator for the assets domain."""

    _service: AssetService | None = None

    @classmethod
    def _get_service(cls) -> AssetService:
        """Resolve the composed AssetService (purely business-facing ports)."""
        if cls._service is None:
            try:
                from app.startup.composition import get_composition

                cls._service = get_composition().asset_service()
            except RuntimeError:
                # Composition only exists once startup runs. Outside it (e.g.
                # lifespan-less tests) keep the scaffold 501 contract: the
                # feature is intentionally not wired until composition lands.
                raise NotImplementedFeatureError(
                    "AssetService not composed yet — run startup first"
                )
        return cls._service

    @classmethod
    async def create(cls, ctx: RequestContext, payload: Any) -> dict:
        cls._get_service()  # scaffold gate: raises 501 until DI composition lands
        dto = CreateAssetDTO(**payload.model_dump())  # shape of the future call
        raise NotImplementedFeatureError("Asset creation pipeline not implemented yet")

    @classmethod
    async def list(cls, ctx: RequestContext, pagination: Any) -> dict:
        raise NotImplementedFeatureError("Asset listing pipeline not implemented yet")

    @classmethod
    async def get(cls, ctx: RequestContext, asset_id: int) -> dict:
        raise NotImplementedFeatureError("Asset retrieval pipeline not implemented yet")

    @classmethod
    async def update(cls, ctx: RequestContext, asset_id: int, payload: Any) -> dict:
        raise NotImplementedFeatureError("Asset update pipeline not implemented yet")

    @classmethod
    async def sell(cls, ctx: RequestContext, asset_id: int, payload: Any) -> dict:
        raise NotImplementedFeatureError("Asset sale pipeline not implemented yet")

    @classmethod
    async def revalue(cls, ctx: RequestContext, asset_id: int, payload: Any) -> dict:
        raise NotImplementedFeatureError("Asset revaluation pipeline not implemented yet")

    @classmethod
    async def archive(cls, ctx: RequestContext, asset_id: int) -> dict:
        raise NotImplementedFeatureError("Asset archive pipeline not implemented yet")

    @classmethod
    async def summary(cls, ctx: RequestContext) -> dict:
        raise NotImplementedFeatureError("Asset summary pipeline not implemented yet")
