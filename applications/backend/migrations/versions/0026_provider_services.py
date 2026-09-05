"""phase provider services — per-service configuration + approval gate (Provider Req Phase 6)

Revision ID: 0026_provider_services
Revises: 0025_phase_provider_verification

Extends the marketplace junction PROVIDER_SERVICES (0007) into a full
per-service configuration: display/description overrides, experience,
pricing model (FIXED/HOURLY/QUOTED), minimum charge, duration, emergency
availability, tools, materials, warranty and photos — plus a platform
approval lifecycle (DRAFT -> PENDING_APPROVAL -> APPROVED/REJECTED,
ARCHIVED on removal) so only approved services receive requests.

Marketplace-era rows were already customer-visible: they are grandfathered
as APPROVED/FIXED so existing directory behaviour is unchanged.

Table names are CAPITAL-quoted per project convention. Raw DDL only.
"""
from __future__ import annotations

from alembic import op

revision = "0026_provider_services"
down_revision = "0025_phase_provider_verification"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ----------------- PROVIDER_SERVICES: configuration columns -----------------
    op.execute('ALTER TABLE "PROVIDER_SERVICES" ADD COLUMN IF NOT EXISTS display_name VARCHAR(160)')
    op.execute('ALTER TABLE "PROVIDER_SERVICES" ADD COLUMN IF NOT EXISTS description VARCHAR(1000)')
    op.execute('ALTER TABLE "PROVIDER_SERVICES" ADD COLUMN IF NOT EXISTS years_experience SMALLINT')
    op.execute(
        'ALTER TABLE "PROVIDER_SERVICES" ADD COLUMN IF NOT EXISTS pricing_model '
        "VARCHAR(20) NOT NULL DEFAULT 'QUOTED'"
    )
    op.execute('ALTER TABLE "PROVIDER_SERVICES" ADD COLUMN IF NOT EXISTS minimum_charge NUMERIC(10,2)')
    op.execute('ALTER TABLE "PROVIDER_SERVICES" ADD COLUMN IF NOT EXISTS duration_minutes INTEGER')
    op.execute(
        'ALTER TABLE "PROVIDER_SERVICES" ADD COLUMN IF NOT EXISTS is_emergency_available '
        "BOOLEAN NOT NULL DEFAULT FALSE"
    )
    op.execute('ALTER TABLE "PROVIDER_SERVICES" ADD COLUMN IF NOT EXISTS tools JSONB')
    op.execute('ALTER TABLE "PROVIDER_SERVICES" ADD COLUMN IF NOT EXISTS materials JSONB')
    op.execute('ALTER TABLE "PROVIDER_SERVICES" ADD COLUMN IF NOT EXISTS warranty JSONB')
    op.execute('ALTER TABLE "PROVIDER_SERVICES" ADD COLUMN IF NOT EXISTS photos JSONB')
    op.execute(
        'ALTER TABLE "PROVIDER_SERVICES" ADD COLUMN IF NOT EXISTS status '
        "VARCHAR(24) NOT NULL DEFAULT 'DRAFT'"
    )
    op.execute('ALTER TABLE "PROVIDER_SERVICES" ADD COLUMN IF NOT EXISTS reviewed_by UUID')
    op.execute('ALTER TABLE "PROVIDER_SERVICES" ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ')
    op.execute('ALTER TABLE "PROVIDER_SERVICES" ADD COLUMN IF NOT EXISTS review_notes VARCHAR(500)')
    op.execute('ALTER TABLE "PROVIDER_SERVICES" ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ')
    op.execute('ALTER TABLE "PROVIDER_SERVICES" ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ')

    # --------------------- grandfather marketplace-era rows ---------------------
    op.execute(
        'UPDATE "PROVIDER_SERVICES" SET status = \'APPROVED\' '
        "WHERE status = 'DRAFT' AND created_at IS NULL"
    )
    op.execute(
        'UPDATE "PROVIDER_SERVICES" SET pricing_model = \'FIXED\' '
        "WHERE pricing_model = 'QUOTED' AND base_amount IS NOT NULL"
    )
    op.execute(
        'UPDATE "PROVIDER_SERVICES" SET created_at = now(), updated_at = now() '
        "WHERE created_at IS NULL"
    )

    # QUOTED services carry no fixed base amount (readers treat NULL as quote-based).
    op.execute('ALTER TABLE "PROVIDER_SERVICES" ALTER COLUMN base_amount DROP NOT NULL')

    op.execute(
        'CREATE INDEX IF NOT EXISTS "IX_PROVIDER_SERVICES_STATUS" '
        'ON "PROVIDER_SERVICES" (status)'
    )
    op.execute(
        'CREATE INDEX IF NOT EXISTS "IX_PROVIDER_SERVICES_SERVICE" '
        'ON "PROVIDER_SERVICES" (service_id)'
    )


def downgrade() -> None:
    op.execute('DROP INDEX IF EXISTS "IX_PROVIDER_SERVICES_SERVICE"')
    op.execute('DROP INDEX IF EXISTS "IX_PROVIDER_SERVICES_STATUS"')
    op.execute('UPDATE "PROVIDER_SERVICES" SET base_amount = 0 WHERE base_amount IS NULL')
    op.execute('ALTER TABLE "PROVIDER_SERVICES" ALTER COLUMN base_amount SET NOT NULL')
    op.execute('ALTER TABLE "PROVIDER_SERVICES" DROP COLUMN IF EXISTS updated_at')
    op.execute('ALTER TABLE "PROVIDER_SERVICES" DROP COLUMN IF EXISTS created_at')
    op.execute('ALTER TABLE "PROVIDER_SERVICES" DROP COLUMN IF EXISTS review_notes')
    op.execute('ALTER TABLE "PROVIDER_SERVICES" DROP COLUMN IF EXISTS reviewed_at')
    op.execute('ALTER TABLE "PROVIDER_SERVICES" DROP COLUMN IF EXISTS reviewed_by')
    op.execute('ALTER TABLE "PROVIDER_SERVICES" DROP COLUMN IF EXISTS status')
    op.execute('ALTER TABLE "PROVIDER_SERVICES" DROP COLUMN IF EXISTS photos')
    op.execute('ALTER TABLE "PROVIDER_SERVICES" DROP COLUMN IF EXISTS warranty')
    op.execute('ALTER TABLE "PROVIDER_SERVICES" DROP COLUMN IF EXISTS materials')
    op.execute('ALTER TABLE "PROVIDER_SERVICES" DROP COLUMN IF EXISTS tools')
    op.execute('ALTER TABLE "PROVIDER_SERVICES" DROP COLUMN IF EXISTS is_emergency_available')
    op.execute('ALTER TABLE "PROVIDER_SERVICES" DROP COLUMN IF EXISTS duration_minutes')
    op.execute('ALTER TABLE "PROVIDER_SERVICES" DROP COLUMN IF EXISTS minimum_charge')
    op.execute('ALTER TABLE "PROVIDER_SERVICES" DROP COLUMN IF EXISTS pricing_model')
    op.execute('ALTER TABLE "PROVIDER_SERVICES" DROP COLUMN IF EXISTS years_experience')
    op.execute('ALTER TABLE "PROVIDER_SERVICES" DROP COLUMN IF EXISTS description')
    op.execute('ALTER TABLE "PROVIDER_SERVICES" DROP COLUMN IF EXISTS display_name')
