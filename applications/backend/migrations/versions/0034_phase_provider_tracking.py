"""phase provider tracking — navigation & live location (Provider Req Phase 18)

Revision ID: 0034_phase_provider_tracking
Revises: 0033_phase_provider_calendar

Adds trip tracking fields to BOOKINGS so a provider can start a trip,
stream location updates, and share ETA/distance with the customer.
The PROVIDER_LOCATIONS table (0009) stores the GPS trace; this adds
the live "current position" snapshot on the booking row itself.

Table names are CAPITAL-quoted per project convention. Raw DDL only.
"""
from __future__ import annotations

from alembic import op

revision = "0034_phase_provider_tracking"
down_revision = "0033_phase_provider_calendar"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Trip tracking fields on BOOKINGS (live snapshot, not history).
    op.execute('ALTER TABLE "BOOKINGS" ADD COLUMN IF NOT EXISTS trip_started_at TIMESTAMPTZ')
    op.execute('ALTER TABLE "BOOKINGS" ADD COLUMN IF NOT EXISTS trip_ended_at TIMESTAMPTZ')
    op.execute('ALTER TABLE "BOOKINGS" ADD COLUMN IF NOT EXISTS current_latitude NUMERIC(9,6)')
    op.execute('ALTER TABLE "BOOKINGS" ADD COLUMN IF NOT EXISTS current_longitude NUMERIC(9,6)')
    op.execute('ALTER TABLE "BOOKINGS" ADD COLUMN IF NOT EXISTS eta_minutes INTEGER')
    op.execute(
        'CREATE INDEX IF NOT EXISTS "IX_BOOKING_TRIP" '
        'ON "BOOKINGS" (provider_id, trip_started_at) WHERE trip_started_at IS NOT NULL'
    )


def downgrade() -> None:
    op.execute('DROP INDEX IF EXISTS "IX_BOOKING_TRIP"')
    op.execute('ALTER TABLE "BOOKINGS" DROP COLUMN IF EXISTS trip_started_at')
    op.execute('ALTER TABLE "BOOKINGS" DROP COLUMN IF EXISTS trip_ended_at')
    op.execute('ALTER TABLE "BOOKINGS" DROP COLUMN IF EXISTS current_latitude')
    op.execute('ALTER TABLE "BOOKINGS" DROP COLUMN IF EXISTS current_longitude')
    op.execute('ALTER TABLE "BOOKINGS" DROP COLUMN IF EXISTS eta_minutes')
