-- PRV.SUPPORT.MESSAGE.ADD - append to thread; refreshes ticket, blocked when closed
WITH fresh AS (
    UPDATE "PROVIDER_SUPPORT_TICKETS"
    SET updated_at = NOW()
    WHERE ticket_id = CAST(:ticket_id AS uuid)
      AND provider_id = CAST(:user_id AS uuid)
      AND status <> 'CLOSED'
    RETURNING ticket_id
)
INSERT INTO "PROVIDER_TICKET_MESSAGES" (ticket_id, sender, body)
SELECT f.ticket_id, :sender, :body FROM fresh f
RETURNING message_id, ticket_id, sender, body, created_at;
