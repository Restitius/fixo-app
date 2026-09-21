"""phase7 active booking — messaging, tracking, notifications, arrival.

Revision ID: 0009_phase7_active_booking
Revises: 0008_phase6_bookings
"""
from __future__ import annotations

from alembic import op

revision = "0009_phase7_active_booking"
down_revision = "0008_phase6_bookings"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ----------------------------- CONVERSATIONS ----------------------------
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS "CONVERSATIONS" (
            conversation_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            booking_id      UUID NOT NULL UNIQUE REFERENCES "BOOKINGS"(booking_id) ON DELETE CASCADE,
            customer_id     UUID NOT NULL REFERENCES "CUSTOMERS"(customer_id) ON DELETE CASCADE,
            provider_id     UUID NOT NULL REFERENCES "PROVIDERS"(provider_id) ON DELETE CASCADE,
            created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
        )
        """
    )

    # -------------------------------- MESSAGES --------------------------------
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS "MESSAGES" (
            message_id     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            conversation_id UUID        NOT NULL REFERENCES "CONVERSATIONS"(conversation_id) ON DELETE CASCADE,
            sender_role    VARCHAR(10)  NOT NULL,
            sender_id      UUID         NOT NULL,
            body           VARCHAR(2000) NOT NULL,
            read_at        TIMESTAMPTZ,
            created_at     TIMESTAMPTZ  NOT NULL DEFAULT now()
        )
        """
    )
    op.execute('ALTER TABLE "MESSAGES" DROP CONSTRAINT IF EXISTS "CK_MESSAGE_ROLE"')
    op.execute(
        'ALTER TABLE "MESSAGES" ADD CONSTRAINT "CK_MESSAGE_ROLE" '
        "CHECK (sender_role IN ('CUSTOMER', 'PROVIDER'))"
    )
    op.execute(
        'CREATE INDEX IF NOT EXISTS "IX_MESSAGES_CONVERSATION" '
        'ON "MESSAGES" (conversation_id, created_at)'
    )

    # --------------------------- PROVIDER LOCATIONS ---------------------------
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS "PROVIDER_LOCATIONS" (
            location_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            booking_id  UUID         NOT NULL REFERENCES "BOOKINGS"(booking_id) ON DELETE CASCADE,
            latitude    NUMERIC(9,6) NOT NULL,
            longitude   NUMERIC(9,6) NOT NULL,
            recorded_at TIMESTAMPTZ  NOT NULL DEFAULT now()
        )
        """
    )
    op.execute('CREATE INDEX IF NOT EXISTS "IX_TRACK_BOOKING" ON "PROVIDER_LOCATIONS" (booking_id, recorded_at DESC)')

    # ------------------------ CUSTOMER NOTIFICATIONS --------------------------
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS "CUSTOMER_NOTIFICATIONS" (
            notification_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            customer_id     UUID         NOT NULL REFERENCES "CUSTOMERS"(customer_id) ON DELETE CASCADE,
            type            VARCHAR(40)  NOT NULL,
            title           VARCHAR(160) NOT NULL,
            body            VARCHAR(500),
            ref_type        VARCHAR(20),
            ref_id          VARCHAR(64),
            read_at         TIMESTAMPTZ,
            created_at      TIMESTAMPTZ  NOT NULL DEFAULT now()
        )
        """
    )
    op.execute(
        'CREATE INDEX IF NOT EXISTS "IX_NOTIFICATIONS_CUSTOMER" '
        'ON "CUSTOMER_NOTIFICATIONS" (customer_id, created_at DESC)'
    )

    # ------------------- BOOKING: arrival tracking columns --------------------
    op.execute('ALTER TABLE "BOOKINGS" ADD COLUMN IF NOT EXISTS arrival_code VARCHAR(6)')
    op.execute('ALTER TABLE "BOOKINGS" ADD COLUMN IF NOT EXISTS arrived_at TIMESTAMPTZ')
    op.execute('ALTER TABLE "BOOKINGS" ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ')

    # -------------------- Workflow states for Phase 7 --------------------------
    op.execute('ALTER TABLE "BOOKINGS" DROP CONSTRAINT IF EXISTS "CK_BOOKING_STATUS"')
    op.execute(
        'ALTER TABLE "BOOKINGS" ADD CONSTRAINT "CK_BOOKING_STATUS" '
        "CHECK (status IN ('CONFIRMED','PAYMENT_AUTHORIZED','ON_THE_WAY','ARRIVED',"
        "'PAYMENT_FAILED','CANCELLED'))"
    )


def downgrade() -> None:
    op.execute('DROP TABLE IF EXISTS "CUSTOMER_NOTIFICATIONS"')
    op.execute('DROP TABLE IF EXISTS "PROVIDER_LOCATIONS"')
    op.execute('DROP TABLE IF EXISTS "MESSAGES"')
    op.execute('DROP TABLE IF EXISTS "CONVERSATIONS"')
    op.execute('ALTER TABLE "BOOKINGS" DROP COLUMN IF EXISTS verified_at')
    op.execute('ALTER TABLE "BOOKINGS" DROP COLUMN IF EXISTS arrived_at')
    op.execute('ALTER TABLE "BOOKINGS" DROP COLUMN IF EXISTS arrival_code')