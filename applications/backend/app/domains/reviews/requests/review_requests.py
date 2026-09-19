"""Request DTOs for Phase 10 endpoints."""
from __future__ import annotations

from pydantic import BaseModel, Field, field_validator


class CreateReviewRequest(BaseModel):
    booking_id: str
    rating: int = Field(ge=1, le=5)
    comment: str | None = None

    @field_validator("comment")
    @classmethod
    def clean_comment(cls, v: str | None) -> str | None:
        if v is None:
            return None
        return v.strip() or None


class FileClaimRequest(BaseModel):
    reason: str
    description: str | None = None
