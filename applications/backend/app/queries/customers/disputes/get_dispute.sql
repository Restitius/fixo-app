-- Dispute detail incl. evidence bundle
SELECT d.dispute_id, d.dispute_number, d.booking_id, b.booking_number, d.category,
       d.description, d.status, d.resolution, d.resolved_at, d.created_at,
       COALESCE((
         SELECT json_agg(json_build_object(
             'evidence_id', e.evidence_id, 'file_name', e.file_name,
             'mime_type', e.mime_type, 'size_bytes', e.size_bytes))
         FROM "DISPUTE_EVIDENCE" e WHERE e.dispute_id = d.dispute_id
       ), '[]'::json) AS evidence
FROM   "DISPUTES" d
JOIN   "BOOKINGS" b ON b.booking_id = d.booking_id
WHERE  d.dispute_id  = CAST(:dispute_id AS uuid)
  AND  d.customer_id = CAST(:customer_id AS uuid);
