-- PROV.NOTIFICATIONS.LIST — provider notifications, newest first.
-- Optional filters: status (unread|all), category.
SELECT "id", "provider_id", "channel", "category", "title", "body",
       "is_read", "reference_type", "reference_id", "created_at", "updated_at"
FROM "PROVIDER_NOTIFICATIONS"
WHERE "provider_id" = :user_id
  AND (CAST(:status AS varchar) IS NULL OR :status = 'all'
       OR (:status = 'unread' AND "is_read" = false))
  AND (CAST(:category AS varchar) IS NULL OR "category" = :category)
ORDER BY "is_read" ASC, "created_at" DESC
LIMIT :limit OFFSET :offset;
