-- CUS.SUPPORT.TICKET.GET - one owned ticket
SELECT t.ticket_id, t.ticket_number, t.subject, t.category, t.priority, t.status,
       t.resolution, t.created_at, t.updated_at
FROM "SUPPORT_TICKETS" t
WHERE t.ticket_id = CAST(:ticket_id AS uuid)
  AND t.customer_id = CAST(:customer_id AS uuid)
LIMIT 1;
