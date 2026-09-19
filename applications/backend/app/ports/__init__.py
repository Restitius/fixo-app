"""Ports (Contracts) — the ONLY layer application/domain services may depend on.

Architecture (§ports):

    Application Service
           │
           ▼
         PORTS / CONTRACTS     <-- this package
           │
           ▼
         ADAPTERS
           │
           ▼
         MANAGERS
           │
           ▼
         REGISTRIES
           │
           ▼
         INFRASTRUCTURE / PROVIDERS

Domains and application services see ONLY the business-facing protocols in this
package. They never import `platform`, `registries`, `infrastructure`,
`integrations`, SQL files, or query IDs. Generic low-level protocols (Cache,
Storage, EventBus, Repository, Integration) remain in `app/contracts/` and are
re-exported where they describe a business capability.
"""