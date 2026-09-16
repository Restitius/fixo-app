"""Generic authenticated file upload/serving.

Unblocks profile photos, business logos, and identity-verification
documents — their schemas require a real, fetchable URL (e.g.
`AddDocumentRequest.front_image_url` is non-optional), but until this
route existed there was nowhere to get one from: `FileManager` (platform/
files/file_manager.py) already existed and is unit-tested, but was never
wired to an HTTP route besides one narrow customer service-request-
evidence endpoint, and it returns an internal `storage_key`, not a URL.

Accepts either a customer or a provider bearer token (their JWTs carry
different claim shapes: `{"role": "customer"}` vs `{"principal":
"PROVIDER"}`) — this checks both rather than duplicating one of the
existing single-audience auth dependencies.

Security note: serving is private-by-default (any signed-in customer or
provider may fetch any uploaded file if they know its key), not a full
per-resource ACL — a customer could fetch another provider's verification
document if they somehow obtained its key (keys are random UUIDs, not
enumerable, so this is a low-probability, not a zero, exposure). A real
ACL (only the uploader, or a reviewer, for verification documents) is a
reasonable follow-up once there's a concrete reviewer workflow to scope it
against — not fabricated here.
"""
from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, File, Header, HTTPException, UploadFile
from fastapi.responses import Response

from app.api.responses.response import created
from app.config import get_settings
from app.shared.exceptions.hierarchy import AuthenticationError
from app.startup.composition import get_composition

router = APIRouter(prefix="/uploads", tags=["uploads"])

_MIME_BY_EXT = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".pdf": "application/pdf",
}


async def _current_uploader(
    authorization: Annotated[str | None, Header()] = None,
) -> dict[str, str]:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise AuthenticationError("Missing bearer token")

    token = authorization.split(" ", 1)[1].strip()
    composition = get_composition()
    try:
        claims = composition.jwt.decode(token)
    except Exception as exc:
        raise AuthenticationError("Invalid or expired token") from exc

    if claims.get("role") == "customer":
        return {"principal_type": "customer", "id": str(claims.get("sub", ""))}
    if claims.get("principal") == "PROVIDER":
        return {"principal_type": "provider", "id": str(claims.get("sub", ""))}
    raise AuthenticationError("Token is not a recognised customer or provider token")


@router.post("")
async def upload_file(
    uploader: Annotated[dict[str, str], Depends(_current_uploader)],
    file: UploadFile = File(...),
) -> dict:
    """Validate (magic bytes, size, allowlist — see FileManager), persist,
    and return a URL the caller can immediately use (e.g. as
    front_image_url / profile_photo_url / logo_url)."""
    content = await file.read()
    # No leading "uploads/" here — the route's own /uploads prefix already
    # says that; storage_key already reads cleanly as {type}/{id}/{uuid}.ext.
    folder = f"{uploader['principal_type']}/{uploader['id']}"
    try:
        meta = await get_composition().file_manager.upload(
            name=file.filename or "upload",
            content=content,
            content_type=file.content_type,
            folder=folder,
        )
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc

    prefix = get_settings().api_v1_prefix
    meta["url"] = f"{prefix}/uploads/{meta['storage_key']}"
    return created(meta, title="Uploaded")


@router.get("/{storage_key:path}")
async def get_file(
    storage_key: str,
    _uploader: Annotated[dict[str, str], Depends(_current_uploader)],
) -> Response:
    try:
        content = await get_composition().storage_manager.get(storage_key)
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail="File not found") from exc

    ext = storage_key[storage_key.rfind(".") :] if "." in storage_key else ""
    mime = _MIME_BY_EXT.get(ext.lower(), "application/octet-stream")
    return Response(content=content, media_type=mime)
