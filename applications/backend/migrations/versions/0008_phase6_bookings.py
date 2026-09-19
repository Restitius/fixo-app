"""phase6 bookings — bookings, payments, timeline.

Revision ID: 0008_phase6_bookings
Revises: 0007_phase5_marketplace
"""
from __future__ import annotations

from alembic import op

revision = "0008_phase6_bookings"
down_revision = "0007_phase5_marketplace"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ------------------------------- BOOKINGS --------------------------------
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS "BOOKINGS" (
            booking_id     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            booking_number VARCHAR(24)  NOT NULL UNIQUE,
            request_id     UUID         NOT NULL UNIQUE REFERENCES "SERVICE_REQUESTS"(request_id),
            customer_id    UUID         NOT NULL REFERENCES "CUSTOMERS"(customer_id) ON DELETE CASCADE,
            provider_id    UUID         NOT NULL REFERENCES "PROVIDERS"(provider_id),
            quote_id       UUID         NOT NULL REFERENCES "QUOTATIONS"(quote_id),
            service_id     UUID         NOT NULL REFERENCES "SERVICES"(service_id),
            address_id     UUID REFERENCES "CUSTOMER_ADDRESSES"(address_id) ON DELETE SET NULL,
            scheduled_date DATE,
            time_window    VARCHAR(12),
            agreed_amount  NUMERIC(10,2) NOT NULL,
            currency       VARCHAR(3)   NOT NULL DEFAULT 'TZS',
            status         VARCHAR(20)  NOT NULL DEFAULT 'CONFIRMED',
            payment_attempts SMALLINT   NOT NULL DEFAULT 0,
            created_at     TIMESTAMPTZ  NOT NULL DEFAULT now(),
            updated_at     TIMESTAMPTZ  NOT NULL DEFAULT now()
        )
        """
    )
    op.execute(
        'ALTER TABLE "BOOKINGS" DROP CONSTRAINT IF EXISTS "CK_BOOKING_STATUS"'
    )
    op.execute(
        'ALTER TABLE "BOOKINGS" ADD CONSTRAINT "CK_BOOKING_STATUS" '
        "CHECK (status IN ('CONFIRMED','PAYMENT_AUTHORIZED','PAYMENT_FAILED','CANCELLED'))"
    )
    op.execute(
        'CREATE INDEX IF NOT EXISTS "IX_BOOKING_CUSTOMER" ON "BOOKINGS" (customer_id, status)'
    )

    # ------------------------------- PAYMENTS --------------------------------
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS "PAYMENTS" (
            payment_id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            booking_id      UUID         NOT NULL REFERENCES "BOOKINGS"(booking_id) ON DELETE CASCADE,
            attempt_no      SMALLINT     NOT NULL,
            amount          NUMERIC(10,2) NOT NULL,
            currency        VARCHAR(3)   NOT NULL DEFAULT 'TZS',
            status          VARCHAR(12)  NOT NULL DEFAULT 'INITIATED',
            gateway         VARCHAR(20)  NOT NULL DEFAULT 'MOCK',
            gateway_ref     VARCHAR(60),
            failure_reason  VARCHAR(255),
            authorized_at   TIMESTAMPTZ,
            created_at      TIMESTAMPTZ  NOT NULL DEFAULT now()
        )
        """
    )
    op.execute('ALTER TABLE "PAYMENTS" DROP CONSTRAINT IF EXISTS "CK_PAYMENT_STATUS"')
    op.execute(
        'ALTER TABLE "PAYMENTS" ADD CONSTRAINT "CK_PAYMENT_STATUS" '
        "CHECK (status IN ('INITIATED','AUTHORIZED','FAILED'))"
    )

    # ---------------------------- BOOKING TIMELINE ---------------------------
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS "BOOKING_TIMELINE" (
            timeline_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            booking_id  UUID         NOT NULL REFERENCES "BOOKINGS"(booking_id) ON DELETE CASCADE,
            event       VARCHAR(40)  NOT NULL,
            detail      VARCHAR(500),
            created_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
        )
        """
    )
    op.execute('CREATE INDEX IF NOT EXISTS "IX_TIMELINE_BOOKING" ON "BOOKING_TIMELINE" (booking_id, created_at)')

    # -------- Request machine gains CONFIRMED after quote acceptance ---------
    op.execute('ALTER TABLE "SERVICE_REQUESTS" DROP CONSTRAINT IF EXISTS "CK_REQUEST_STATUS"')
    op.execute(
        'ALTER TABLE "SERVICE_REQUESTS" ADD CONSTRAINT "CK_REQUEST_STATUS" '
        "CHECK (status IN ('DRAFT','SUBMITTED','VALIDATING','VALID','MATCHING',"
        "'PROVIDER_SELECTED','QUOTE_ACCEPTED','CONFIRMED','NEEDS_INFORMATION',"
        "'OUTSIDE_SERVICE_AREA','NO_PROVIDER_AVAILABLE','CANCELLED'))"
    )


def downgrade() -> None:
    op.execute('DROP TABLE IF EXISTS "BOOKING_TIMELINE"')
    op.execute('DROP TABLE IF EXISTS "PAYMENTS"')
    op.execute('DROP TABLE IF EXISTS "BOOKINGS"')
    op.execute('ALTER TABLE "SERVICE_REQUESTS" DROP CONSTRAINT IF EXISTS "CK_REQUEST_STATUS"')
    op.execute(
        'ALTER TABLE "SERVICE_REQUESTS" ADD CONSTRAINT "CK_REQUEST_STATUS" '
        "CHECK (status IN ('DRAFT','SUBMITTED','VALIDATING','VALID','MATCHING',"
        "'PROVIDER_SELECTED','QUOTE_ACCEPTED','NEEDS_INFORMATION',"
        "'OUTSIDE_SERVICE_AREA','NO_PROVIDER_AVAILABLE','CANCELLED'))"
    )