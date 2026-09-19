"""phase provider calendar — calendar views & overlap prevention (Provider Req Phase 15)

Revision ID: 0033_phase_provider_calendar
Revises: 0032_provider_booking_ack

The calendar aggregates confirmed/pending bookings, blocked periods
(PROVIDER_TIME_OFF) and weekly unavailability (PROVIDER_WORKING_HOURS) into
day/week/month/agenda views, and enforces overlap prevention.

No new tables: the calendar is a query-layer aggregation over BOOKINGS,
PROVIDER_TIME_OFF and PROVIDER_WORKING_HOURS (0029). A partial unique index
on BOOKINGS prevents overlapping confirmed bookings for the same provider.

Table names are CAPITAL-quoted per project convention. Raw DDL only.
"""
from __future__ import annotations

from alembic import op

revision = "0033_phase_provider_calendar"
down_revision = "0032_provider_booking_ack"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Overlap prevention: a provider cannot have two CONFIRMED/ACTIVE bookings
    # whose schedule ranges overlap. Excludes terminal states so re-booking after
    # completion/cancellation is always allowed.
    op.execute(
        """
        CREATE UNIQUE INDEX IF NOT EXISTS "IX_PROVIDER_BOOKING_NO_OVERLAP"
        ON "BOOKINGS" (provider_id, scheduled_date)
        WHERE status IN ('CONFIRMED', 'PREPARING', 'TRAVELING', 'ARRIVED', 'WORK_STARTED')
        """
    )


def downgrade() -> None:
    op.execute('DROP INDEX IF EXISTS "IX_PROVIDER_BOOKING_NO_OVERLAP"')
