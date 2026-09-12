--name: notifications_mark_read
--description: Mark a provider notification as read, idempotent (Provider Phase 32).
--params: provider_id (uuid), notification_id (uuid)
UPDATE "PROVIDER_NOTIFICATIONS"
SET is_read = true,
    updated_at = now()
WHERE id = :notification_id
  AND provider_id = :provider_id
RETURNING
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
    updated_at;
