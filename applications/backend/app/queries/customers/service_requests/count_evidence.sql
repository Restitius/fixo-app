-- CUS.REQUEST.EVIDENCE.COUNT — enforce the per-request evidence cap in rules.
SELECT count(*) AS evidence_count
  FROM "REQUEST_EVIDENCE" e
  JOIN "SERVICE_REQUESTS" r ON r.request_id = e.request_id
 WHERE r.request_id = CAST(:request_id AS uuid)
   AND r.customer_id = CAST(:customer_id AS uuid);