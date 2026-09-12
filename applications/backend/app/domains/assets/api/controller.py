"""AssetController — THIN translation layer (section 35).

Responsibilities: receive request -> customer_id -> DTO -> service -> resource ->
standard response. It NEVER writes SQL, sends emails, calls providers, or
publishes events directly.

Note: this domain originally depended on the generic RequestContext
(GetRequestContext), whose user_id is never populated by any auth
middleware in this codebase (nothing sets request.state.user_id) — every
call silently ran as an empty-string owner. Switched to CurrentCustomer,
the same working Bearer-token dependency every other customer domain
(properties, maintenance, warranties, ...) already uses.
"""
from __future__ import annotations

from typing import Any

from app.api.responses.response import ok
from app.domains.assets.dtos.asset_filter_dto import AssetFilterDTO
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
    async def create(cls, user_id: str, payload: Any) -> dict:
        svc = cls._get_service()
        dto = CreateAssetDTO(user_id=user_id, **payload.model_dump())
        row = await svc.create_asset(dto)
        return ok(row, title="Asset added", status_code=201)

    @classmethod
    async def list(cls, user_id: str, pagination: Any) -> dict:
        svc = cls._get_service()
        page = getattr(pagination, "page", 1) if pagination else 1
        size = getattr(pagination, "size", 20) if pagination else 20
        filters = AssetFilterDTO(user_id=user_id, page=page, size=size)
        rows = await svc.list_assets(filters)
        return ok(rows)

    @classmethod
    async def get(cls, user_id: str, asset_id: str) -> dict:
        svc = cls._get_service()
        return ok(await svc.get_asset(user_id, asset_id))

    @classmethod
    async def update(cls, user_id: str, asset_id: str, payload: Any) -> dict:
        svc = cls._get_service()
        dto = UpdateAssetDTO(asset_id=asset_id, user_id=user_id, **payload.model_dump())
        row = await svc.update_asset(dto)
        return ok(row, title="Asset updated")

    @classmethod
    async def sell(cls, user_id: str, asset_id: str, payload: Any) -> dict:
        raise NotImplementedFeatureError("Asset sale pipeline not implemented yet")

    @classmethod
    async def revalue(cls, user_id: str, asset_id: str, payload: Any) -> dict:
        svc = cls._get_service()
        data = payload.model_dump()
        row = await svc.revalue_asset(user_id, asset_id, data.get("new_value"), data.get("reason"))
        return ok(row, title="Asset revalued")

    @classmethod
    async def archive(cls, user_id: str, asset_id: str) -> dict:
        svc = cls._get_service()
        row = await svc.archive_asset(user_id, asset_id)
        return ok(row, title="Asset removed")

    @classmethod
    async def summary(cls, user_id: str) -> dict:
        svc = cls._get_service()
        return ok(await svc.portfolio_summary(user_id))
