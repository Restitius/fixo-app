"""Service-request domain router — Phase 4 lifecycle + evidence."""
from __future__ import annotations

from fastapi import APIRouter, File, Query, UploadFile
from pydantic import BaseModel, Field

from app.api.deps.auth import CurrentCustomer
from app.api.responses.response import ok
from app.startup.composition import get_composition

router = APIRouter(prefix="/service-requests", tags=["service-requests"])


class RequestCreate(BaseModel):
    service_id: str
    description: str = Field(min_length=10, max_length=2000)
    property_id: str | None = None
    address_id: str | None = None
    preferred_date: str | None = None   # YYYY-MM-DD
    time_window: str | None = None      # MORNING | AFTERNOON | EVENING


class RequestUpdate(BaseModel):
    description: str | None = Field(default=None, min_length=10, max_length=2000)
    preferred_date: str | None = None
    clear_schedule: bool = False
    time_window: str | None = None
    address_id: str | None = None
    clear_address: bool = False
    property_id: str | None = None
    clear_property: bool = False


@router.post("", status_code=201)
async def create_request(payload: RequestCreate, customer: CurrentCustomer) -> dict:
    svc = get_composition().request_service()
    data = payload.model_dump()
    return ok(
        await svc.create(str(customer["customer_id"]), data),
        title="Request created", status_code=201,
    )


@router.get("")
async def list_requests(
    customer: CurrentCustomer,
    status: str | None = Query(default=None, max_length=24),
    limit: int = Query(default=20, ge=1, le=50),
    offset: int = Query(default=0, ge=0),
) -> dict:
    svc = get_composition().request_service()
    return ok(await svc.list(str(customer["customer_id"]), status=status,
                             limit=limit, offset=offset))


@router.get("/{request_id}")
async def get_request(request_id: str, customer: CurrentCustomer) -> dict:
    svc = get_composition().request_service()
    return ok(await svc.get(str(customer["customer_id"]), request_id))


@router.patch("/{request_id}")
async def update_request(
    request_id: str, payload: RequestUpdate, customer: CurrentCustomer
) -> dict:
    svc = get_composition().request_service()
    data = payload.model_dump()
    return ok(await svc.update_draft(str(customer["customer_id"]), request_id, data),
              title="Draft updated")


@router.post("/{request_id}/submit")
async def submit_request(request_id: str, customer: CurrentCustomer) -> dict:
    svc = get_composition().request_service()
    result = await svc.submit(str(customer["customer_id"]), request_id)
    return ok(result, title=f"Request {result['status']}")


@router.post("/{request_id}/cancel")
async def cancel_request(request_id: str, customer: CurrentCustomer) -> dict:
    svc = get_composition().request_service()
    return ok(await svc.cancel(str(customer["customer_id"]), request_id),
              title="Request cancelled")


@router.post("/{request_id}/evidence", status_code=201)
async def upload_evidence(
    request_id: str,
    customer: CurrentCustomer,
    file: UploadFile = File(...),
) -> dict:
    svc = get_composition().request_service()
    content = await file.read()
    row = await svc.add_evidence(
        str(customer["customer_id"]), request_id,
        name=file.filename or "upload",
        content=content,
        content_type=file.content_type,
    )
    return ok(row, title="Evidence attached", status_code=201)


@router.get("/{request_id}/evidence")
async def list_evidence(request_id: str, customer: CurrentCustomer) -> dict:
    svc = get_composition().request_service()
    return ok(await svc.list_evidence(str(customer["customer_id"]), request_id))


@router.delete("/{request_id}/evidence/{evidence_id}")
async def delete_evidence(
    request_id: str, evidence_id: str, customer: CurrentCustomer
) -> dict:
    svc = get_composition().request_service()
    return ok(await svc.delete_evidence(str(customer["customer_id"]), request_id, evidence_id),
              title="Evidence removed")