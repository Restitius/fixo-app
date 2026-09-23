-- PRV.VER.DOC.REVIEW -- verification officer decision on one document (Provider Req Phase 5)
-- Platform-side operation: the admin route guard lands with the platform admin
-- module; the query itself is ownership-free by design (reviewer, not owner).
WITH changed AS (
UPDATE "PROVIDER_VERIFICATION_DOCUMENTS"
   SET status       = :decision,
       review_notes = :review_notes,
       reviewed_by  = CAST(:reviewer_id AS uuid),
       reviewed_at  = now(),
       updated_at   = now()
 WHERE doc_id = CAST(:doc_id AS uuid)
   AND deleted_at IS NULL
   AND status <> 'VERIFIED'
RETURNING doc_id, provider_id, doc_type, status
), queued AS (
    INSERT INTO "NOTIFICATION_OUTBOX" (event_key, recipient_type, recipient_id, payload)
    SELECT CASE status
               WHEN 'VERIFIED' THEN 'NTF.VERIFICATION.APPROVED.V1'
               WHEN 'REJECTED' THEN 'NTF.VERIFICATION.REJECTED.V1'
           END,
           'provider', provider_id,
           jsonb_build_object('doc_id', doc_id, 'doc_type', doc_type)
      FROM changed
     WHERE status IN ('VERIFIED', 'REJECTED')
)
SELECT doc_id, provider_id, doc_type, status FROM changed;
