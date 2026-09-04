"""phase provider profile — public profile fields (Provider Req Phase 3)

Revision ID: 0023_phase_provider_profile
Revises: 0022_phase_provider_location_optional

Extends PROVIDERS with the personal + professional profile fields the
provider curates for customers: photo, gender, date of birth, languages,
years of experience, qualifications, certifications, skills,
specializations and tools. Reuses existing columns where they already
carry the meaning: headline (professional title), bio (biography),
jobs_completed (completed projects), rating_avg/rating_count.

Table names are CAPITAL-quoted per project convention. Raw DDL only.
"""
from __future__ import annotations

from alembic import op

revision = "0023_phase_provider_profile"
down_revision = "0022_provider_location_optional"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute('ALTER TABLE "PROVIDERS" ADD COLUMN IF NOT EXISTS profile_photo_url VARCHAR(500)')
    op.execute('ALTER TABLE "PROVIDERS" ADD COLUMN IF NOT EXISTS gender VARCHAR(20)')
    op.execute('ALTER TABLE "PROVIDERS" ADD COLUMN IF NOT EXISTS date_of_birth DATE')
    op.execute('ALTER TABLE "PROVIDERS" ADD COLUMN IF NOT EXISTS languages VARCHAR(200)')
    op.execute(
        'ALTER TABLE "PROVIDERS" ADD COLUMN IF NOT EXISTS years_experience SMALLINT'
    )
    op.execute(
        'ALTER TABLE "PROVIDERS" ADD COLUMN IF NOT EXISTS qualifications '
        "JSONB NOT NULL DEFAULT '[]'::jsonb"
    )
    op.execute(
        'ALTER TABLE "PROVIDERS" ADD COLUMN IF NOT EXISTS certifications '
        "JSONB NOT NULL DEFAULT '[]'::jsonb"
    )
    op.execute(
        'ALTER TABLE "PROVIDERS" ADD COLUMN IF NOT EXISTS skills '
        "JSONB NOT NULL DEFAULT '[]'::jsonb"
    )
    op.execute(
        'ALTER TABLE "PROVIDERS" ADD COLUMN IF NOT EXISTS specializations '
        "JSONB NOT NULL DEFAULT '[]'::jsonb"
    )
    op.execute(
        'ALTER TABLE "PROVIDERS" ADD COLUMN IF NOT EXISTS tools '
        "JSONB NOT NULL DEFAULT '[]'::jsonb"
    )
    op.execute(
        'ALTER TABLE "PROVIDERS" ADD COLUMN IF NOT EXISTS profile_updated_at TIMESTAMPTZ'
    )


def downgrade() -> None:
    for column in (
        "profile_updated_at",
        "tools",
        "specializations",
        "skills",
        "certifications",
        "qualifications",
        "years_experience",
        "languages",
        "date_of_birth",
        "gender",
        "profile_photo_url",
    ):
        op.execute(f'ALTER TABLE "PROVIDERS" DROP COLUMN IF EXISTS "{column}"')
