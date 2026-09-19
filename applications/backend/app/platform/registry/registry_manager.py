"""RegistryManager — platform facade over the coordinated application registries.

Adapters resolve via this facade; domain/application services never see it.
"""
from __future__ import annotations

from app.registries.registry_manager import RegistryManager as _RegistryManager


class RegistryManager(_RegistryManager):
    """Owns one instance of each registry for the running application."""

    # Kept for clarity; behaviour lives on the existing base class so the whole
    # application boots as before.
    pass