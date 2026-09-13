-- PRV.SUPPORT.TICKET.LIST - provider tickets with message counts
SELECT t.ticket_id, t.ticket_number, t.subject, t.category, t.priority, t.status,
       t.created_at, t.updated_at,
       (SELECT COUNT(*) FROM "PROVIDER_TICKET_MESSAGES" m WHERE m.ticket_id = t.ticket_id) AS message_count,
       (SELECT MIN(m.created_at) FROM "PROVIDER_TICKET_MESSAGES" m WHERE m.ticket_id = t.ticket_id AND m.sender = 'SUPPORT') AS first_response_at,
       (SELECT MAX(m.created_at) FROM "PROVIDER_TICKET_MESSAGES" m WHERE m.ticket_id = t.ticket_id AND m.sender = 'SUPPORT') AS last_support_message_at
FROM "PROVIDER_SUPPORT_TICKETS" t
WHERE t.provider_id = CAST(:user_id AS uuid)
ORDER BY t.updated_at DESC
LIMIT :limit OFFSET :offset;
