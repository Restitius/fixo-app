-- CUS.DISPUTE.WITHDRAW - customer closes own dispute before resolution
UPDATE "DISPUTES"
SET status = 'WITHDRAWN', resolved_at = NOW()
WHERE dispute_id = CAST(:dispute_id AS uuid)
  AND customer_id = CAST(:customer_id AS uuid)
  AND status IN ('OPEN','UNDER_REVIEW')
RETURNING dispute_id, dispute_number, status;
