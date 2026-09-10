"""phase provider arrival — GPS arrival + PIN verification (Provider Req Phase 19)

Revision ID: 0035_phase_provider_arrival
Revises: 0034_phase_provider_tracking

Adds arrival-specific GPS capture (arrival_latitude/longitude) so the
provider records exactly where they arrived, distinct from the live trip
tracking columns. Expands the BOOKINGS status CHECK constraint to include
provider-side statuses (ON_THE_WAY, ARRIVED, AT_LOCATION, WORK_STARTED,
WORK_COMPLETED, COMPLETED) so the existing CONFIRMED→ARRIVED→COMPLETED
flow is supported.

Table names are CAPITAL-quoted per project convention. Raw DDL only.
"""
from __future__ import annotations

from alembic import op

revision = "0035_phase_provider_arrival"
down_revision = "0034_phase_provider_tracking"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Arrival GPS snapshot (distinct from live trip tracking).
    op.execute('ALTER TABLE "BOOKINGS" ADD COLUMN IF NOT EXISTS arrival_latitude NUMERIC(9,6)')
    op.execute('ALTER TABLE "BOOKINGS" ADD COLUMN IF NOT EXISTS arrival_longitude NUMERIC(9,6)')

    # Expand status constraint to include provider-side booking statuses.
    op.execute(
        'ALTER TABLE "BOOKINGS" DROP CONSTRAINT IF EXISTS "CK_BOOKING_STATUS"'
    )
    op.execute(
        'ALTER TABLE "BOOKINGS" ADD CONSTRAINT "CK_BOOKING_STATUS" CHECK (status IN '
        "('CONFIRMED','PAYMENT_AUTHORIZED','PAYMENT_FAILED','CANCELLED',"
        " 'ON_THE_WAY','ARRIVED','AT_LOCATION','WORK_STARTED','WORK_COMPLETED','COMPLETED'))"
    )


def downgrade() -> None:
    op.execute(
        'ALTER TABLE "BOOKINGS" DROP CONSTRAINT IF EXISTS "CK_BOOKING_STATUS"'
    )
    op.execute(
        'ALTER TABLE "BOOKINGS" ADD CONSTRAINT "CK_BOOKING_STATUS" CHECK (status IN '
        "('CONFIRMED','PAYMENT_AUTHORIZED','PAYMENT_FAILED','CANCELLED'))"
    )
    op.execute('ALTER TABLE "BOOKINGS" DROP COLUMN IF EXISTS arrival_latitude')
    op.execute('ALTER TABLE "BOOKINGS" DROP COLUMN IF EXISTS arrival_longitude')
