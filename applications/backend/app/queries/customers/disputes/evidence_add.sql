-- CUS.DISPUTE.EVIDENCE.ADD - attach evidence to an open owned dispute
INSERT INTO "DISPUTE_EVIDENCE" (dispute_id, kind, url, note)
SELECT CAST(:dispute_id AS uuid), :kind, :url, :note
WHERE EXISTS (
    SELECT 1 FROM "DISPUTES" d
    WHERE d.dispute_id = CAST(:dispute_id AS uuid)
      AND d.customer_id = CAST(:customer_id AS uuid)
      AND d.status IN ('OPEN','UNDER_REVIEW')
)
RETURNING evidence_id, dispute_id, kind, url, note, created_at;
