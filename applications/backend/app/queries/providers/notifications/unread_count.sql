-- PROV.NOTIFICATIONS.UNREAD_COUNT — count of unread notifications for a provider.
SELECT COUNT(*) AS "unread_count"
FROM "PROVIDER_NOTIFICATIONS"
WHERE "provider_id" = :user_id AND "is_read" = false;
