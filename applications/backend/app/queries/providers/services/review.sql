-- PRV.SERVICE.REVIEW -- platform decision on a submitted configuration (Provider Req Phase 6; admin module wires the guard)
UPDATE "PROVIDER_SERVICES"
   SET status = :decision,
       reviewed_by = CAST(:reviewer_id AS uuid),
       reviewed_at = now(),
       review_notes = :review_notes,
       updated_at = now()
 WHERE provider_id = CAST(:provider_id AS uuid)
   AND service_id = CAST(:service_id AS uuid)
   AND status = 'PENDING_APPROVAL'
RETURNING service_id, provider_id, status, review_notes;