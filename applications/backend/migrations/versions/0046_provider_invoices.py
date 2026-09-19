"""provider invoices

Revision ID: 0046
Revises: 0045
Create Date: 2026-09-12
"""

from alembic import op

revision = "0046"
down_revision = "0045_provider_commission_fees"


def upgrade() -> None:
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS "PROVIDER_INVOICES" (
            "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
            "provider_id" uuid NOT NULL REFERENCES "PROVIDERS"("provider_id") ON DELETE CASCADE,
            "invoice_number" varchar(64) NOT NULL,
            "period_start" date NOT NULL,
            "period_end" date NOT NULL,
            "gross_amount" numeric(14,2) NOT NULL DEFAULT 0,
            "commission_amount" numeric(14,2) NOT NULL DEFAULT 0,
            "tax_amount" numeric(14,2) NOT NULL DEFAULT 0,
            "net_amount" numeric(14,2) NOT NULL DEFAULT 0,
            "currency" varchar(3) NOT NULL DEFAULT 'USD',
            "status" varchar(32) NOT NULL DEFAULT 'issued',
            "issued_at" timestamptz,
            "due_at" timestamptz,
            "paid_at" timestamptz,
            "created_at" timestamptz NOT NULL DEFAULT now(),
            "updated_at" timestamptz NOT NULL DEFAULT now()
        );
        """
    )
    op.execute(
        """
        CREATE UNIQUE INDEX IF NOT EXISTS "uq_provider_invoices_number"
            ON "PROVIDER_INVOICES" ("provider_id", "invoice_number");
        """
    )
    op.execute(
        """
        CREATE INDEX IF NOT EXISTS "idx_provider_invoices_period"
            ON "PROVIDER_INVOICES" ("provider_id", "period_end" DESC);
        """
    )


def downgrade() -> None:
    op.execute('DROP TABLE IF EXISTS "PROVIDER_INVOICES";')