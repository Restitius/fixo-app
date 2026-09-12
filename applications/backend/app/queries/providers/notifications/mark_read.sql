-- PROV.NOTIFICATIONS.MARK_READ — mark a notification as read (idempotent).
UPDATE "PROVIDER_NOTIFICATIONS"
SET "is_read" = true, "updated_at" = now()
WHERE "provider_id" = :user_id AND "id" = :notification_id
RETURNING "id", "is_read", "updated_at";
