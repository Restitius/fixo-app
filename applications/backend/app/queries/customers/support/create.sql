-- CUS.SUPPORT.TICKET.CREATE - open a support ticket
INSERT INTO "SUPPORT_TICKETS" (customer_id, subject, category, priority)
VALUES (CAST(:customer_id AS uuid), :subject, :category, :priority)
RETURNING ticket_id, ticket_number, subject, category, priority, status, created_at;
