-- Ticket + messages in one round-trip
SELECT t.ticket_id, t.ticket_number, t.subject, t.category, t.priority, t.status,
       t.related_booking_id, t.created_at, t.updated_at,
       COALESCE((
         SELECT json_agg(json_build_object(
             'message_id', m.message_id, 'sender', m.sender,
             'body', m.body, 'created_at', m.created_at) ORDER BY m.created_at)
         FROM "TICKET_MESSAGES" m WHERE m.ticket_id = t.ticket_id
       ), '[]'::json) AS messages
FROM   "SUPPORT_TICKETS" t
WHERE  t.ticket_id   = CAST(:ticket_id AS uuid)
  AND  t.customer_id = CAST(:customer_id AS uuid);
