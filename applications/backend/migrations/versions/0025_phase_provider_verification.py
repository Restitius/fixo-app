"""phase provider verification — identity documents + review workflow (Provider Req Phase 5)

Revision ID: 0025_phase_provider_verification
Revises: 0024_provider_business_profile

Adds the provider verification model:
- PROVIDER_DOC_TYPES: governed catalogue of acceptable documents, seeded with
  the nine types named in the requirements (NATIONAL_ID required by default;
  the platform tunes the rest per jurisdiction via data updates).
- PROVIDER_VERIFICATION_DOCUMENTS: one row per uploaded document — type,
  number, front/back image, issue/expiry dates — with the review state
  machine SUBMITTED -> UNDER_REVIEW -> VERIFIED / REJECTED /
  MORE_INFO_REQUIRED (WITHDRAWN = provider soft-delete before review).
Only one ACTIVE document per (provider, doc_type): partial unique index on
deleted_at IS NULL; re-verification is withdraw-then-upload. Reviewer
columns are reserved for platform verification officers (admin module, a
later phase).

Table names are CAPITAL-quoted per project convention. Raw DDL only.
"""
from __future__ import annotations

from alembic import op

revision = "0025_phase_provider_verification"
down_revision = "0024_provider_business_profile"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ------------------------ PROVIDER DOC TYPES -----------------------------
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS "PROVIDER_DOC_TYPES" (
            code        VARCHAR(40)  PRIMARY KEY,
            name        VARCHAR(120) NOT NULL,
            description VARCHAR(300),
            is_required BOOLEAN      NOT NULL DEFAULT FALSE,
            sort_order  SMALLINT     NOT NULL DEFAULT 0
        )
        """
    )
    op.execute(
        """
        INSERT INTO "PROVIDER_DOC_TYPES" (code, name, description, is_required, sort_order) VALUES
            ('NATIONAL_ID',           'National ID',                       'Government-issued national identity card.',        TRUE,  1),
            ('PASSPORT',              'Passport',                          'Valid international passport bio page.',           FALSE, 2),
            ('DRIVING_LICENCE',       'Driving Licence',                   'Valid driving licence, both sides.',               FALSE, 3),
            ('BUSINESS_REGISTRATION', 'Business Registration Certificate', 'Certificate of incorporation or registration.',    FALSE, 4),
            ('PROFESSIONAL_LICENCE',  'Professional Licence',              'Trade- or profession-issued practising licence.',  FALSE, 5),
            ('TRADE_CERTIFICATE',     'Trade Certificate',                 'Accredited trade or vocational certificate.',      FALSE, 6),
            ('INSURANCE',             'Insurance Documentation',           'Public liability or professional indemnity policy.', FALSE, 7),
            ('TAX_CERTIFICATE',       'Tax Certificate',                   'Current tax compliance or clearance certificate.', FALSE, 8),
            ('POLICE_CLEARANCE',      'Police / Background Clearance',     'Criminal record or background check certificate.', FALSE, 9)
        ON CONFLICT (code) DO NOTHING
        """
    )

    # --------------------- PROVIDER VERIFICATION DOCUMENTS -------------------
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS "PROVIDER_VERIFICATION_DOCUMENTS" (
            doc_id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            provider_id     UUID         NOT NULL REFERENCES "PROVIDERS"(provider_id) ON DELETE CASCADE,
            doc_type        VARCHAR(40)  NOT NULL,
            doc_number      VARCHAR(80),
            front_image_url VARCHAR(500) NOT NULL,
            back_image_url  VARCHAR(500),
            issue_date      DATE,
            expiry_date     DATE,
            status          VARCHAR(24)  NOT NULL DEFAULT 'SUBMITTED',
            review_notes    TEXT,
            reviewed_by     UUID,
            reviewed_at     TIMESTAMPTZ,
            deleted_at      TIMESTAMPTZ,
            created_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),
            updated_at      TIMESTAMPTZ  NOT NULL DEFAULT now()
        )
        """
    )
    op.execute(
        'CREATE UNIQUE INDEX IF NOT EXISTS "UX_PROVIDER_VER_DOCS_ACTIVE" '
        'ON "PROVIDER_VERIFICATION_DOCUMENTS" (provider_id, doc_type) '
        'WHERE deleted_at IS NULL'
    )
    op.execute(
        'CREATE INDEX IF NOT EXISTS "IX_PROVIDER_VER_DOCS_STATUS" '
        'ON "PROVIDER_VERIFICATION_DOCUMENTS" (provider_id, status)'
    )


def downgrade() -> None:
    op.execute('DROP TABLE IF EXISTS "PROVIDER_VERIFICATION_DOCUMENTS"')
    op.execute('DROP TABLE IF EXISTS "PROVIDER_DOC_TYPES"')
