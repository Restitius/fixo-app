-- Guarded lifecycle flip (customer may resolve/close own ticket)
UPDATE "SUPPORT_TICKETS"
SET    status = :new_status, updated_at = now()
WHERE  ticket_id   = CAST(:ticket_id AS uuid)
  AND  customer_id = CAST(:customer_id AS uuid)
  AND  (:old_status = status OR status = 'OPEN');
RETURNING ticket_id;
