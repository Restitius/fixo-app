-- CUS.NOTIFICATIONS.UNREAD_COUNT — badge counter.
SELECT count(*)::int AS unread_count
  FROM "CUSTOMER_NOTIFICATIONS"
 WHERE customer_id = CAST(:customer_id AS uuid)
   AND read_at IS NULL;