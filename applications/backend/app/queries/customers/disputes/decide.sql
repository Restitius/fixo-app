-- Customer decision request or withdrawal triggers central review path
UPDATE "DISPUTES"
SET    status = :new_status,
       resolution = CASE WHEN :resolution IS NULL THEN resolution ELSE :resolution END,
       resolved_at = CASE WHEN :new_status IN ('RESOLVED','REJECTED') THEN now() ELSE NULL END,
       updated_at = now()
WHERE  dispute_id  = CAST(:dispute_id AS uuid)
  AND  customer_id = CAST(:customer_id AS uuid)
  AND  status IN ('OPEN','UNDER_REVIEW')
RETURNING dispute_id, status;
