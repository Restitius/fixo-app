-- PRV.VER.DOCS.LIST -- the provider's own verification documents (Provider Req Phase 5)
SELECT doc_id, doc_type, doc_number, front_image_url, back_image_url,
       issue_date, expiry_date, status, review_notes, reviewed_at,
       created_at, updated_at
  FROM "PROVIDER_VERIFICATION_DOCUMENTS"
 WHERE provider_id = CAST(:user_id AS uuid)
   AND deleted_at IS NULL
 ORDER BY created_at DESC;
