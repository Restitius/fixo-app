"""StorageGateway — object/file storage capability (re-exports generic Storage).

Wraps the low-level `app/contracts/storage.Storage` into a business port so
domains depend on this package rather than infrastructure classes.
"""
from __future__ import annotations

from app.contracts.storage import Storage as StorageGateway

__all__ = ["StorageGateway"]