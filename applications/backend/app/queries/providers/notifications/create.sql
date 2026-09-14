-- PROV.NOTIFICATIONS.CREATE — persist one provider notification.
-- Matches the existing uq_notifications_reference unique index: a duplicate
-- (provider_id, reference_type, reference_id) is a safe no-op, not an error.
INSERT INTO "PROVIDER_NOTIFICATIONS"
    (provider_id, channel, category, title, body, reference_type, reference_id)
VALUES (
    CAST(:user_id AS uuid), :channel, :category, :title, :body,
    :reference_type, CAST(:reference_id AS uuid)
)
ON CONFLICT ON CONSTRAINT uq_notifications_reference DO NOTHING
RETURNING id, created_at;
