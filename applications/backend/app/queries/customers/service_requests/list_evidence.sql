-- CUS.REQUEST.EVIDENCE.LIST — evidence of one owned request.
SELECT e.evidence_id, e.file_name, e.mime_type, e.size_bytes, e.uploaded_at
  FROM "REQUEST_EVIDENCE" e
  JOIN "SERVICE_REQUESTS" r ON r.request_id = e.request_id
 WHERE e.request_id = CAST(:request_id AS uuid)
   AND r.customer_id = CAST(:customer_id AS uuid)
 ORDER BY e.uploaded_at;