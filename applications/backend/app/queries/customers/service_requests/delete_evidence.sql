-- CUS.REQUEST.EVIDENCE.DELETE — drop one owned evidence row, return its key.
DELETE FROM "REQUEST_EVIDENCE" e
 USING "SERVICE_REQUESTS" r
 WHERE e.request_id = r.request_id
   AND e.evidence_id = CAST(:evidence_id AS uuid)
   AND r.customer_id = CAST(:customer_id AS uuid)
   AND r.status IN ('DRAFT', 'SUBMITTED', 'VALIDATING', 'NEEDS_INFORMATION')
RETURNING e.storage_key;