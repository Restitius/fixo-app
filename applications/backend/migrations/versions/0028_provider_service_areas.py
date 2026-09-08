"""phase provider service areas — where providers operate (Provider Req Phase 8)

Revision ID: 0028_provider_service_areas
Revises: 0027_provider_pricing

Provider-side service-area configuration feeding the matching engine:
- PROVIDER_AREA_SETTINGS   1:1 travel policy + base location (max travel
  distance, travel fee, free travel radius).
- PROVIDER_SERVICE_AREAS   area entries, either LOCATION-based
  (country/region/city/district/ward/neighborhood) or RADIUS-based
  ("within N km of my location"), enforced by CHECK constraints.
- PROVIDER_AREA_EXCLUSIONS areas the provider explicitly does not serve.

Table names are CAPITAL-quoted per project convention. Raw DDL only.
"""
from __future__ import annotations

from alembic import op

revision = "0028_provider_service_areas"
down_revision = "0027_provider_pricing"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS "PROVIDER_AREA_SETTINGS" (
            provider_id            UUID PRIMARY KEY
                                   REFERENCES "PROVIDERS"(provider_id) ON DELETE CASCADE,
            base_latitude          NUMERIC(9,6),
            base_longitude         NUMERIC(9,6),
            max_travel_km          NUMERIC(6,2),
            travel_fee             NUMERIC(10,2) NOT NULL DEFAULT 0,
            free_travel_radius_km  NUMERIC(6,2),
            currency               VARCHAR(8)    NOT NULL DEFAULT 'TZS',
            notes                  VARCHAR(500),
            created_at             TIMESTAMPTZ   NOT NULL DEFAULT now(),
            updated_at             TIMESTAMPTZ   NOT NULL DEFAULT now(),
            CONSTRAINT CK_AREA_SETTINGS_POS CHECK (
                (max_travel_km IS NULL OR max_travel_km > 0)
                AND travel_fee >= 0
                AND (free_travel_radius_km IS NULL OR free_travel_radius_km >= 0)
            )
        )
        """
    )
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS "PROVIDER_SERVICE_AREAS" (
            area_id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            provider_id      UUID NOT NULL
                             REFERENCES "PROVIDERS"(provider_id) ON DELETE CASCADE,
            area_type        VARCHAR(10) NOT NULL,
            label            VARCHAR(120),
            country          VARCHAR(80),
            region           VARCHAR(80),
            city             VARCHAR(80),
            district         VARCHAR(80),
            ward             VARCHAR(80),
            neighborhood     VARCHAR(80),
            center_latitude  NUMERIC(9,6),
            center_longitude NUMERIC(9,6),
            radius_km        NUMERIC(6,2),
            is_active        BOOLEAN NOT NULL DEFAULT TRUE,
            created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
            CONSTRAINT CK_AREA_TYPE CHECK (area_type IN ('LOCATION', 'RADIUS')),
            CONSTRAINT CK_AREA_RADIUS CHECK (
                area_type <> 'RADIUS'
                OR (center_latitude IS NOT NULL AND center_longitude IS NOT NULL
                    AND radius_km IS NOT NULL AND radius_km > 0)
            ),
            CONSTRAINT CK_AREA_LOCATION CHECK (
                area_type <> 'LOCATION'
                OR (country IS NOT NULL OR region IS NOT NULL OR city IS NOT NULL)
            )
        )
        """
    )
    op.execute(
        'CREATE INDEX IF NOT EXISTS "IX_PROVIDER_AREAS_PROVIDER" '
        'ON "PROVIDER_SERVICE_AREAS" (provider_id, is_active)'
    )
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS "PROVIDER_AREA_EXCLUSIONS" (
            exclusion_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            provider_id  UUID NOT NULL
                         REFERENCES "PROVIDERS"(provider_id) ON DELETE CASCADE,
            label        VARCHAR(160),
            country      VARCHAR(80),
            region       VARCHAR(80),
            city         VARCHAR(80),
            district     VARCHAR(80),
            ward         VARCHAR(80),
            neighborhood VARCHAR(80),
            created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
            CONSTRAINT CK_AREA_EXCLUSION_SCOPE CHECK (
                label IS NOT NULL OR country IS NOT NULL OR region IS NOT NULL
                OR city IS NOT NULL OR district IS NOT NULL OR ward IS NOT NULL
                OR neighborhood IS NOT NULL
            )
        )
        """
    )
    op.execute(
        'CREATE INDEX IF NOT EXISTS "IX_PROVIDER_AREA_EXCLUSIONS_PROVIDER" '
        'ON "PROVIDER_AREA_EXCLUSIONS" (provider_id)'
    )


def downgrade() -> None:
    op.execute('DROP TABLE IF EXISTS "PROVIDER_AREA_EXCLUSIONS"')
    op.execute('DROP TABLE IF EXISTS "PROVIDER_SERVICE_AREAS"')
    op.execute('DROP TABLE IF EXISTS "PROVIDER_AREA_SETTINGS"')
