"""phase provider pricing — five pricing structures per service (Provider Req Phase 7)

Revision ID: 0027_provider_pricing
Revises: 0026_provider_services

Adds PROVIDER_SERVICE_PRICING: structured, per-service pricing with the five
required models — FIXED (base_amount), STARTING (from_amount), HOURLY
(hourly_rate + optional minimum_hours), INSPECTION_THEN_QUOTE (optional
inspection_fee) and CUSTOM_QUOTATION (no amounts). The composite FK to
PROVIDER_SERVICES(provider_id, service_id) enforces at the database level
that only configured services can be priced.

Amounts are TZS by default; the parent configuration's coarse pricing columns
(PRV Phase 6) are re-synced by the upsert/clear queries so marketplace readers
stay coherent.

Table names are CAPITAL-quoted per project convention. Raw DDL only.
"""
from __future__ import annotations

from alembic import op

revision = "0027_provider_pricing"
down_revision = "0026_provider_services"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS "PROVIDER_SERVICE_PRICING" (
            pricing_id     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            provider_id    UUID NOT NULL REFERENCES "PROVIDERS"(provider_id) ON DELETE CASCADE,
            service_id     UUID NOT NULL REFERENCES "SERVICES"(service_id) ON DELETE CASCADE,
            pricing_model  VARCHAR(30) NOT NULL
                           CHECK (pricing_model IN
                                  ('FIXED', 'STARTING', 'HOURLY',
                                   'INSPECTION_THEN_QUOTE', 'CUSTOM_QUOTATION')),
            base_amount    NUMERIC(12,2) CHECK (base_amount IS NULL OR base_amount >= 0),
            from_amount    NUMERIC(12,2) CHECK (from_amount IS NULL OR from_amount >= 0),
            hourly_rate    NUMERIC(12,2) CHECK (hourly_rate IS NULL OR hourly_rate >= 0),
            minimum_hours  NUMERIC(4,1)  CHECK (minimum_hours IS NULL OR minimum_hours > 0),
            inspection_fee NUMERIC(12,2) CHECK (inspection_fee IS NULL OR inspection_fee >= 0),
            currency       VARCHAR(3)   NOT NULL DEFAULT 'TZS',
            includes_text  VARCHAR(500),
            is_negotiable  BOOLEAN      NOT NULL DEFAULT FALSE,
            created_at     TIMESTAMPTZ  NOT NULL DEFAULT now(),
            updated_at     TIMESTAMPTZ  NOT NULL DEFAULT now(),
            CONSTRAINT "UQ_PRICING_PROVIDER_SERVICE" UNIQUE (provider_id, service_id),
            CONSTRAINT "FK_PRICING_PROVIDER_SERVICE" FOREIGN KEY (provider_id, service_id)
                REFERENCES "PROVIDER_SERVICES"(provider_id, service_id) ON DELETE CASCADE
        )
        """
    )
    op.execute(
        'CREATE INDEX IF NOT EXISTS "IX_PRICING_PROVIDER" '
        'ON "PROVIDER_SERVICE_PRICING" (provider_id)'
    )
    op.execute(
        'CREATE INDEX IF NOT EXISTS "IX_PRICING_SERVICE" '
        'ON "PROVIDER_SERVICE_PRICING" (service_id)'
    )


def downgrade() -> None:
    op.execute('DROP INDEX IF EXISTS "IX_PRICING_SERVICE"')
    op.execute('DROP INDEX IF EXISTS "IX_PRICING_PROVIDER"')
    op.execute('DROP TABLE IF EXISTS "PROVIDER_SERVICE_PRICING"')
