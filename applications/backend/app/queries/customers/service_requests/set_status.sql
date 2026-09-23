-- CUS.REQUEST.SET_STATUS — guarded transition; the from-state is part of the key.
WITH changed AS (
    UPDATE "SERVICE_REQUESTS"
       SET status = CAST(:to_state AS varchar),
           submitted_at = CASE WHEN CAST(:to_state AS varchar) = 'SUBMITTED' THEN now() ELSE submitted_at END,
           validation_notes = COALESCE(CAST(:notes AS varchar), validation_notes),
           updated_at = now()
     WHERE request_id = CAST(:request_id AS uuid)
       AND customer_id = CAST(:customer_id AS uuid)
       AND status = CAST(:from_state AS varchar)
    RETURNING request_id, request_number, customer_id, status, updated_at
), queued AS (
    INSERT INTO "NOTIFICATION_OUTBOX" (event_key, recipient_type, recipient_id, payload)
    SELECT 'NTF.REQUEST.SUBMITTED.V1', 'customer', customer_id,
           jsonb_build_object('request_id', request_id, 'request_number', request_number)
      FROM changed
     WHERE status = 'SUBMITTED'
)
SELECT request_id, status, updated_at FROM changed;
