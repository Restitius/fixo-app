"""Authentication audit/event taxonomy enumeration for the owning domain."""
from __future__ import annotations

from enum import Enum


class SessionEventType(str, Enum):

    LOGIN_SUCCEEDED = "LOGIN_SUCCEEDED"
    LOGIN_FAILED = "LOGIN_FAILED"
    LOGOUT = "LOGOUT"
    TOKEN_REFRESHED = "TOKEN_REFRESHED"
