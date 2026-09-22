-- CUS.NOTIFICATIONS.CREATE — persist one customer notification.
INSERT INTO "CUSTOMER_NOTIFICATIONS" (customer_id, type, title, body, ref_type, ref_id, outbox_id)
VALUES (CAST(:customer_id AS uuid), :type, :title,
        :body, :ref_type, :ref_id, CAST(:outbox_id AS uuid))
ON CONFLICT (outbox_id) WHERE outbox_id IS NOT NULL DO NOTHING
RETURNING notification_id, created_at;
