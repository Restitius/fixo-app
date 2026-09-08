"""phase provider availability — working hours & availability (Provider Req Phase 9)

Revision ID: 0029_provider_availability
Revises: 0028_provider_service_areas

- PROVIDER_AVAILABILITY_SETTINGS  1:1 toggles: the ONLINE/OFFLINE switch,
  emergency/same-day/holiday availability, vacation mode + window, timezone.
- PROVIDER_WORKING_HOURS  weekly recurring schedule, one window per day
  (UNIQUE provider_id, day_of_week); is_available = FALSE models the
  "Sunday: Unavailable" row from the requirements.
- PROVIDER_TIME_OFF  temporary unavailable periods (vacations, closures).

Table names are CAPITAL-quoted per project convention. Raw DDL only.
"""
from __future__ import annotations

from alembic import op

revision = "0029_provider_availability"
down_revision = "0028_provider_service_areas"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS "PROVIDER_AVAILABILITY_SETTINGS" (
            provider_id        UUID PRIMARY KEY
                               REFERENCES "PROVIDERS"(provider_id) ON DELETE CASCADE,
            is_online          BOOLEAN NOT NULL DEFAULT FALSE,
            accepts_emergency  BOOLEAN NOT NULL DEFAULT FALSE,
            accepts_same_day   BOOLEAN NOT NULL DEFAULT FALSE,
            accepts_holidays   BOOLEAN NOT NULL DEFAULT FALSE,
            vacation_mode      BOOLEAN NOT NULL DEFAULT FALSE,
            vacation_from      DATE,
            vacation_until     DATE,
            timezone           VARCHAR(60) NOT NULL DEFAULT 'UTC',
            notes              VARCHAR(500),
            created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
        )
        """
    )
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS "PROVIDER_WORKING_HOURS" (
            hours_id     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            provider_id  UUID NOT NULL
                         REFERENCES "PROVIDERS"(provider_id) ON DELETE CASCADE,
            day_of_week  SMALLINT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
            is_available BOOLEAN NOT NULL DEFAULT TRUE,
            start_time   TIME,
            end_time     TIME,
            created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
            CONSTRAINT CK_WORKING_HOURS_WINDOW CHECK (
                is_available = FALSE
                OR (start_time IS NOT NULL AND end_time IS NOT NULL
                    AND start_time < end_time)
            ),
            CONSTRAINT UQ_WORKING_HOURS_DAY UNIQUE (provider_id, day_of_week)
        )
        """
    )
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS "PROVIDER_TIME_OFF" (
            time_off_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            provider_id UUID NOT NULL
                        REFERENCES "PROVIDERS"(provider_id) ON DELETE CASCADE,
            reason      VARCHAR(200),
            starts_at   TIMESTAMPTZ NOT NULL,
            ends_at     TIMESTAMPTZ NOT NULL,
            created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
            CONSTRAINT CK_TIME_OFF_RANGE CHECK (ends_at > starts_at)
        )
        """
    )
    op.execute(
        'CREATE INDEX IF NOT EXISTS "IX_PROVIDER_TIME_OFF_PROVIDER" '
        'ON "PROVIDER_TIME_OFF" (provider_id, starts_at)'
    )


def downgrade() -> None:
    op.execute('DROP TABLE IF EXISTS "PROVIDER_TIME_OFF"')
    op.execute('DROP TABLE IF EXISTS "PROVIDER_WORKING_HOURS"')
    op.execute('DROP TABLE IF EXISTS "PROVIDER_AVAILABILITY_SETTINGS"')
