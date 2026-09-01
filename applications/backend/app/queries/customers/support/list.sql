-- CUS.SUPPORT.TICKET.LIST - customer tickets with message counts
SELECT t.ticket_id, t.ticket_number, t.subject, t.category, t.priority, t.status,
       t.created_at, t.updated_at,
       (SELECT COUNT(*) FROM "TICKET_MESSAGES" m WHERE m.ticket_id = t.ticket_id) AS message_count
FROM "SUPPORT_TICKETS" t
WHERE t.customer_id = CAST(:customer_id AS uuid)
ORDER BY t.updated_at DESC
LIMIT :limit OFFSET :offset;
