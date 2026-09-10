"""phase provider booking acknowledgement (Provider Req Phase 14)

Revision ID: 0032_provider_booking_ack
Revises: 0031_provider_quotations

Provider-side booking views + acknowledgement. Adds provider-scoped
read queries (feed, detail, timeline) and an acknowledgement record
so providers can confirm they've seen and accepted a booking.

Table names are CAPITAL-quoted per project convention. Raw DDL only.
"""
from __future__ import annotations

from alembic import op

revision = "0032_provider_booking_ack"
down_revision = "0031_provider_quotations"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS "PROVIDER_BOOKING_ACKNOWLEDGEMENTS" (
            ack_id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            booking_id   UUID         NOT NULL REFERENCES "BOOKINGS"(booking_id) ON DELETE CASCADE,
            provider_id  UUID         NOT NULL REFERENCES "PROVIDERS"(provider_id) ON DELETE CASCADE,
            acknowledged_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            notes        VARCHAR(500),
            UNIQUE (booking_id, provider_id)
        )
        """
    )
    op.execute(
        'CREATE INDEX IF NOT EXISTS "IX_PROV_BOOKING_ACK_BOOKING" '
        'ON "PROVIDER_BOOKING_ACKNOWLEDGEMENTS" (booking_id)'
    )
    op.execute(
        'CREATE INDEX IF NOT EXISTS "IX_PROV_BOOKING_ACK_PROVIDER" '
        'ON "PROVIDER_BOOKING_ACKNOWLEDGEMENTS" (provider_id, acknowledged_at)'
    )


def downgrade() -> None:
    op.execute('DROP TABLE IF EXISTS "PROVIDER_BOOKING_ACKNOWLEDGEMENTS"')
