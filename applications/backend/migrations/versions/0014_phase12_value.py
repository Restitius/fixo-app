"""Phase 12 - Customer Value: WALLET, WALLET_LEDGER, PROMOTIONS, LOYALTY.

Ledger-based wallet: balance is always derived, never stored.
All operations are ledger entries so the trail is audit-complete.
"""
from __future__ import annotations

from alembic import op

revision = "0014_phase12_value"
down_revision = "0013_phase11_retention"


def upgrade() -> None:
    # ---- WALLET (Module 34) ------------------------------------------------
    op.execute("""
        CREATE TABLE IF NOT EXISTS "WALLETS" (
            wallet_id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            customer_id     UUID NOT NULL UNIQUE REFERENCES "CUSTOMERS"(customer_id) ON DELETE CASCADE,
            balance         NUMERIC(12,2) NOT NULL DEFAULT 0,
            currency        VARCHAR(3)   NOT NULL DEFAULT 'TZS',
            version         INTEGER NOT NULL DEFAULT 0,
            created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
        )
    """)
    op.execute('CREATE INDEX IF NOT EXISTS "IX_WALLETS_CUSTOMER" ON "WALLETS" (customer_id)')

    op.execute("""
        CREATE TABLE IF NOT EXISTS "WALLET_LEDGER" (
            entry_id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            wallet_id        UUID NOT NULL REFERENCES "WALLETS"(wallet_id) ON DELETE CASCADE,
            customer_id      UUID NOT NULL REFERENCES "CUSTOMERS"(customer_id) ON DELETE CASCADE,
            entry_type       VARCHAR(20) NOT NULL,
            amount           NUMERIC(12,2) NOT NULL,
            running_balance  NUMERIC(12,2) NOT NULL,
            currency         VARCHAR(3)   NOT NULL DEFAULT 'TZS',
            reference_type   VARCHAR(40),
            reference_id     UUID,
            description      VARCHAR(300),
            created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
        )
    """)
    op.execute('CREATE INDEX IF NOT EXISTS "IX_LEDGER_WALLET" ON "WALLET_LEDGER" (wallet_id, created_at DESC)')
    op.execute('CREATE INDEX IF NOT EXISTS "IX_LEDGER_REF" ON "WALLET_LEDGER" (reference_type, reference_id)')

    # ---- PROMOTIONS (Module 35) --------------------------------------------
    op.execute("""
        CREATE TABLE IF NOT EXISTS "PROMOTIONS" (
            promo_id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            code             VARCHAR(40) NOT NULL UNIQUE,
            name             VARCHAR(120) NOT NULL,
            description      VARCHAR(500),
            discount_type    VARCHAR(20) NOT NULL,
            discount_value   NUMERIC(12,2) NOT NULL,
            min_amount       NUMERIC(12,2) DEFAULT 0,
            max_discount     NUMERIC(12,2),
            usage_limit      INTEGER,
            used_count       INTEGER NOT NULL DEFAULT 0,
            valid_from       TIMESTAMPTZ NOT NULL,
            valid_until      TIMESTAMPTZ NOT NULL,
            active           BOOLEAN     NOT NULL DEFAULT TRUE,
            created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
        )
    """)
    op.execute('CREATE INDEX IF NOT EXISTS "IX_PROMOS_CODE" ON "PROMOTIONS" (code)')

    # ---- LOYALTY (Module 36) -----------------------------------------------
    op.execute("""
        CREATE TABLE IF NOT EXISTS "LOYALTY_ACCOUNTS" (
            loyalty_id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            customer_id      UUID NOT NULL UNIQUE REFERENCES "CUSTOMERS"(customer_id) ON DELETE CASCADE,
            points_balance   NUMERIC(12,2) NOT NULL DEFAULT 0,
            tier             VARCHAR(20) NOT NULL DEFAULT 'SILVER',
            created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
        )
    """)
    op.execute('CREATE INDEX IF NOT EXISTS "IX_LOYALTY_CUSTOMER" ON "LOYALTY_ACCOUNTS" (customer_id)')

    op.execute("""
        CREATE TABLE IF NOT EXISTS "LOYALTY_TRANSACTIONS" (
            txn_id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            loyalty_id   UUID NOT NULL REFERENCES "LOYALTY_ACCOUNTS"(loyalty_id) ON DELETE CASCADE,
            customer_id  UUID NOT NULL REFERENCES "CUSTOMERS"(customer_id) ON DELETE CASCADE,
            points       NUMERIC(12,2) NOT NULL,
            running_total NUMERIC(12,2) NOT NULL,
            activity     VARCHAR(50) NOT NULL,
            reference_id UUID,
            created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
        )
    """)
    op.execute('CREATE INDEX IF NOT EXISTS "IX_LOYALTY_TXN" ON "LOYALTY_TRANSACTIONS" (loyalty_id, created_at DESC)')


def downgrade() -> None:
    op.execute('DROP TABLE IF EXISTS "LOYALTY_TRANSACTIONS"')
    op.execute('DROP TABLE IF EXISTS "LOYALTY_ACCOUNTS"')
    op.execute('DROP TABLE IF EXISTS "PROMOTIONS"')
    op.execute('DROP TABLE IF EXISTS "WALLET_LEDGER"')
    op.execute('DROP TABLE IF EXISTS "WALLETS"')
