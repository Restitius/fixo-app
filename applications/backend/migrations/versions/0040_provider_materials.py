"""phase provider materials — materials & expenses (Provider Req Phase 24)

Revision ID: 0040_provider_materials
Revises: 0039_provider_change_request

Phase 24: providers may record materials used during the job
(e.g. PVC pipe x2 — 15,000; Connector x4 — 8,000; Sealant x1 — 7,000).
The provider can attach a purchase receipt, material photo or supplier
invoice. Depending on platform rules these costs may automatically be
added to the final invoice (Phase 27 reads the booking total).

One table:
  - BOOKING_MATERIALS   one row per material line. `attachment_kind`
    (RECEIPT / PHOTO / INVOICE) classifies `attachment_url`.

The BOOKINGS status CHECK is untouched — this phase is additive storage
that the job-execution flow reads/writes.
"""
from __future__ import annotations

from alembic import op

revision = "0040_provider_materials"
down_revision = "0039_provider_change_request"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Per-booking material / expense lines.
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS "BOOKING_MATERIALS" (
            material_id     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            booking_id      UUID NOT NULL
                            REFERENCES "BOOKINGS"(booking_id) ON DELETE CASCADE,
            provider_id     UUID NOT NULL
                            REFERENCES "PROVIDERS"(provider_id) ON DELETE CASCADE,
            item_name       VARCHAR(200) NOT NULL,
            quantity        NUMERIC(12,3) NOT NULL DEFAULT 1,
            unit_cost       NUMERIC(12,2),
            amount          NUMERIC(12,2) NOT NULL DEFAULT 0,
            currency        VARCHAR(3)   NOT NULL DEFAULT 'TZS',
            note            TEXT,
            attachment_url  TEXT,
            attachment_kind VARCHAR(12),
            created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
            CONSTRAINT CK_MATERIAL_ITEM CHECK (length(btrim(item_name)) > 0),
            CONSTRAINT CK_MATERIAL_QTY CHECK (quantity > 0),
            CONSTRAINT CK_MATERIAL_AMT CHECK (amount >= 0),
            CONSTRAINT CK_MATERIAL_ATTACHMENT_KIND
                CHECK (attachment_kind IS NULL OR
                       attachment_kind IN ('RECEIPT','PHOTO','INVOICE'))
        )
        """
    )
    op.execute(
        'CREATE INDEX IF NOT EXISTS "IX_BOOKING_MATERIALS" '
        'ON "BOOKING_MATERIALS" (booking_id, created_at)'
    )


def downgrade() -> None:
    op.execute('DROP TABLE IF EXISTS "BOOKING_MATERIALS"')
