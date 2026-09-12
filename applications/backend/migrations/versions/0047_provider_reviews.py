"""provider reviews

Revision ID: 0047
Revises: 0046
Create Date: 2026-09-12
"""

from alembic import op

revision = "0047"
down_revision = "0046"


def upgrade() -> None:
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS "PROVIDER_REVIEWS" (
            "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
            "provider_id" uuid NOT NULL REFERENCES "PROVIDERS"("id") ON DELETE CASCADE,
            "booking_id" uuid,
            "customer_id" uuid NOT NULL,
            "rating" smallint NOT NULL,
            "title" varchar(256),
            "body" text,
            "status" varchar(32) NOT NULL DEFAULT 'published',
            "created_at" timestamptz NOT NULL DEFAULT now(),
            "updated_at" timestamptz NOT NULL DEFAULT now(),
            CONSTRAINT "chk_provider_reviews_rating" CHECK ("rating" BETWEEN 1 AND 5)
        );
        """
    )
    op.execute(
        """
        CREATE INDEX IF NOT EXISTS "idx_provider_reviews_provider"
            ON "PROVIDER_REVIEWS" ("provider_id", "created_at" DESC);
        """
    )
    op.execute(
        """
        CREATE UNIQUE INDEX IF NOT EXISTS "uq_provider_reviews_booking"
            ON "PROVIDER_REVIEWS" ("provider_id", "booking_id")
            WHERE "booking_id" IS NOT NULL;
        """
    )


def downgrade() -> None:
    op.execute('DROP TABLE IF EXISTS "PROVIDER_REVIEWS";')