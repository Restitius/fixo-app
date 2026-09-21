-- CUS.REQUEST.SET_STATUS — guarded transition; the from-state is part of the key.
UPDATE "SERVICE_REQUESTS"
   SET status = CAST(:to_state AS varchar),
       submitted_at = CASE WHEN CAST(:to_state AS varchar) = 'SUBMITTED' THEN now() ELSE submitted_at END,
       validation_notes = COALESCE(CAST(:notes AS varchar), validation_notes),
       updated_at = now()
 WHERE request_id = CAST(:request_id AS uuid)
   AND customer_id = CAST(:customer_id AS uuid)
   AND status = CAST(:from_state AS varchar)
RETURNING request_id, status, updated_at;