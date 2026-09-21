-- CUS.DISPUTE.GET - one owned dispute with evidence count
SELECT d.dispute_id, d.dispute_number, d.booking_id, d.category, d.description,
       d.status, d.resolution, d.created_at, d.resolved_at,
       (SELECT COUNT(*) FROM "DISPUTE_EVIDENCE" e WHERE e.dispute_id = d.dispute_id) AS evidence_count
FROM "DISPUTES" d
WHERE d.dispute_id = CAST(:dispute_id AS uuid)
  AND d.customer_id = CAST(:customer_id AS uuid)
LIMIT 1;
