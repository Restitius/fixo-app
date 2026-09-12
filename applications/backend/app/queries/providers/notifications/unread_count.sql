--name: notifications_unread_count
--description: Count of unread notifications for a provider (Provider Phase 32).
--params: provider_id (uuid)
SELECT COUNT(*) AS unread_count
FROM "PROVIDER_NOTIFICATIONS"
WHERE provider_id = :provider_id
  AND is_read = false;
