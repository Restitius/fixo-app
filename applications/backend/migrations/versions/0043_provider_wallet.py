"""Add PROVIDER_WALLETS + PROVIDER_WALLET_LEDGER (Provider Phase 29).

The provider wallet mirrors the customer WALLETS/WALLET_LEDGER pattern
(0014_phase12_value.py) but for providers. Every money event on the
platform writes one ledger row:

  Booking #FX12390
    Customer paid:        TZS 120,000   (reference INVOICE)
    Platform commission:  TZS  12,000   (entry_type COMMISSION)
    Provider earnings:    TZS 108,000   (entry_type EARNING)

The wallet stores the running available / pending / reserved balances;
the ledger is the audit-immutable history behind the seven displayed
statistics (available, pending, reserved, withdrawals, refund
deductions, bonuses, adjustments).

Writes land here during payout processing (Phase 30); this phase ships
the schema + the read surface (summary + full transaction history).
"""
from __future__ import annotations

from alembic import op

revision = "0043_provider_wallet"
down_revision = "0042_provider_job_reviews"
branch_labels: list[str] = []
depends_on: list[str] | None = None


def upgrade() -> None:
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS "PROVIDER_WALLETS" (
            "wallet_id"          uuid           NOT NULL DEFAULT gen_random_uuid(),
            "provider_id"        uuid           NOT NULL,
            "available_balance"  numeric(12,2)  NOT NULL DEFAULT 0,
            "pending_balance"    numeric(12,2)  NOT NULL DEFAULT 0,
            "reserved_funds"     numeric(12,2)  NOT NULL DEFAULT 0,
            "currency"           varchar(3)     NOT NULL DEFAULT 'TZS',
            "version"            integer        NOT NULL DEFAULT 0,
            "created_at"         timestamptz    NOT NULL DEFAULT now(),
            "updated_at"         timestamptz    NOT NULL DEFAULT now(),

            CONSTRAINT "PK_PROVIDER_WALLETS" PRIMARY KEY ("wallet_id"),
            CONSTRAINT "UQ_PROVIDER_WALLETS_PROVIDER" UNIQUE ("provider_id"),
            CONSTRAINT "FK_PROVIDER_WALLETS_PROVIDER"
                FOREIGN KEY ("provider_id") REFERENCES "PROVIDERS"("provider_id")
                ON DELETE CASCADE,
            CONSTRAINT "CK_PROVIDER_WALLETS_CURRENCY"
                CHECK (char_length("currency") = 3)
        )
        """
    )
    op.execute(
        'CREATE INDEX IF NOT EXISTS "IX_PROVIDER_WALLETS_PROVIDER" '
        'ON "PROVIDER_WALLETS" ("provider_id")'
    )

    op.execute(
        """
        CREATE TABLE IF NOT EXISTS "PROVIDER_WALLET_LEDGER" (
            "entry_id"         uuid           NOT NULL DEFAULT gen_random_uuid(),
            "wallet_id"        uuid           NOT NULL,
            "provider_id"      uuid           NOT NULL,
            "entry_type"       varchar(24)    NOT NULL,
            "amount"           numeric(12,2)  NOT NULL,
            "running_balance"  numeric(12,2)  NOT NULL,
            "currency"         varchar(3)     NOT NULL DEFAULT 'TZS',
            "reference_type"   varchar(40),
            "reference_id"     uuid,
            "description"      varchar(300),
            "created_at"       timestamptz    NOT NULL DEFAULT now(),

            CONSTRAINT "PK_PROVIDER_WALLET_LEDGER" PRIMARY KEY ("entry_id"),
            CONSTRAINT "FK_PROVIDER_WALLET_LEDGER_WALLET"
                FOREIGN KEY ("wallet_id") REFERENCES "PROVIDER_WALLETS"("wallet_id")
                ON DELETE CASCADE,
            CONSTRAINT "FK_PROVIDER_WALLET_LEDGER_PROVIDER"
                FOREIGN KEY ("provider_id") REFERENCES "PROVIDERS"("provider_id")
                ON DELETE CASCADE,
            CONSTRAINT "CK_PROVIDER_WALLET_LEDGER_TYPE"
                CHECK ("entry_type" IN (
                    'EARNING', 'COMMISSION', 'WITHDRAWAL', 'REFUND_DEDUCTION',
                    'BONUS', 'ADJUSTMENT', 'RESERVATION'
                ))
        )
        """
    )
    op.execute(
        'CREATE INDEX IF NOT EXISTS "IX_PWL_WALLET_DESC" '
        'ON "PROVIDER_WALLET_LEDGER" ("wallet_id", "created_at" DESC)'
    )
    op.execute(
        'CREATE INDEX IF NOT EXISTS "IX_PWL_REF" '
        'ON "PROVIDER_WALLET_LEDGER" ("reference_type", "reference_id")'
    )


def downgrade() -> None:
    op.execute('DROP TABLE IF EXISTS "PROVIDER_WALLET_LEDGER"')
    op.execute('DROP TABLE IF EXISTS "PROVIDER_WALLETS"')