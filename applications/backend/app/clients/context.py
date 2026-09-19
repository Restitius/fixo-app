"""ClientContext — per-request client-shell identity resolved from X-Client-ID."""
from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class ClientContext:
    client_id: str      # e.g. CLT-WEB-PROVIDER
    name: str           # e.g. FIXO Provider Web
    kind: str           # web | mobile | api | internal | unknown
    family: str         # customer | provider | admin | shared | internal | unknown
    version: str = ""   # X-Client-Version (build/deploy identifier)