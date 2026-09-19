"""provider location optional — progressive registration (Provider Req Phase 1)

Revision ID: 0022_provider_location_optional
Revises: 0021_phase_provider_onboarding

The marketplace-era PROVIDERS table (0007) required city/region because the
public directory only listed location-complete providers. Provider account
registration (Requirement Phase 1) collects identity + credentials only;
location arrives later via onboarding (SERVICE_AREAS). Relax both columns
to nullable so a DRAFT provider can exist before location is known.

Table names are CAPITAL-quoted per project convention. Raw DDL only.
"""
from __future__ import annotations

from alembic import op

revision = "0022_provider_location_optional"
down_revision = "0021_phase_provider_onboarding"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute('ALTER TABLE "PROVIDERS" ALTER COLUMN city DROP NOT NULL')
    op.execute('ALTER TABLE "PROVIDERS" ALTER COLUMN region DROP NOT NULL')


def downgrade() -> None:
    # Location becomes mandatory again: blank out NULLs, restore constraint.
    op.execute('UPDATE "PROVIDERS" SET city = \'\' WHERE city IS NULL')
    op.execute('UPDATE "PROVIDERS" SET region = \'\' WHERE region IS NULL')
    op.execute('ALTER TABLE "PROVIDERS" ALTER COLUMN city SET NOT NULL')
    op.execute('ALTER TABLE "PROVIDERS" ALTER COLUMN region SET NOT NULL')
