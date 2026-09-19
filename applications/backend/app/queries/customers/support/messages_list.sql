-- CUS.SUPPORT.MESSAGES.LIST - thread, ownership via ticket
SELECT m.message_id, m.sender, m.body, m.created_at
FROM "TICKET_MESSAGES" m
JOIN "SUPPORT_TICKETS" t ON t.ticket_id = m.ticket_id
WHERE m.ticket_id = CAST(:ticket_id AS uuid)
  AND t.customer_id = CAST(:customer_id AS uuid)
ORDER BY m.created_at ASC
LIMIT :limit OFFSET :offset;
