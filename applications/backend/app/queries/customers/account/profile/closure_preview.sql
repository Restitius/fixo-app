-- CUS.ACCOUNT.CLOSURE.PREVIEW — what the customer must know before closing the account.
SELECT
    (SELECT count(*) FROM "BOOKINGS" b
      WHERE b.customer_id = CAST(:user_id AS uuid)
        AND b.status NOT IN ('CLOSED', 'CANCELLED', 'COMPLETED'))::int          AS active_bookings,
    (SELECT count(*) FROM "BOOKINGS" b
      WHERE b.customer_id = CAST(:user_id AS uuid)
        AND b.status IN ('CONFIRMED', 'PAYMENT_FAILED', 'PAYMENT_AUTHORIZED',
                         'CUSTOMER_CONFIRMED'))::int                             AS pending_payments,
    (SELECT count(*) FROM "DISPUTES" d
      WHERE d.customer_id = CAST(:user_id AS uuid)
        AND d.status NOT IN ('RESOLVED', 'CLOSED', 'WITHDRAWN', 'REJECTED'))::int AS open_disputes,
    (SELECT count(*) FROM "WARRANTIES" w
      WHERE w.customer_id = CAST(:user_id AS uuid)
        AND w.status IN ('ACTIVE', 'CLAIMED')
        AND w.expires_at > now())::int                                           AS active_warranties,
    COALESCE((SELECT w.balance FROM "WALLETS" w
               WHERE w.customer_id = CAST(:user_id AS uuid)), 0)::float          AS wallet_balance;
