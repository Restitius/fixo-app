--name: notifications_list
--description: Provider notifications history, filtered by provider + optional status/category, ordered by created_at desc (Provider Phase 32).
--params: provider_id (uuid), status (text|null), category (text|null), limit (int), offset (int)
SELECT
    id,
    provider_id,
    channel,
    category,
    title,
    body,
    is_read,
    reference_type,
    reference_id,
    created_at,
    updated_at
FROM "PROVIDER_NOTIFICATIONS"
WHERE provider_id = :provider_id
  AND (:category::text IS NULL OR category = :category::text)
  AND (:status::text IS NULL OR (:status = 'unread' AND is_read = false) OR (:status = 'read' AND is_read = true))
ORDER BY created_at DESC
LIMIT :limit OFFSET :offset;
