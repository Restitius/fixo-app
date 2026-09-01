"""Assets router — declares endpoints; ALL logic lives in the controller."""
from __future__ import annotations

from fastapi import APIRouter

from app.api.deps.pagination import PaginationDep
from app.api.deps.request_context import GetRequestContext
from app.domains.assets.api.controller import AssetController
from app.domains.assets.requests.create_asset import CreateAssetRequest
from app.domains.assets.requests.revalue_asset import RevalueAssetRequest
from app.domains.assets.requests.sell_asset import SellAssetRequest
from app.domains.assets.requests.update_asset import UpdateAssetRequest

router = APIRouter(prefix="/assets", tags=["assets"])


@router.post("", status_code=201)
async def create_asset(payload: CreateAssetRequest, ctx=GetRequestContext) -> dict:
    """SCR-AST-001 -> POST /api/v1/assets -> AssetController.create."""
    return await AssetController.create(ctx, payload)


@router.get("")
async def list_assets(ctx=GetRequestContext, pagination: PaginationDep = None) -> dict:
    """SCR-AST-001 -> GET /api/v1/assets -> AssetController.list."""
    return await AssetController.list(ctx, pagination)


@router.get("/summary")
async def asset_summary(ctx=GetRequestContext) -> dict:
    """Portfolio totals for the authenticated owner."""
    return await AssetController.summary(ctx)


@router.get("/{asset_id}")
async def get_asset(asset_id: int, ctx=GetRequestContext) -> dict:
    """SCR-AST-002 -> GET /api/v1/assets/{id} -> AssetController.get."""
    return await AssetController.get(ctx, asset_id)


@router.patch("/{asset_id}")
async def update_asset(asset_id: int, payload: UpdateAssetRequest, ctx=GetRequestContext) -> dict:
    return await AssetController.update(ctx, asset_id, payload)


@router.post("/{asset_id}/sell")
async def sell_asset(asset_id: int, payload: SellAssetRequest, ctx=GetRequestContext) -> dict:
    return await AssetController.sell(ctx, asset_id, payload)


@router.post("/{asset_id}/revalue")
async def revalue_asset(asset_id: int, payload: RevalueAssetRequest, ctx=GetRequestContext) -> dict:
    return await AssetController.revalue(ctx, asset_id, payload)


@router.delete("/{asset_id}", status_code=200)
async def archive_asset(asset_id: int, ctx=GetRequestContext) -> dict:
    return await AssetController.archive(ctx, asset_id)
