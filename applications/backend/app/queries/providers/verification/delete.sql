-- PRV.VER.DOC.DELETE -- withdraw a not-yet-verified document (soft delete) (Provider Req Phase 5)
UPDATE "PROVIDER_VERIFICATION_DOCUMENTS"
   SET deleted_at = now(),
       updated_at = now()
 WHERE doc_id = CAST(:doc_id AS uuid)
   AND provider_id = CAST(:user_id AS uuid)
   AND deleted_at IS NULL
   AND status <> 'VERIFIED'
RETURNING doc_id;
