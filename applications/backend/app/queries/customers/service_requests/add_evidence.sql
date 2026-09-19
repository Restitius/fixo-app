-- CUS.REQUEST.EVIDENCE.ADD — attach uploaded-file metadata to an owned request.
INSERT INTO "REQUEST_EVIDENCE" (request_id, file_name, mime_type, size_bytes, storage_key)
SELECT r.request_id, :file_name, :mime_type, :size_bytes, :storage_key
  FROM "SERVICE_REQUESTS" r
 WHERE r.request_id = CAST(:request_id AS uuid)
   AND r.customer_id = CAST(:customer_id AS uuid)
   AND r.status IN ('DRAFT', 'SUBMITTED', 'VALIDATING', 'NEEDS_INFORMATION')
RETURNING evidence_id, request_id, file_name, mime_type, size_bytes, uploaded_at;