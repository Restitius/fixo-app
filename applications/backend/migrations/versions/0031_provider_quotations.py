"""phase provider quotations — professional quotation submission (Provider Req Phase 13)

Revision ID: 0031_provider_quotations
Revises: 0030_provider_request_responses

Extends the marketplace QUOTATIONS row into a professional quotation:
itemised costs (labour, materials, transport, inspection, additional),
taxes, discount, platform fee (optional), total (the existing amount column),
estimated duration, proposed start date, notes and terms. Adds the full
lifecycle statuses (Draft → Submitted → Viewed → Accepted/Rejected/
Expired/Withdrawn) while keeping the legacy DECLINED value allowed for
existing customer-flow compatibility. Provider-supplied photos/attachments
live in QUOTATION_ATTACHMENTS.

Table names are CAPITAL-quoted per project convention. Raw DDL only.
"""
from __future__ import annotations

from alembic import op

revision = "0031_provider_quotations"
down_revision = "0030_provider_request_responses"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ----------------------- PROFESSIONAL BREAKDOWN -------------------------
    op.execute('ALTER TABLE "QUOTATIONS" ADD COLUMN IF NOT EXISTS labour_cost NUMERIC(10,2)')
    op.execute('ALTER TABLE "QUOTATIONS" ADD COLUMN IF NOT EXISTS materials_cost NUMERIC(10,2)')
    op.execute('ALTER TABLE "QUOTATIONS" ADD COLUMN IF NOT EXISTS transport_cost NUMERIC(10,2)')
    op.execute('ALTER TABLE "QUOTATIONS" ADD COLUMN IF NOT EXISTS inspection_fee NUMERIC(10,2)')
    op.execute(
        'ALTER TABLE "QUOTATIONS" ADD COLUMN IF NOT EXISTS additional_charges NUMERIC(10,2)'
    )
    op.execute('ALTER TABLE "QUOTATIONS" ADD COLUMN IF NOT EXISTS tax_amount NUMERIC(10,2)')
    op.execute('ALTER TABLE "QUOTATIONS" ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(10,2)')
    op.execute('ALTER TABLE "QUOTATIONS" ADD COLUMN IF NOT EXISTS platform_fee NUMERIC(10,2)')
    op.execute('ALTER TABLE "QUOTATIONS" ADD COLUMN IF NOT EXISTS estimated_hours SMALLINT')
    op.execute('ALTER TABLE "QUOTATIONS" ADD COLUMN IF NOT EXISTS proposed_start_date DATE')
    op.execute('ALTER TABLE "QUOTATIONS" ADD COLUMN IF NOT EXISTS notes TEXT')
    op.execute('ALTER TABLE "QUOTATIONS" ADD COLUMN IF NOT EXISTS terms TEXT')
    op.execute('ALTER TABLE "QUOTATIONS" ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMPTZ')
    op.execute('ALTER TABLE "QUOTATIONS" ADD COLUMN IF NOT EXISTS viewed_at TIMESTAMPTZ')
    op.execute(
        'ALTER TABLE "QUOTATIONS" ADD COLUMN IF NOT EXISTS updated_at '
        "TIMESTAMPTZ NOT NULL DEFAULT now()"
    )

    op.execute(
        'CREATE INDEX IF NOT EXISTS "IX_QUOTES_PROVIDER" '
        'ON "QUOTATIONS" (provider_id, created_at)'
    )

    # ------------------------- LIFECYCLE STATUSES ---------------------------
    op.execute('ALTER TABLE "QUOTATIONS" DROP CONSTRAINT IF EXISTS "CK_QUOTE_STATUS"')
    op.execute(
        'ALTER TABLE "QUOTATIONS" ADD CONSTRAINT "CK_QUOTE_STATUS" '
        "CHECK (status IN ('DRAFT', 'SUBMITTED', 'VIEWED', 'ACCEPTED', "
        "'DECLINED', 'REJECTED', 'EXPIRED', 'WITHDRAWN'))"
    )

    # ------------------------ PHOTOS & ATTACHMENTS --------------------------
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS "QUOTATION_ATTACHMENTS" (
            attachment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            quote_id      UUID NOT NULL
                          REFERENCES "QUOTATIONS"(quote_id) ON DELETE CASCADE,
            provider_id   UUID NOT NULL
                          REFERENCES "PROVIDERS"(provider_id) ON DELETE CASCADE,
            kind          VARCHAR(10) NOT NULL,
            url           VARCHAR(500) NOT NULL,
            label         VARCHAR(160),
            created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
            CONSTRAINT CK_QUOTE_ATTACH_KIND CHECK (kind IN ('PHOTO', 'DOCUMENT'))
        )
        """
    )
    op.execute(
        'CREATE INDEX IF NOT EXISTS "IX_QUOTATION_ATTACHMENTS_QUOTE" '
        'ON "QUOTATION_ATTACHMENTS" (quote_id)'
    )


def downgrade() -> None:
    op.execute('DROP TABLE IF EXISTS "QUOTATION_ATTACHMENTS"')
    op.execute(
        'ALTER TABLE "QUOTATIONS" DROP CONSTRAINT IF EXISTS "CK_QUOTE_STATUS"'
    )
    op.execute(
        'ALTER TABLE "QUOTATIONS" ADD CONSTRAINT "CK_QUOTE_STATUS" '
        "CHECK (status IN ('SUBMITTED', 'ACCEPTED', 'DECLINED', 'EXPIRED', 'WITHDRAWN'))"
    )
    for col in (
        "labour_cost", "materials_cost", "transport_cost", "inspection_fee",
        "additional_charges", "tax_amount", "discount_amount", "platform_fee",
        "estimated_hours", "proposed_start_date", "notes", "terms",
        "submitted_at", "viewed_at", "updated_at",
    ):
        op.execute(f'ALTER TABLE "QUOTATIONS" DROP COLUMN IF EXISTS "{col}"')