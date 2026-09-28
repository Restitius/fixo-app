"""SP_CLOSE_BOOKING: pay the provider's wallet and reward the customer.

The original function credited the *provider id* into the customer WALLETS and
LOYALTY_ACCOUNTS tables (both keyed by customer_id with a foreign key), so every
real booking close failed with a foreign-key violation after the payment had
already been captured. It now:

* credits the provider's own PROVIDER_WALLETS row with the agreed amount, less
  the provider's active commission (+ tax on commission) when one is configured,
  writing EARNING / COMMISSION ledger rows and a PROVIDER_COMMISSION_FEES row;
* awards loyalty points to the customer;
* flags the booking warranty_eligible so TR_BOOKING_WARRANTY issues the warranty;
* is idempotent per booking, so a retried close never pays twice.
"""

from alembic import op

revision = "0076"
down_revision = "0075"


def upgrade() -> None:
    op.execute(
        """
        CREATE OR REPLACE FUNCTION "SP_CLOSE_BOOKING"(p_booking_id uuid)
        RETURNS TABLE(customer_id uuid, provider_id uuid, amount numeric,
                      wallet_credited boolean, loyalty_earned integer,
                      booking_status text)
        LANGUAGE plpgsql AS $$
        DECLARE
            v_customer_id     uuid;
            v_provider_id     uuid;
            v_amount          numeric;
            v_status          text;
            v_currency        text;
            v_wallet_id       uuid;
            v_balance         numeric;
            v_rate            numeric := 0;
            v_tax_rate        numeric := 0;
            v_commission      numeric := 0;
            v_tax             numeric := 0;
            v_net             numeric;
            v_credited        boolean := FALSE;
            v_points          integer := 0;
            v_loyalty_id      uuid;
            v_prev_points     numeric;
            v_running_points  numeric;
        BEGIN
            SELECT b.customer_id, b.provider_id, b.agreed_amount, b.status, b.currency
              INTO v_customer_id, v_provider_id, v_amount, v_status, v_currency
              FROM "BOOKINGS" b
             WHERE b.booking_id = p_booking_id
               AND b.status IN ('FINAL_PAYMENT_PENDING', 'PAID')
             FOR UPDATE OF b;

            IF NOT FOUND THEN
                RAISE EXCEPTION 'Booking % cannot be closed', p_booking_id
                    USING ERRCODE = 'P0001';
            END IF;

            -- ---- provider payout (once per booking) --------------------------
            IF NOT EXISTS (SELECT 1 FROM "PROVIDER_WALLET_LEDGER" l
                            WHERE l.reference_type = 'BOOKING'
                              AND l.reference_id = p_booking_id
                              AND l.entry_type = 'EARNING') THEN
                SELECT w.wallet_id, w.available_balance INTO v_wallet_id, v_balance
                  FROM "PROVIDER_WALLETS" w
                 WHERE w.provider_id = v_provider_id
                 FOR UPDATE;
                IF v_wallet_id IS NULL THEN
                    INSERT INTO "PROVIDER_WALLETS" (provider_id, currency)
                    VALUES (v_provider_id, COALESCE(v_currency, 'TZS'))
                    RETURNING wallet_id, available_balance INTO v_wallet_id, v_balance;
                END IF;

                SELECT r.commission_rate, r.tax_on_commission INTO v_rate, v_tax_rate
                  FROM "PROVIDER_COMMISSION_RATES" r
                 WHERE r.provider_id = v_provider_id
                   AND r.is_active
                   AND r.effective_from <= now()
                   AND (r.effective_to IS NULL OR r.effective_to > now())
                 ORDER BY r.effective_from DESC
                 LIMIT 1;
                v_rate := COALESCE(v_rate, 0);
                v_tax_rate := COALESCE(v_tax_rate, 0);
                v_commission := ROUND(v_amount * v_rate, 2);
                v_tax := ROUND(v_commission * v_tax_rate, 2);
                v_net := v_amount - v_commission - v_tax;

                INSERT INTO "PROVIDER_WALLET_LEDGER"
                    (wallet_id, provider_id, entry_type, amount, running_balance,
                     currency, reference_type, reference_id, description)
                VALUES
                    (v_wallet_id, v_provider_id, 'EARNING', v_amount,
                     v_balance + v_amount, COALESCE(v_currency, 'TZS'), 'BOOKING',
                     p_booking_id, 'Customer payment for completed booking');
                v_balance := v_balance + v_amount;

                IF v_commission + v_tax > 0 THEN
                    INSERT INTO "PROVIDER_WALLET_LEDGER"
                        (wallet_id, provider_id, entry_type, amount, running_balance,
                         currency, reference_type, reference_id, description)
                    VALUES
                        (v_wallet_id, v_provider_id, 'COMMISSION',
                         -(v_commission + v_tax), v_balance - (v_commission + v_tax),
                         COALESCE(v_currency, 'TZS'), 'BOOKING', p_booking_id,
                         'Platform commission');
                    v_balance := v_balance - (v_commission + v_tax);

                    INSERT INTO "PROVIDER_COMMISSION_FEES"
                        (provider_id, currency, gross_amount, commission_amount,
                         tax_amount, net_amount, status, reference_type,
                         reference_id, description)
                    VALUES
                        (v_provider_id, COALESCE(v_currency, 'TZS'), v_amount,
                         v_commission, v_tax, v_net, 'APPLIED', 'BOOKING',
                         p_booking_id, 'Commission on completed booking');
                END IF;

                UPDATE "PROVIDER_WALLETS"
                   SET available_balance = v_balance,
                       version = version + 1,
                       updated_at = now()
                 WHERE wallet_id = v_wallet_id;
                v_credited := TRUE;
            END IF;

            -- ---- customer loyalty (once per booking) ------------------------
            v_points := FLOOR(v_amount / 1000)::integer;
            IF v_points > 0 AND NOT EXISTS (
                SELECT 1 FROM "LOYALTY_TRANSACTIONS" t
                 WHERE t.reference_id = p_booking_id
                   AND t.activity = 'booking_completion') THEN
                SELECT la.loyalty_id, la.points_balance INTO v_loyalty_id, v_prev_points
                  FROM "LOYALTY_ACCOUNTS" la
                 WHERE la.customer_id = v_customer_id
                 FOR UPDATE;
                IF v_loyalty_id IS NULL THEN
                    INSERT INTO "LOYALTY_ACCOUNTS" (customer_id, points_balance, tier)
                    VALUES (v_customer_id, 0, 'SILVER')
                    RETURNING loyalty_id, points_balance INTO v_loyalty_id, v_prev_points;
                END IF;
                v_running_points := COALESCE(v_prev_points, 0) + v_points;
                INSERT INTO "LOYALTY_TRANSACTIONS"
                    (loyalty_id, customer_id, points, running_total, activity, reference_id)
                VALUES
                    (v_loyalty_id, v_customer_id, v_points, v_running_points,
                     'booking_completion', p_booking_id);
                UPDATE "LOYALTY_ACCOUNTS"
                   SET points_balance = v_running_points, updated_at = now()
                 WHERE loyalty_id = v_loyalty_id;
            ELSE
                v_points := 0;
            END IF;

            UPDATE "BOOKINGS"
               SET status = 'CLOSED', completed_at = COALESCE(completed_at, now()),
                   warranty_eligible = TRUE, updated_at = now()
             WHERE booking_id = p_booking_id;

            RETURN QUERY SELECT v_customer_id, v_provider_id, v_amount,
                                v_credited, v_points, 'CLOSED'::text;
        END;
        $$;
        """
    )


def downgrade() -> None:
    # The previous definition was defective (credited provider ids into customer
    # tables); there is nothing sensible to restore.
    pass
