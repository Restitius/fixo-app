"""provider portfolio

Revision ID: 0050
Revises: 0049
Create Date: 2026-09-12

Stores provider portfolio items — completed job showcases with title,
description, service category, before/after image references, and
completion date.
"""

from alembic import op

revision = "0050"
down_revision = "0049"


def upgrade() -> None:
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS "PROVIDER_PORTFOLIO" (
            "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
            "provider_id" uuid NOT NULL REFERENCES "PROVIDERS"("id") ON DELETE CASCADE,
            "title" varchar(256) NOT NULL,
            "description" text,
            "service_category" varchar(64),
            "before_image_url" varchar(512),
            "after_image_url" varchar(512),
            "completed_on" date,
            "is_featured" boolean NOT NULL DEFAULT false,
            "status" varchar(32) NOT NULL DEFAULT 'published',
            "created_at" timestamptz NOT NULL DEFAULT now(),
            "updated_at" timestamptz NOT NULL DEFAULT now(),
            CONSTRAINT "chk_portfolio_status" CHECK ("status" IN ('published', 'draft', 'archived'))
        );
        """
    )
    op.execute(
        """
        CREATE INDEX IF NOT EXISTS "idx_portfolio_provider"
            ON "PROVIDER_PORTFOLIO" ("provider_id", "created_at" DESC);
        """
    )
    op.execute(
        """
        CREATE INDEX IF NOT EXISTS "idx_portfolio_featured"
            ON "PROVIDER_PORTFOLIO" ("provider_id", "is_featured" DESC)
            WHERE "is_featured" = true;
        """
    )


def downgrade() -> None:
    op.execute('DROP TABLE IF EXISTS "PROVIDER_PORTFOLIO";')