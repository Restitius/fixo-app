-- CUS.NOTIFICATIONS.CREATE — persist one customer notification.
INSERT INTO "CUSTOMER_NOTIFICATIONS" (customer_id, type, title, body, ref_type, ref_id)
VALUES (CAST(:customer_id AS uuid), :type, :title,
        :body, :ref_type, :ref_id)
RETURNING notification_id, created_at;