"""Add BOOKING_JOB_REVIEWS — customer sign-off / approval evidence (Provider Phase 26).

Recorded against the booking AFTER the customer has received
"Provider has completed the job." (status COMPLETION_REQUESTED). Captures
the digital signature / completion PIN / app confirmation + approval
evidence, customer, provider, date/time, booking — reduces disputes.

One approval record per booking (UNIQUE). The status transition
COMPLETION_REQUESTED -> CUSTOMER_CONFIRMED stays in the customer-domain
CompletionService; this table only records the approval evidence.
"""
from __future__ import annotations

from alembic import op
from sqlalchemy import text

revision = "0042_provider_job_reviews"
down_revision = "0041_provider_job_completion"
branch_labels: list[str] = []
depends_on: list[str] | None = None


def upgrade() -> None:
    # Table.
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS "BOOKING_JOB_REVIEWS" (
            "review_id"         uuid            NOT NULL DEFAULT gen_random_uuid(),
            "booking_id"        uuid            NOT NULL,
            "provider_id"       uuid            NOT NULL,
            "customer_id"       uuid            NOT NULL,
            "sign_off"          varchar(30)    NOT NULL,
            "approval_evidence" text            NOT NULL DEFAULT '',
            "signed_at"         timestamptz    NOT NULL DEFAULT now(),
            "recorded_at"       timestamptz    NOT NULL DEFAULT now(),

            CONSTRAINT "PK_BOOKING_JOB_REVIEWS" PRIMARY KEY ("review_id"),
            CONSTRAINT "UQ_BOOKING_JOB_REVIEWS_BOOKING" UNIQUE ("booking_id"),
            CONSTRAINT "CK_BOOKING_JOB_REVIEWS_SIGN_OFF"
                CHECK ("sign_off" IN ('DIGITAL_SIGNATURE','COMPLETION_PIN','APP_CONFIRMATION'))
        )
        """
    )

    # Foreign keys — one op.execute per statement (asyncpg cannot prepare
    # multiple statements in a single call).
    op.execute(text(
        'ALTER TABLE "BOOKING_JOB_REVIEWS" ADD CONSTRAINT "FK_BOOKING_JOB_REVIEWS_BOOKING" '
        'FOREIGN KEY ("booking_id") REFERENCES "BOOKINGS" ("booking_id") ON DELETE CASCADE'
    ))
    op.execute(text(
        'ALTER TABLE "BOOKING_JOB_REVIEWS" ADD CONSTRAINT "FK_BOOKING_JOB_REVIEWS_PROVIDER" '
        'FOREIGN KEY ("provider_id") REFERENCES "PROVIDERS" ("provider_id") ON DELETE CASCADE'
    ))
    op.execute(text(
        'ALTER TABLE "BOOKING_JOB_REVIEWS" ADD CONSTRAINT "FK_BOOKING_JOB_REVIEWS_CUSTOMER" '
        'FOREIGN KEY ("customer_id") REFERENCES "CUSTOMERS" ("customer_id") ON DELETE CASCADE'
    ))

    # Indexes.
    op.execute(
        'CREATE INDEX IF NOT EXISTS "IX_BOOKING_JOB_REVIEWS_BOOKING" '
        'ON "BOOKING_JOB_REVIEWS" ("booking_id")'
    )
    op.execute(
        'CREATE INDEX IF NOT EXISTS "IX_BOOKING_JOB_REVIEWS_PROVIDER_STATUS" '
        'ON "BOOKING_JOB_REVIEWS" ("provider_id", "booking_id")'
    )


def downgrade() -> None:
    op.execute('DROP TABLE IF EXISTS "BOOKING_JOB_REVIEWS"')
