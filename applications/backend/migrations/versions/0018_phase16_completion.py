"""Phase 16 - Completion (Module 51: Ratings, Module 53: Booking Close).

Supersedes the orphaned 0017_phase16_completion (which pointed at a
non-existent revision). Adds:
  * "RATINGS"             - customer ratings/reviews on completed bookings
  * "SP_CLOSE_BOOKING"    - atomic completion: wallet credit + loyalty earn + close
  * Fix "SP_REQUEST_DATA_EXPORT" PL/pgSQL ambiguity (RETURNING request_id
    collided with the OUT column name).
"""

from alembic import op

revision = "0018_phase16_completion"
down_revision = "0017_phase15_account"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # --- RATINGS (Module 51) ---
    op.execute('CREATE TABLE "RATINGS" ('
               'rating_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),'
               'booking_id UUID NOT NULL,'
               'provider_id UUID NOT NULL,'
               'customer_id UUID NOT NULL,'
               'rating SMALLINT NOT NULL CHECK (rating >= 1 AND rating <= 5),'
               'comment TEXT,'
               'created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),'
               'updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),'
               'UNIQUE (booking_id))')
    op.execute('ALTER TABLE "RATINGS" ADD CONSTRAINT fk_rating_booking '
               'FOREIGN KEY (booking_id) REFERENCES "BOOKINGS" (booking_id) '
               'ON DELETE CASCADE')
    op.execute('CREATE INDEX "IX_RATING_BOOKING" ON "RATINGS" (booking_id)')
    op.execute('CREATE INDEX "IX_RATING_PROVIDER" ON "RATINGS" (provider_id)')
    op.execute("COMMENT ON TABLE \"RATINGS\" IS 'Customer star ratings for completed bookings.'")

    # --- SP_REQUEST_DATA_EXPORT fix (Module 49) ---
    op.execute("""
    CREATE OR REPLACE FUNCTION SP_REQUEST_DATA_EXPORT(p_customer_id UUID)
    RETURNS TABLE(request_id UUID, status VARCHAR)
    LANGUAGE plpgsql AS $$
    DECLARE v_rid UUID;
    BEGIN
        INSERT INTO "DATA_EXPORT_REQUESTS" AS der (customer_id)
        VALUES (p_customer_id)
        RETURNING der.request_id INTO v_rid;
        RETURN QUERY SELECT v_rid, 'PENDING'::VARCHAR;
    END;
    $$;
    """)

    # --- SP_CLOSE_BOOKING (Module 53) ---
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
            SELECT loyalty_id INTO v_loyalty_id
              FROM "LOYALTY_ACCOUNTS" WHERE customer_id = v_provider_id;
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
    op.execute("COMMENT ON FUNCTION \"SP_CLOSE_BOOKING\" "
               "IS 'Phase 16: atomically credit provider wallet, earn loyalty, close booking.'")


def downgrade() -> None:
    op.execute('DROP FUNCTION IF EXISTS "SP_CLOSE_BOOKING"(UUID)')
    op.execute('DROP FUNCTION IF EXISTS SP_REQUEST_DATA_EXPORT(UUID)')
    op.execute('DROP TABLE IF EXISTS "RATINGS"')
