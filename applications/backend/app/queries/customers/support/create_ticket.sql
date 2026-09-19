-- Open a helpdesk ticket
INSERT INTO "SUPPORT_TICKETS" (ticket_number, customer_id, subject, category, priority, related_booking_id)
VALUES (
    'TKT-' || to_char(now(),'YYMMDDHH24MI') || '-' || upper(substr(md5(random()::text),1,4)),
    CAST(:customer_id AS uuid), :subject, :category, :priority,
    CAST(:related_booking_id AS uuid)
)
RETURNING ticket_id, ticket_number, status, created_at;
