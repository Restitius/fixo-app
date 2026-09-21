"""Phase 12 - Wallet functions: SP_WALLET_CREDIT, SP_WALLET_DEBIT, SP_EARN_LOYALTY.

Ledger-atomic functions. Returns table so callers SELECT * FROM fn(...).
"""
from __future__ import annotations

from alembic import op

revision = "0015_phase12_functions"
down_revision = "0014_phase12_value"


def upgrade() -> None:
    # ---- Wallet credit: insert ledger row + update wallet balance atomically ----
    op.execute("""
        CREATE OR REPLACE FUNCTION SP_WALLET_CREDIT(
            p_wallet_id    UUID,
            p_customer_id  UUID,
            p_amount       NUMERIC,
            p_currency     VARCHAR,
            p_ref_type     VARCHAR,
            p_ref_id       UUID,
            p_description  VARCHAR
        ) RETURNS TABLE(
            entry_id        UUID,
            running_balance NUMERIC,
            new_wallet_balance NUMERIC
        )
        LANGUAGE plpgsql AS $$
        DECLARE
            v_entry UUID;
            v_running NUMERIC;
            v_new_balance NUMERIC;
        BEGIN
            INSERT INTO "WALLET_LEDGER"
                (wallet_id, customer_id, entry_type, amount, running_balance,
                 currency, reference_type, reference_id, description)
            SELECT wl.wallet_id, p_customer_id, 'CREDIT', p_amount,
                   wl.balance + p_amount,
                   p_currency, p_ref_type, p_ref_id, p_description
              FROM "WALLETS" wl
             WHERE wl.wallet_id = p_wallet_id
               AND wl.customer_id = p_customer_id
            RETURNING entry_id, running_balance INTO v_entry, v_running;

            UPDATE "WALLETS"
               SET balance = v_running, updated_at = now()
             WHERE wallet_id = p_wallet_id;

            SELECT balance INTO v_new_balance FROM "WALLETS" WHERE wallet_id = p_wallet_id;
            RETURN QUERY SELECT v_entry, v_running, v_new_balance;
        END;
        $$;
    """)

    # ---- Wallet debit: deduct with sufficient-funds guard ----
    op.execute("""
        CREATE OR REPLACE FUNCTION SP_WALLET_DEBIT(
            p_wallet_id    UUID,
            p_customer_id  UUID,
            p_amount       NUMERIC,
            p_currency     VARCHAR,
            p_ref_type     VARCHAR,
            p_ref_id       UUID,
            p_description  VARCHAR
        ) RETURNS TABLE(
            success        BOOLEAN,
            entry_id       UUID,
            running_balance NUMERIC,
            new_wallet_balance NUMERIC,
            error_msg      VARCHAR
        )
        LANGUAGE plpgsql AS $$
        DECLARE
            v_entry UUID;
            v_running NUMERIC;
            v_new_balance NUMERIC;
        BEGIN
            IF p_amount <= 0 THEN
                RETURN QUERY SELECT FALSE, NULL::UUID, 0::NUMERIC, 0::NUMERIC, 'Debit amount must be positive'::VARCHAR;
                RETURN;
            END IF;

            INSERT INTO "WALLET_LEDGER"
                (wallet_id, customer_id, entry_type, amount, running_balance,
                 currency, reference_type, reference_id, description)
            SELECT wl.wallet_id, p_customer_id, 'DEBIT', -p_amount,
                   wl.balance - p_amount,
                   p_currency, p_ref_type, p_ref_id, p_description
              FROM "WALLETS" wl
             WHERE wl.wallet_id = p_wallet_id
               AND wl.customer_id = p_customer_id
               AND wl.balance >= p_amount
            RETURNING entry_id, running_balance INTO v_entry, v_running;

            IF NOT FOUND THEN
                RETURN QUERY SELECT FALSE, NULL::UUID, 0::NUMERIC, 0::NUMERIC, 'Insufficient funds'::VARCHAR;
                RETURN;
            END IF;

            UPDATE "WALLETS"
               SET balance = v_running, updated_at = now()
             WHERE wallet_id = p_wallet_id;

            SELECT balance INTO v_new_balance FROM "WALLETS" WHERE wallet_id = p_wallet_id;
            RETURN QUERY SELECT TRUE, v_entry, v_running, v_new_balance, NULL::VARCHAR;
        END;
        $$;
    """)

    # ---- Loyalty earning: record transaction + bump balance ----
    op.execute("""
        CREATE OR REPLACE FUNCTION SP_EARN_LOYALTY(
            p_loyalty_id   UUID,
            p_customer_id  UUID,
            p_points       NUMERIC,
            p_activity     VARCHAR,
            p_ref_id       UUID
        ) RETURNS NUMERIC
        LANGUAGE plpgsql AS $$
            DECLARE v_total NUMERIC;
        BEGIN
            UPDATE "LOYALTY_ACCOUNTS"
               SET points_balance = points_balance + p_points,
                   updated_at = now()
             WHERE loyalty_id = p_loyalty_id
               AND customer_id = p_customer_id;

            INSERT INTO "LOYALTY_TRANSACTIONS"
                (loyalty_id, customer_id, points, running_total, activity, reference_id)
            SELECT p_loyalty_id, p_customer_id, p_points, la.points_balance, p_activity, p_ref_id
              FROM "LOYALTY_ACCOUNTS" la
             WHERE la.loyalty_id = p_loyalty_id;

            SELECT points_balance INTO v_total FROM "LOYALTY_ACCOUNTS" WHERE loyalty_id = p_loyalty_id;
            RETURN v_total;
        END;
        $$;
    """)


def downgrade() -> None:
    op.execute("DROP FUNCTION IF EXISTS SP_EARN_LOYALTY")
    op.execute("DROP FUNCTION IF EXISTS SP_WALLET_DEBIT")
    op.execute("DROP FUNCTION IF EXISTS SP_WALLET_CREDIT")
