-- PROV.NOTIFICATIONS.CREATE — persist one provider notification.
-- An outbox item creates at most one provider inbox row, even after a retry.
INSERT INTO "PROVIDER_NOTIFICATIONS"
    (provider_id, channel, category, title, body, reference_type, reference_id, outbox_id)
VALUES (
    CAST(:user_id AS uuid), :channel, :category, :title, :body,
    :reference_type, CAST(:reference_id AS uuid), CAST(:outbox_id AS uuid)
)
ON CONFLICT (outbox_id) WHERE outbox_id IS NOT NULL DO NOTHING
RETURNING id, created_at;
