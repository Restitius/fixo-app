"""UpdateNotificationDTO — internal transport for Notification update input (section 24)."""
from __future__ import annotations

from dataclasses import dataclass, field
from datetime import date
from decimal import Decimal

from app.shared.dtos.base import BaseDTO


@dataclass
class UpdateNotificationDTO(BaseDTO):
    """update input DTO moving between controller and service."""

    notification_id: int
    user_id: str
    notes: str | None = None
