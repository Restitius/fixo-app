"""Strong ID types — used in signatures, logs and registries.

These are NewTypes over str: zero runtime cost, real editor/mypy value.
ID conventions (§39): SCR-*, QRY-/DOMAIN.*, INT-*, EVT-*, JOB-*, NTF-*.
"""
from __future__ import annotations

from typing import NewType

RequestId = NewType("RequestId", str)
CorrelationId = NewType("CorrelationId", str)
SessionId = NewType("SessionId", str)
TenantId = NewType("TenantId", str)
UserId = NewType("UserId", str)

ScreenId = NewType("ScreenId", str)            # SCR-AST-001
QueryId = NewType("QueryId", str)              # ASSET.GET_BY_ID
IntegrationId = NewType("IntegrationId", str)  # INT-PAY-001
EventId = NewType("EventId", str)              # EVT-AST-CREATED
JobId = NewType("JobId", str)                  # JOB-AST-REVALUE
NotificationKey = NewType("NotificationKey", str)  # NTF-AST-CREATED
CommandName = NewType("CommandName", str)
