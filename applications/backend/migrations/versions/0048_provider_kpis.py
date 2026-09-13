"""provider kpis

Revision ID: 0048
Revises: 0047
Create Date: 2026-09-12
"""

from alembic import op

revision = "0048"
down_revision = "0047"


def upgrade() -> None:
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS "PROVIDER_KPIS" (
            "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
            "provider_id" uuid NOT NULL REFERENCES "PROVIDERS"("provider_id") ON DELETE CASCADE,
            "period" varchar(16) NOT NULL,
            "period_start" date NOT NULL,
            "period_end" date NOT NULL,
            "completion_rate" numeric(5,2) NOT NULL DEFAULT 0,
            "on_time_rate" numeric(5,2) NOT NULL DEFAULT 0,
            "avg_rating" numeric(3,2) NOT NULL DEFAULT 0,
            "response_time_minutes" integer NOT NULL DEFAULT 0,
            "jobs_completed" integer NOT NULL DEFAULT 0,
            "jobs_cancelled" integer NOT NULL DEFAULT 0,
            "revenue" numeric(14,2) NOT NULL DEFAULT 0,
            "created_at" timestamptz NOT NULL DEFAULT now(),
            "updated_at" timestamptz NOT NULL DEFAULT now()
        );
        """
    )
    op.execute(
        """
        CREATE UNIQUE INDEX IF NOT EXISTS "uq_provider_kpis_period"
            ON "PROVIDER_KPIS" ("provider_id", "period", "period_start");
        """
    )
    op.execute(
        """
        CREATE INDEX IF NOT EXISTS "idx_provider_kpis_provider"
            ON "PROVIDER_KPIS" ("provider_id", "period_start" DESC);
        """
    )


def downgrade() -> None:
    op.execute('DROP TABLE IF EXISTS "PROVIDER_KPIS";')