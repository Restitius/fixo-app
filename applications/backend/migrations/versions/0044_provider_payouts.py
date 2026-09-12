"""Add PROVIDER_PAYOUT_METHODS + PROVIDER_PAYOUTS (Provider Phase 30).

Payout Management:
  - Providers register payout methods: bank account, mobile money,
    provider wallet or other supported channels. They enter the account
    holder, provider (bank / mobile-network), account number, mobile
    number and currency.
  - Withdraw Funds: requested -> processing -> paid (or failed).
    Amounts are drawn from the provider wallet's available balance
    (PROVIDER_WALLETS.available_balance); the money is reserved on
    request and released/deducted on completion.

Same shape as the customer PAYMENT_METHODS pattern (0017_phase15_account)
but provider-scoped and gateway-agnostic.
"""
from __future__ import annotations

from alembic import op

revision = "0044_provider_payouts"
down_revision = "0043_provider_wallet"
branch_labels: list[str] = []
depends_on: list[str] | None = None


def upgrade() -> None:
    # ---- PROVIDER_PAYOUT_METHODS -------------------------------------------
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS "PROVIDER_PAYOUT_METHODS" (
            "method_id"       uuid           NOT NULL DEFAULT gen_random_uuid(),
            "provider_id"     uuid           NOT NULL,
            "method_type"     varchar(20)    NOT NULL,
            "provider_name"   varchar(80),
            "account_holder"  varchar(120),
            "account_number"  varchar(40),
            "mobile_number"   varchar(20),
            "currency"        varchar(3)     NOT NULL DEFAULT 'TZS',
            "is_default"      boolean        NOT NULL DEFAULT FALSE,
            "created_at"      timestamptz    NOT NULL DEFAULT now(),
            "updated_at"      timestamptz    NOT NULL DEFAULT now(),

            CONSTRAINT "PK_PROVIDER_PAYOUT_METHODS" PRIMARY KEY ("method_id"),
            CONSTRAINT "FK_PPM_PROVIDER"
                FOREIGN KEY ("provider_id") REFERENCES "PROVIDERS"("provider_id")
                ON DELETE CASCADE,
            CONSTRAINT "CK_PPM_TYPE"
                CHECK ("method_type" IN (
                    'BANK', 'MOBILE_MONEY', 'WALLET', 'OTHER'
                ))
        )
        """
    )
    op.execute(
        'CREATE INDEX IF NOT EXISTS "IX_PPM_PROVIDER" '
        'ON "PROVIDER_PAYOUT_METHODS" ("provider_id")'
    )
    op.execute(
        'CREATE UNIQUE INDEX IF NOT EXISTS "UX_PPM_SINGLE_DEFAULT" '
        'ON "PROVIDER_PAYOUT_METHODS" ("provider_id") WHERE "is_default"'
    )

    # ---- PROVIDER_PAYOUTS --------------------------------------------------
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS "PROVIDER_PAYOUTS" (
            "payout_id"      uuid           NOT NULL DEFAULT gen_random_uuid(),
            "payout_number"  varchar(24)    NOT NULL,
            "provider_id"    uuid           NOT NULL,
            "method_id"      uuid           NOT NULL,
            "amount"         numeric(12,2)  NOT NULL,
            "currency"       varchar(3)     NOT NULL DEFAULT 'TZS',
            "status"         varchar(20)    NOT NULL DEFAULT 'REQUESTED',
            "failure_reason" varchar(300),
            "requested_at"   timestamptz    NOT NULL DEFAULT now(),
            "processed_at"   timestamptz,
            "completed_at"   timestamptz,
            "created_at"     timestamptz    NOT NULL DEFAULT now(),

            CONSTRAINT "PK_PROVIDER_PAYOUTS" PRIMARY KEY ("payout_id"),
            CONSTRAINT "UQ_PROVIDER_PAYOUTS_NUMBER" UNIQUE ("payout_number"),
            CONSTRAINT "FK_PROVIDER_PAYOUTS_PROVIDER"
                FOREIGN KEY ("provider_id") REFERENCES "PROVIDERS"("provider_id")
                ON DELETE CASCADE,
            CONSTRAINT "FK_PROVIDER_PAYOUTS_METHOD"
                FOREIGN KEY ("method_id") REFERENCES "PROVIDER_PAYOUT_METHODS"("method_id"),
            CONSTRAINT "CK_PROVIDER_PAYOUTS_AMOUNT" CHECK ("amount" > 0),
            CONSTRAINT "CK_PROVIDER_PAYOUTS_STATUS"
                CHECK ("status" IN (
                    'REQUESTED', 'PROCESSING', 'PAID', 'FAILED', 'CANCELLED'
                ))
        )
        """
    )
    op.execute(
        'CREATE INDEX IF NOT EXISTS "IX_PROVIDER_PAYOUTS_PROVIDER" '
        'ON "PROVIDER_PAYOUTS" ("provider_id", "created_at" DESC)'
    )


def downgrade() -> None:
    op.execute('DROP TABLE IF EXISTS "PROVIDER_PAYOUTS"')
    op.execute('DROP TABLE IF EXISTS "PROVIDER_PAYOUT_METHODS"')