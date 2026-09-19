-- CUS.NOTIFICATIONS.MARK_ALL — clear the whole unread badge.
WITH cleared AS (
    UPDATE "CUSTOMER_NOTIFICATIONS"
       SET read_at = now()
     WHERE customer_id = CAST(:customer_id AS uuid)
       AND read_at IS NULL
    RETURNING 1
)
SELECT count(*)::int AS marked FROM cleared;