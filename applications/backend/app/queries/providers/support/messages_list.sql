-- PRV.SUPPORT.MESSAGES.LIST - thread, ownership via ticket
SELECT m.message_id, m.sender, m.body, m.created_at
FROM "PROVIDER_TICKET_MESSAGES" m
JOIN "PROVIDER_SUPPORT_TICKETS" t ON t.ticket_id = m.ticket_id
WHERE m.ticket_id = CAST(:ticket_id AS uuid)
  AND t.provider_id = CAST(:user_id AS uuid)
ORDER BY m.created_at ASC
LIMIT :limit OFFSET :offset;
