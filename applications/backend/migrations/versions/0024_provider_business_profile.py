"""phase provider business profile — company details, 1:1 (Provider Req Phase 4)

Revision ID: 0024_provider_business_profile
Revises: 0023_phase_provider_profile

A provider account operated through a company carries ONE business profile:
identity (name / logo / registration / tax), contact, location, description,
year established, headcount, website and social profiles. Team members under
the same provider account arrive with the team phase — this is the company
record they will belong to.

Table names are CAPITAL-quoted per project convention. Raw DDL only.
"""
from __future__ import annotations

from alembic import op

revision = "0024_provider_business_profile"
down_revision = "0023_phase_provider_profile"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS "PROVIDER_BUSINESS_PROFILES" (
            business_id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            provider_id         UUID         NOT NULL UNIQUE REFERENCES "PROVIDERS"(provider_id) ON DELETE CASCADE,
            business_name       VARCHAR(160) NOT NULL,
            logo_url            VARCHAR(500),
            registration_number VARCHAR(80),
            tax_number          VARCHAR(80),
            business_email      VARCHAR(180),
            business_phone      VARCHAR(20),
            address             VARCHAR(300),
            city                VARCHAR(80),
            region              VARCHAR(80),
            country             VARCHAR(80),
            description         VARCHAR(2000),
            year_established    SMALLINT,
            num_employees       INTEGER,
            website             VARCHAR(300),
            social              JSONB        NOT NULL DEFAULT '{}'::jsonb,
            created_at          TIMESTAMPTZ  NOT NULL DEFAULT now(),
            updated_at          TIMESTAMPTZ  NOT NULL DEFAULT now()
        )
        """
    )
    op.execute(
        'CREATE INDEX IF NOT EXISTS "IX_PROVIDER_BUSINESS_NAME" '
        'ON "PROVIDER_BUSINESS_PROFILES" (business_name)'
    )


def downgrade() -> None:
    op.execute('DROP TABLE IF EXISTS "PROVIDER_BUSINESS_PROFILES"')
