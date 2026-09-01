"""Phase 16 fix - qualify PL/pgSQL column refs in SP_CLOSE_BOOKING.

The OUT params of RETURNS TABLE(customer_id, provider_id, ...) put those names
into the function's variable namespace; unqualified WHERE customer_id = ...
resolved ambiguously against the table column. Qualified aliases resolve it.
"""

from alembic import op

revision = "0019_phase16_sp_qualify"
down_revision = "0018_phase16_completion"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("""
    CREATE OR REPLACE FUNCTION "SP_CLOSE_BOOKING"(p_booking_id UUID)
    RETURNS TABLE (
        customer_id       UUID,
        provider_id       UUID,
        amount            NUMERIC,
        wallet_credited   BOOLEAN,
        loyalty_earned    INTEGER,
        booking_status    TEXT
    )
    AS $$
    DECLARE
        v_customer_id       UUID;
        v_provider_id       UUID;
        v_amount            NUMERIC;
        v_points            INTEGER;
        v_wallet_credited   BOOLEAN := FALSE;
        v_loyalty_earned    INTEGER := 0;
        v_booking_status    TEXT;
        v_wallet_id         UUID;
        v_prev_balance      NUMERIC;
        v_running           NUMERIC;
        v_loyalty_id        UUID;
        v_prev_points       NUMERIC;
        v_new_running       NUMERIC;
    BEGIN
        SELECT b.customer_id, b.provider_id, b.agreed_amount, b.status
          INTO v_customer_id, v_provider_id, v_amount, v_booking_status
          FROM "BOOKINGS" b
         WHERE b.booking_id = p_booking_id
           AND b.status IN ('FINAL_PAYMENT_PENDING', 'PAID')
         FOR UPDATE OF b;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Booking % cannot be closed', p_booking_id
                USING ERRCODE = 'P0001';
        END IF;

        SELECT w.wallet_id INTO v_wallet_id
          FROM "WALLETS" w WHERE w.customer_id = v_provider_id;
        IF v_wallet_id IS NULL THEN
            INSERT INTO "WALLETS" (customer_id, balance, currency)
            VALUES (v_provider_id, 0, 'TZS')
            RETURNING wallet_id INTO v_wallet_id;
        END IF;

        SELECT running_balance INTO v_prev_balance
          FROM "WALLET_LEDGER"
         WHERE wallet_id = v_wallet_id
         ORDER BY created_at DESC, entry_id DESC
         LIMIT 1;
        IF v_prev_balance IS NULL THEN v_prev_balance := 0; END IF;
        v_running := v_prev_balance + v_amount;

        INSERT INTO "WALLET_LEDGER"
            (wallet_id, customer_id, entry_type, amount, running_balance,
             currency, reference_type, reference_id, description)
        VALUES
            (v_wallet_id, v_provider_id, 'CREDIT', v_amount, v_running,
             'TZS', 'BOOKING', p_booking_id,
             'Payment for booking ' || p_booking_id::TEXT);
        UPDATE "WALLETS" SET balance = v_running, updated_at = NOW()
         WHERE wallet_id = v_wallet_id;
        v_wallet_credited := TRUE;

        v_points := FLOOR(v_amount / 1000)::INTEGER;
        IF v_points > 0 THEN
            SELECT la.loyalty_id INTO v_loyalty_id
              FROM "LOYALTY_ACCOUNTS" la WHERE la.customer_id = v_provider_id;
            IF v_loyalty_id IS NULL THEN
                INSERT INTO "LOYALTY_ACCOUNTS" (customer_id, points_balance, tier)
                VALUES (v_provider_id, 0, 'SILVER')
                RETURNING loyalty_id INTO v_loyalty_id;
            END IF;
            SELECT points_balance INTO v_prev_points
              FROM "LOYALTY_ACCOUNTS" WHERE loyalty_id = v_loyalty_id;
            IF v_prev_points IS NULL THEN v_prev_points := 0; END IF;
            v_new_running := v_prev_points + v_points;
            INSERT INTO "LOYALTY_TRANSACTIONS"
                (loyalty_id, customer_id, points, running_total, activity, reference_id)
            VALUES
                (v_loyalty_id, v_provider_id, v_points, v_new_running,
                 'booking_completion', p_booking_id);
            UPDATE "LOYALTY_ACCOUNTS" SET points_balance = v_new_running, updated_at = NOW()
             WHERE loyalty_id = v_loyalty_id;
            v_loyalty_earned := v_points;
        END IF;

        UPDATE "BOOKINGS"
           SET status = 'CLOSED', completed_at = NOW(), updated_at = NOW()
         WHERE booking_id = p_booking_id;
        v_booking_status := 'CLOSED';

        RETURN QUERY
        SELECT v_customer_id, v_provider_id, v_amount,
               v_wallet_credited, v_loyalty_earned, v_booking_status;
    END;
    $$ LANGUAGE plpgsql
    """)


def downgrade() -> None:
    # The 0018 version was functionally identical except for the ambiguity;
    # re-apply 0018's definition here so downgrade is deterministic.
    op.execute("""
    CREATE OR REPLACE FUNCTION "SP_CLOSE_BOOKING"(p_booking_id UUID)
    RETURNS TABLE (
        customer_id       UUID,
        provider_id       UUID,
        amount            NUMERIC,
        wallet_credited   BOOLEAN,
        loyalty_earned    INTEGER,
        booking_status    TEXT
    )
    AS $$
    DECLARE
        v_customer_id       UUID;
        v_provider_id       UUID;
        v_amount            NUMERIC;
        v_points            INTEGER;
        v_wallet_credited   BOOLEAN := FALSE;
        v_loyalty_earned    INTEGER := 0;
        v_booking_status    TEXT;
        v_wallet_id         UUID;
        v_prev_balance      NUMERIC;
        v_running           NUMERIC;
        v_loyalty_id        UUID;
        v_prev_points       NUMERIC;
        v_new_running       NUMERIC;
    BEGIN
        SELECT b.customer_id, b.provider_id, b.agreed_amount, b.status
          INTO v_customer_id, v_provider_id, v_amount, v_booking_status
          FROM "BOOKINGS" b
         WHERE b.booking_id = p_booking_id
           AND b.status IN ('FINAL_PAYMENT_PENDING', 'PAID')
         FOR UPDATE OF b;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Booking % cannot be closed', p_booking_id
                USING ERRCODE = 'P0001';
        END IF;

        SELECT wallet_id INTO v_wallet_id
          FROM "WALLETS" WHERE customer_id = v_provider_id;
        IF v_wallet_id IS NULL THEN
            INSERT INTO "WALLETS" (customer_id, balance, currency)
            VALUES (v_provider_id, 0, 'TZS')
            RETURNING wallet_id INTO v_wallet_id;
        END IF;

        SELECT v_prev_balance FROM (SELECT COALESCE(MAX(running_balance),0) AS v_prev_balance
          FROM "WALLET_LEDGER" WHERE wallet_id = v_wallet_id) s INTO v_prev_balance;
        v_running := v_prev_balance + v_amount;

        INSERT INTO "WALLET_LEDGER"
            (wallet_id, customer_id, entry_type, amount, running_balance,
             currency, reference_type, reference_id, description)
        VALUES
            (v_wallet_id, v_provider_id, 'CREDIT', v_amount, v_running,
             'TZS', 'BOOKING', p_booking_id,
             'Payment for booking ' || p_booking_id::TEXT);
        UPDATE "WALLETS" SET balance = v_running, updated_at = NOW()
         WHERE wallet_id = v_wallet_id;
        v_wallet_credited := TRUE;

        v_points := FLOOR(v_amount / 1000)::INTEGER;
        IF v_points > 0 THEN
            SELECT loyalty_id INTO v_loyalty_id
              FROM "LOYALTY_ACCOUNTS" WHERE customer_id = v_provider_id;
            IF v_loyalty_id IS NULL THEN
                INSERT INTO "LOYALTY_ACCOUNTS" (customer_id, points_balance, tier)
                VALUES (v_provider_id, 0, 'SILVER')
                RETURNING loyalty_id INTO v_loyalty_id;
            END IF;
            SELECT COALESCE(points_balance,0) INTO v_prev_points
              FROM "LOYALTY_ACCOUNTS" WHERE loyalty_id = v_loyalty_id;
            v_new_running := v_prev_points + v_points;
            INSERT INTO "LOYALTY_TRANSACTIONS"
                (loyalty_id, customer_id, points, running_total, activity, reference_id)
            VALUES
                (v_loyalty_id, v_provider_id, v_points, v_new_running,
                 'booking_completion', p_booking_id);
            UPDATE "LOYALTY_ACCOUNTS" SET points_balance = v_new_running, updated_at = NOW()
             WHERE loyalty_id = v_loyalty_id;
            v_loyalty_earned := v_points;
        END IF;

        UPDATE "BOOKINGS"
           SET status = 'CLOSED', completed_at = NOW(), updated_at = NOW()
         WHERE booking_id = p_booking_id;
        v_booking_status := 'CLOSED';

        RETURN QUERY
        SELECT v_customer_id, v_provider_id, v_amount,
               v_wallet_credited, v_loyalty_earned, v_booking_status;
    END;
    $$ LANGUAGE plpgsql
    """)
