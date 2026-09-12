-- PROV.NOTIFICATIONS.GET — single notification by id (ownership-scoped).
SELECT "id", "provider_id", "channel", "category", "title", "body",
       "is_read", "reference_type", "reference_id", "created_at", "updated_at"
FROM "PROVIDER_NOTIFICATIONS"
WHERE "provider_id" = :provider_id AND "id" = :notification_id;
