"""ClientDefinition — a registered frontend application shell (CLT-*).

A *client* is an application surface (web-user, web-provider, web-admin,
mobile customer app, public API, internal worker/webhook) that talks to the
backend. It is an **attribution** axis — logs, events, audit and jobs use it
to answer "which frontend shell performed this request?". It is **never** an
authorization control; RBAC + ownership assertions stay the enforcement point.

Example::

    ClientDefinition(
        id="CLT-WEB-PROVIDER",
        name="FIXO Provider Web",
        kind="web",
        family="provider",
        description="Provider dashboard shell (vite + tanstack).",
    )
"""
from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class ClientDefinition:
    """Immutable description of one frontend application shell."""

    id: str            # e.g. CLT-WEB-PROVIDER
    name: str          # human label, e.g. FIXO Provider Web
    kind: str          # web | mobile | api | internal | unknown
    family: str        # customer | provider | admin | shared | internal | unknown
    description: str = ""