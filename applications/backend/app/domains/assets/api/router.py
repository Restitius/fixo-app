"""Assets router — declares endpoints; ALL logic lives in the controller."""
from __future__ import annotations

from fastapi import APIRouter

from app.api.deps.auth import CurrentCustomer
from app.api.deps.pagination import PaginationDep
from app.domains.assets.api.controller import AssetController
from app.domains.assets.requests.create_asset import CreateAssetRequest
from app.domains.assets.requests.revalue_asset import RevalueAssetRequest
from app.domains.assets.requests.sell_asset import SellAssetRequest
from app.domains.assets.requests.update_asset import UpdateAssetRequest

router = APIRouter(prefix="/assets", tags=["assets"])


@router.post("", status_code=201)
async def create_asset(payload: CreateAssetRequest, customer: CurrentCustomer) -> dict:
    """SCR-AST-001 -> POST /api/v1/assets -> AssetController.create."""
    return await AssetController.create(str(customer["customer_id"]), payload)


@router.get("")
async def list_assets(customer: CurrentCustomer, pagination: PaginationDep = None) -> dict:
    """SCR-AST-001 -> GET /api/v1/assets -> AssetController.list."""
    return await AssetController.list(str(customer["customer_id"]), pagination)


@router.get("/summary")
async def asset_summary(customer: CurrentCustomer) -> dict:
    """Portfolio totals for the authenticated owner."""
    return await AssetController.summary(str(customer["customer_id"]))


@router.get("/{asset_id}")
async def get_asset(asset_id: str, customer: CurrentCustomer) -> dict:
    """SCR-AST-002 -> GET /api/v1/assets/{id} -> AssetController.get."""
    return await AssetController.get(str(customer["customer_id"]), asset_id)


@router.patch("/{asset_id}")
async def update_asset(asset_id: str, payload: UpdateAssetRequest, customer: CurrentCustomer) -> dict:
    return await AssetController.update(str(customer["customer_id"]), asset_id, payload)


@router.post("/{asset_id}/sell")
async def sell_asset(asset_id: str, payload: SellAssetRequest, customer: CurrentCustomer) -> dict:
    return await AssetController.sell(str(customer["customer_id"]), asset_id, payload)


@router.post("/{asset_id}/revalue")
async def revalue_asset(asset_id: str, payload: RevalueAssetRequest, customer: CurrentCustomer) -> dict:
    return await AssetController.revalue(str(customer["customer_id"]), asset_id, payload)


@router.delete("/{asset_id}", status_code=200)
async def archive_asset(asset_id: str, customer: CurrentCustomer) -> dict:
    return await AssetController.archive(str(customer["customer_id"]), asset_id)
