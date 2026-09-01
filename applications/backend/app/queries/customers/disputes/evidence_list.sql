-- CUS.DISPUTE.EVIDENCE.LIST - evidence, ownership via dispute
SELECT e.evidence_id, e.kind, e.url, e.note, e.created_at
FROM "DISPUTE_EVIDENCE" e
JOIN "DISPUTES" d ON d.dispute_id = e.dispute_id
WHERE e.dispute_id = CAST(:dispute_id AS uuid)
  AND d.customer_id = CAST(:customer_id AS uuid)
ORDER BY e.created_at ASC;
