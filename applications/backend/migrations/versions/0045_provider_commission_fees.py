"""Add PROVIDER_COMMISSION_RATES + PROVIDER_COMMISSION_FEES (Provider Phase 31).

Commission & Fees — gross/commission/tax/net (Requirement Phase 31).

Providers should clearly understand platform deductions. This phase gives the
provider-finance layer:

  - PROVIDER_COMMISSION_RATES — platform commission + tax rate configuration
    scoped to a provider (or a platform default row when the provider has no
    custom configuration). Each rate row stores the commission rate, the tax
    rate applied on the commission, the currency scope and effective dates.

  - PROVIDER_COMMISSION_FEES — one row per commission/fee application event:
    the gross amount, the platform commission, the tax on the commission, the
    resulting net amount, currency, status, references and timestamps. This is
    the audit-immutable record behind the frontend commission/net display.

Same backend discipline as earlier phases: no SQL outside app/queries/**/,
ownership enforced in SQL, services depend only on ports, adapters own query
IDs, side-effects via events where applicable. No background tasks in this
phase — commission/fee application is synchronous through the service layer.

Verification note (Phase 31 backend only):

    cd applications/backend && python -m pytest -q

should stay green with the new commission/fee tests included.
"""
from __future__ import annotations

from alembic import op

revision = "0045_provider_commission_fees"
down_revision = "0044_provider_payouts"
branch_labels: list[str] = []
depends_on: list[str] | None = None


def upgrade() -> None:
    # ---- PROVIDER_COMMISSION_RATES ------------------------------------------
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS "PROVIDER_COMMISSION_RATES" (
            "rate_id"          uuid           NOT NULL DEFAULT gen_random_uuid(),
            "provider_id"      uuid           NOT NULL,
            "currency"         varchar(3)     NOT NULL DEFAULT 'TZS',
            "commission_rate"  numeric(6,4)   NOT NULL DEFAULT 0,
            "tax_on_commission numeric(6,4)   NOT NULL DEFAULT 0,
            "is_active"        boolean        NOT NULL DEFAULT TRUE,
            "effective_from"   timestamptz    NOT NULL DEFAULT now(),
            "effective_to"     timestamptz,
            "created_at"       timestamptz    NOT NULL DEFAULT now(),
            "updated_at"       timestamptz    NOT NULL DEFAULT now(),

            CONSTRAINT "PK_PROVIDER_COMMISSION_RATES" PRIMARY KEY ("rate_id"),
            CONSTRAINT "FK_PCR_PROVIDER"
                FOREIGN KEY ("provider_id") REFERENCES "PROVIDERS"("provider_id")
                ON DELETE CASCADE,
            CONSTRAINT "CK_PCR_CURRENCY"
                CHECK (char_length("currency") = 3),
            CONSTRAINT "CK_PCR_COMMISSION_RATE"
                CHECK ("commission_rate" >= 0 AND "commission_rate" <= 1),
            CONSTRAINT "CK_PCR_TAX_RATE"
                CHECK ("tax_on_commission" >= 0 AND "tax_on_commission" <= 1)
        )
        """
    )
    op.execute(
        'CREATE UNIQUE INDEX IF NOT EXISTS "UX_PCR_PROVIDER_ACTIVE" '
        'ON "PROVIDER_COMMISSION_RATES" ("provider_id") '
        'WHERE "is_active" AND "effective_to" IS NULL'
    )
    op.execute(
        'CREATE INDEX IF NOT EXISTS "IX_PCR_PROVIDER" '
        'ON "PROVIDER_COMMISSION_RATES" ("provider_id", "is_active", "effective_from" DESC)'
    )

    # ---- PROVIDER_COMMISSION_FEES -------------------------------------------
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS "PROVIDER_COMMISSION_FEES" (
            "fee_id"           uuid           NOT NULL DEFAULT gen_random_uuid(),
            "provider_id"      uuid           NOT NULL,
            "currency"         varchar(3)     NOT NULL DEFAULT 'TZS',
            "gross_amount"     numeric(12,2)  NOT NULL,
            "commission_amount" numeric(12,2) NOT NULL,
            "tax_amount"       numeric(12,2)  NOT NULL DEFAULT 0,
            "net_amount"       numeric(12,2)  NOT NULL,
            "status"           varchar(20)    NOT NULL DEFAULT 'APPLIED',
            "reference_type"   varchar(40),
            "reference_id"     uuid,
            "description"      varchar(300),
            "created_at"       timestamptz    NOT NULL DEFAULT now(),

            CONSTRAINT "PK_PROVIDER_COMMISSION_FEES" PRIMARY KEY ("fee_id"),
            CONSTRAINT "FK_PCF_PROVIDER"
                FOREIGN KEY ("provider_id") REFERENCES "PROVIDERS"("provider_id")
                ON DELETE CASCADE,
            CONSTRAINT "CK_PCF_CURRENCY"
                CHECK (char_length("currency") = 3),
            CONSTRAINT "CK_PCF_AMOUNTS"
                CHECK ("gross_amount" > 0),
            CONSTRAINT "CK_PCF_STATUS"
                CHECK ("status" IN (
                    'APPLIED', 'ADJUSTED', 'REVERSED', 'DISPUTED', 'RESOLVED'
                ))
        )
        """
    )
    op.execute(
        'CREATE UNIQUE INDEX IF NOT EXISTS "UQ_PCF_NUMBER" '
        'ON "PROVIDER_COMMISSION_FEES" ("provider_id", "reference_type", "reference_id") '
        'WHERE "reference_type" IS NOT NULL AND "reference_id" IS NOT NULL'
    )
    op.execute(
        'CREATE INDEX IF NOT EXISTS "IX_PCF_PROVIDER" '
        'ON "PROVIDER_COMMISSION_FEES" ("provider_id", "created_at" DESC)'
    )
    op.execute(
        'CREATE INDEX IF NOT EXISTS "IX_PCF_PROVIDER_STATUS" '
        'ON "PROVIDER_COMMISSION_FEES" ("provider_id", "status", "created_at" DESC)'
    )


def downgrade() -> None:
    op.execute('DROP TABLE IF EXISTS "PROVIDER_COMMISSION_FEES"')
    op.execute('DROP TABLE IF EXISTS "PROVIDER_COMMISSION_RATES"')
