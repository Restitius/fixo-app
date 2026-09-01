-- CUS.LOYALTY.EARN - lock account, apply signed points, ledger in one statement
-- Positive points earn; negative points spend (guarded against negative balance).
WITH cur AS (
    SELECT loyalty_id FROM "LOYALTY_ACCOUNTS"
    WHERE customer_id = CAST(:user_id AS uuid)
    FOR UPDATE
), upd AS (
    UPDATE "LOYALTY_ACCOUNTS" a
       SET points_balance = a.points_balance + :points, updated_at = now()
     WHERE a.loyalty_id = (SELECT loyalty_id FROM cur)
       AND a.points_balance + :points >= 0
    RETURNING a.points_balance
)
INSERT INTO "LOYALTY_TRANSACTIONS" (loyalty_id, customer_id, points, running_total, activity, reference_id)
SELECT c.loyalty_id, CAST(:user_id AS uuid), :points, u.points_balance, :activity, CAST(:reference_id AS uuid)
FROM cur c, upd u
RETURNING txn_id, points, running_total, created_at;
