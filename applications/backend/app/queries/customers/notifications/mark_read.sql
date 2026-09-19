-- CUS.NOTIFICATIONS.MARK_READ — mark one owned notification read.
UPDATE "CUSTOMER_NOTIFICATIONS"
   SET read_at = now()
 WHERE notification_id = CAST(:notification_id AS uuid)
   AND customer_id = CAST(:customer_id AS uuid)
   AND read_at IS NULL
RETURNING notification_id;