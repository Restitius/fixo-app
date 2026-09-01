-- CUS.NOTIFICATION.LIST — customer-facing notification history
SELECT notification_id, kind, title, body, is_read, data, created_at
FROM "CUSTOMER_NOTIFICATIONS"
WHERE customer_id = CAST(:user_id AS uuid)
ORDER BY created_at DESC
LIMIT :limit OFFSET :offset;