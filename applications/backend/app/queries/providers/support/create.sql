-- PRV.SUPPORT.TICKET.CREATE - open a support ticket
INSERT INTO "PROVIDER_SUPPORT_TICKETS" (provider_id, subject, category, priority)
VALUES (CAST(:provider_id AS uuid), :subject, :category, :priority)
RETURNING ticket_id, ticket_number, subject, category, priority, status, created_at;
