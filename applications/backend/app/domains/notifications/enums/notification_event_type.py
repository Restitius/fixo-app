"""Notification audit/event taxonomy enumeration for the owning domain."""
from __future__ import annotations

from enum import Enum


class NotificationEventType(str, Enum):

    CREATED = "CREATED"
    READ = "READ"
    DISMISSED = "DISMISSED"
    ESCALATED = "ESCALATED"
