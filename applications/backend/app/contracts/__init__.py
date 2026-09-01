"""Generic low-level contracts (protocols).

These describe infrastructure-adjacent capabilities (Repository, Integration,
EventBus, Cache, Storage). Business-facing, capability-shaped ports live in
`app/ports/`; generic contracts here remain available for adapters and shared
plumbing.
"""
from app.contracts.cache import Cache
from app.contracts.event_bus import EventBus
from app.contracts.integration import Integration
from app.contracts.repository import Repository
from app.contracts.storage import Storage

__all__ = ["Cache", "EventBus", "Integration", "Repository", "Storage"]
