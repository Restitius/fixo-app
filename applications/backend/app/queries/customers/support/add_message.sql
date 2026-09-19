-- Customer reply (ownership re-checked)
WITH ok AS (
    SELECT 1 FROM "SUPPORT_TICKETS"
    WHERE ticket_id = CAST(:ticket_id AS uuid)
      AND customer_id = CAST(:customer_id AS uuid)
      AND status <> 'CLOSED'
)
INSERT INTO "TICKET_MESSAGES" (ticket_id, sender, body)
SELECT CAST(:ticket_id AS uuid), 'CUSTOMER', :body FROM ok
RETURNING message_id, created_at;
