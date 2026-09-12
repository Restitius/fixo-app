"""provider ranking

Revision ID: 0049
Revises: 0048
Create Date: 2026-09-12

Stores provider reputation signals — rank score, level, and badges —
computed from KPIs (completion rate, on-time rate, average rating) and
from customer retention (recurring customers, referrals).
"""

from alembic import op

revision = "0049"
down_revision = "0048"


def upgrade() -> None:
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS "PROVIDER_RANKING" (
            "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
            "provider_id" uuid NOT NULL REFERENCES "PROVIDERS"("id") ON DELETE CASCADE,
            "rank_score" integer NOT NULL DEFAULT 0,
            "rank_level" varchar(16) NOT NULL DEFAULT 'bronze',
            "badges" jsonb NOT NULL DEFAULT '[]'::jsonb,
            "completed_jobs" integer NOT NULL DEFAULT 0,
            "recurring_customers" integer NOT NULL DEFAULT 0,
            "referrals" integer NOT NULL DEFAULT 0,
            "avg_completion_rate" numeric(5,2) NOT NULL DEFAULT 0,
            "avg_on_time_rate" numeric(5,2) NOT NULL DEFAULT 0,
            "avg_rating" numeric(3,2) NOT NULL DEFAULT 0,
            "last_computed_at" timestamptz,
            "created_at" timestamptz NOT NULL DEFAULT now(),
            "updated_at" timestamptz NOT NULL DEFAULT now(),
            CONSTRAINT "chk_rank_level" CHECK ("rank_level" IN ('bronze', 'silver', 'gold', 'platinum'))
        );
        """
    )
    op.execute(
        """
        CREATE UNIQUE INDEX IF NOT EXISTS "uq_provider_ranking_provider"
            ON "PROVIDER_RANKING" ("provider_id");
        """
    )
    op.execute(
        """
        CREATE INDEX IF NOT EXISTS "idx_provider_ranking_score"
            ON "PROVIDER_RANKING" ("rank_score" DESC);
        """
    )


def downgrade() -> None:
    op.execute('DROP TABLE IF EXISTS "PROVIDER_RANKING";')