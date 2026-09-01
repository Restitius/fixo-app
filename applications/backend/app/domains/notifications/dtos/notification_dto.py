"""NotificationDTO — internal transport for Notification existing notification (section 24)."""
from __future__ import annotations

from dataclasses import dataclass, field
from datetime import date
from decimal import Decimal

from app.shared.dtos.base import BaseDTO


@dataclass
class NotificationDTO(BaseDTO):
    """existing notification DTO moving between controller and service."""

    notification_id: int
    user_id: str
    status: str
    notes: str | None = None
