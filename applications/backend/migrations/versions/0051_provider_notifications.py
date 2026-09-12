"""provider notifications

Revision ID: 0051
Revises: 0050
Create Date: 2026-09-12

Stores provider-facing notifications with channel, category, title, body,
read state, reference pointers, and timestamps.
"""

from alembic import op

revision = "0051"
down_revision = "0050"


def upgrade() -> None:
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS "PROVIDER_NOTIFICATIONS" (
            "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
            "provider_id" uuid NOT NULL REFERENCES "PROVIDERS"("id") ON DELETE CASCADE,
            "channel" varchar(32) NOT NULL DEFAULT 'in_app',
            "category" varchar(64) NOT NULL,
            "title" varchar(256) NOT NULL,
            "body" text,
            "is_read" boolean NOT NULL DEFAULT false,
            "reference_type" varchar(64),
            "reference_id" uuid,
            "created_at" timestamptz NOT NULL DEFAULT now(),
            "updated_at" timestamptz NOT NULL DEFAULT now()
        );
        """
    )
    op.execute(
        """
        CREATE INDEX IF NOT EXISTS "idx_notifications_provider"
            ON "PROVIDER_NOTIFICATIONS" ("provider_id", "created_at" DESC);
        """
    )
    op.execute(
        """
        CREATE INDEX IF NOT EXISTS "idx_notifications_unread"
            ON "PROVIDER_NOTIFICATIONS" ("provider_id", "is_read", "created_at" DESC)
            WHERE "is_read" = false;
        """
    )
    op.execute(
        """
        CREATE UNIQUE INDEX IF NOT EXISTS "uq_notifications_reference"
            ON "PROVIDER_NOTIFICATIONS" ("provider_id", "reference_type", "reference_id")
            WHERE "reference_type" IS NOT NULL AND "reference_id" IS NOT NULL;
        """
    )


def downgrade() -> None:
    op.execute('DROP TABLE IF EXISTS "PROVIDER_NOTIFICATIONS";')