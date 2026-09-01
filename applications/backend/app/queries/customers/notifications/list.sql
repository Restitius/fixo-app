-- CUS.NOTIFICATIONS.LIST — newest first, optional unread-only filter.
SELECT notification_id, type, title, body, ref_type, ref_id,
       read_at, created_at
  FROM "CUSTOMER_NOTIFICATIONS"
 WHERE customer_id = CAST(:customer_id AS uuid)
   AND (NOT CAST(COALESCE(:unread_only, FALSE) AS boolean) OR read_at IS NULL)
 ORDER BY created_at DESC
 LIMIT CAST(:limit AS int) OFFSET CAST(:offset AS int);