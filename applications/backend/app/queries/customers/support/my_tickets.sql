-- Ticket inbox
SELECT ticket_id, ticket_number, subject, category, priority, status, created_at, updated_at
FROM   "SUPPORT_TICKETS"
WHERE  customer_id = CAST(:customer_id AS uuid)
ORDER BY updated_at DESC
LIMIT  100;
