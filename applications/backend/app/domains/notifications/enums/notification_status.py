"""Notification lifecycle status enumeration for the owning domain."""
from __future__ import annotations

from enum import Enum


class NotificationStatus(str, Enum):

    UNREAD = "UNREAD"
    READ = "READ"
    DISMISSED = "DISMISSED"
    EXPIRED = "EXPIRED"
