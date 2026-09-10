"""phase provider start service — job timer + IN_PROGRESS status (Provider Req Phase 20)

Revision ID: 0036_phase_provider_start_service
Revises: 0035_phase_provider_arrival

Adds the job-timer column (timer_started_at) so hourly jobs can begin their
timer automatically when the provider starts the service, per Requirement
Phase 20 ("For hourly jobs, the job timer can begin automatically").
Expands the BOOKINGS status CHECK constraint to include IN_PROGRESS as a
first-class status (customer mark_started uses STARTED; provider start uses
IN_PROGRESS), keeping all previously allowed statuses.

Table names are CAPITAL-quoted per project convention. Raw DDL only.
"""
from __future__ import annotations

from alembic import op

revision = "0036_provider_start_svc"
down_revision = "0035_phase_provider_arrival"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Job timer anchor (hourly jobs begin their timer automatically on start).
    op.execute('ALTER TABLE "BOOKINGS" ADD COLUMN IF NOT EXISTS timer_started_at TIMESTAMPTZ')

    # Promote IN_PROGRESS to a first-class status.
    # NOTE: 0011 declared the full lifecycle list; 0035 replaced it with a
    # narrower provider-only list that live rows (CLOSED, PAID,
    # CUSTOMER_CONFIRMED, ...) violate. Restore the full lifecycle superset
    # plus IN_PROGRESS so the constraint validates against real data.
    op.execute(
        'ALTER TABLE "BOOKINGS" DROP CONSTRAINT IF EXISTS "CK_BOOKING_STATUS"'
    )
    op.execute(
        'ALTER TABLE "BOOKINGS" ADD CONSTRAINT "CK_BOOKING_STATUS" CHECK (status IN '
        "('CONFIRMED','PAYMENT_AUTHORIZED','ON_THE_WAY','ARRIVED','AT_LOCATION',"
        " 'WORK_STARTED','WORK_COMPLETED','STARTED','IN_PROGRESS',"
        " 'COMPLETION_REQUESTED','CUSTOMER_CONFIRMED','PAID','CLOSED',"
        "'COMPLETED','PAYMENT_FAILED','CANCELLED'))"
    )


def downgrade() -> None:
    op.execute(
        'ALTER TABLE "BOOKINGS" DROP CONSTRAINT IF EXISTS "CK_BOOKING_STATUS"'
    )
    op.execute(
        'ALTER TABLE "BOOKINGS" ADD CONSTRAINT "CK_BOOKING_STATUS" CHECK (status IN '
        "('CONFIRMED','PAYMENT_AUTHORIZED','PAYMENT_FAILED','CANCELLED',"
        " 'ON_THE_WAY','ARRIVED','AT_LOCATION','WORK_STARTED','WORK_COMPLETED',"
        "'COMPLETED'))"
    )
    op.execute('ALTER TABLE "BOOKINGS" DROP COLUMN IF EXISTS timer_started_at')
