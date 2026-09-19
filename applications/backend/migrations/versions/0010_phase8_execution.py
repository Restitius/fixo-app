"""phase8 service execution — progress states, change requests.

Revision ID: 0010_phase8_execution
Revises: 0009_phase7_active_booking
"""
from __future__ import annotations

from alembic import op

revision = "0010_phase8_execution"
down_revision = "0009_phase7_active_booking"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Execution timestamps on the booking aggregate.
    op.execute('ALTER TABLE "BOOKINGS" ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ')
    op.execute('ALTER TABLE "BOOKINGS" ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ')

    # ---------------------------- CHANGE REQUESTS ----------------------------
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS "CHANGE_REQUESTS" (
            change_id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            booking_id     UUID         NOT NULL REFERENCES "BOOKINGS"(booking_id) ON DELETE CASCADE,
            requested_by   VARCHAR(10)  NOT NULL,
            change_type    VARCHAR(10)  NOT NULL,
            current_value  VARCHAR(255),
            proposed_value VARCHAR(500) NOT NULL,
            reason         VARCHAR(500),
            status         VARCHAR(10)  NOT NULL DEFAULT 'PROPOSED',
            decided_at     TIMESTAMPTZ,
            created_at     TIMESTAMPTZ  NOT NULL DEFAULT now()
        )
        """
    )
    op.execute('ALTER TABLE "CHANGE_REQUESTS" DROP CONSTRAINT IF EXISTS "CK_CHANGE_BY"')
    op.execute(
        'ALTER TABLE "CHANGE_REQUESTS" ADD CONSTRAINT "CK_CHANGE_BY" '
        "CHECK (requested_by IN ('CUSTOMER', 'PROVIDER'))"
    )
    op.execute('ALTER TABLE "CHANGE_REQUESTS" DROP CONSTRAINT IF EXISTS "CK_CHANGE_TYPE"')
    op.execute(
        'ALTER TABLE "CHANGE_REQUESTS" ADD CONSTRAINT "CK_CHANGE_TYPE" '
        "CHECK (change_type IN ('SCOPE', 'TIME', 'PRICE'))"
    )
    op.execute('ALTER TABLE "CHANGE_REQUESTS" DROP CONSTRAINT IF EXISTS "CK_CHANGE_STATUS"')
    op.execute(
        'ALTER TABLE "CHANGE_REQUESTS" ADD CONSTRAINT "CK_CHANGE_STATUS" '
        "CHECK (status IN ('PROPOSED', 'APPROVED', 'DECLINED'))"
    )
    op.execute(
        'CREATE INDEX IF NOT EXISTS "IX_CHANGE_BOOKING" '
        'ON "CHANGE_REQUESTS" (booking_id, status)'
    )

    # ------------------- Workflow states for Phase 8 --------------------------
    op.execute('ALTER TABLE "BOOKINGS" DROP CONSTRAINT IF EXISTS "CK_BOOKING_STATUS"')
    op.execute(
        'ALTER TABLE "BOOKINGS" ADD CONSTRAINT "CK_BOOKING_STATUS" '
        "CHECK (status IN ('CONFIRMED','PAYMENT_AUTHORIZED','ON_THE_WAY','ARRIVED',"
        "'STARTED','IN_PROGRESS','COMPLETION_REQUESTED','CUSTOMER_CONFIRMED',"
        "'PAYMENT_FAILED','CANCELLED'))"
    )


def downgrade() -> None:
    op.execute('DROP TABLE IF EXISTS "CHANGE_REQUESTS"')
    op.execute('ALTER TABLE "BOOKINGS" DROP COLUMN IF EXISTS completed_at')
    op.execute('ALTER TABLE "BOOKINGS" DROP COLUMN IF EXISTS started_at')