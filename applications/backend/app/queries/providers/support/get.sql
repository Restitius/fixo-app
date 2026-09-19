-- PRV.SUPPORT.TICKET.GET - one owned ticket
SELECT t.ticket_id, t.ticket_number, t.subject, t.category, t.priority, t.status,
       t.resolution, t.created_at, t.updated_at
FROM "PROVIDER_SUPPORT_TICKETS" t
WHERE t.ticket_id = CAST(:ticket_id AS uuid)
  AND t.provider_id = CAST(:user_id AS uuid)
LIMIT 1;
