-- PRV.VER.DOCS.EXPIRING -- the provider's verified documents nearing or past
-- expiry (Provider Phase 47: Documents & Compliance). Only VERIFIED
-- documents are considered "in force" and thus meaningfully expiring;
-- see docs/provider-backend-implementation.md Phase 47 for how this
-- differs from PRV.VER.STATUS's documents_expiring_soon count.
SELECT doc_id, doc_type, doc_number, expiry_date, status,
       (expiry_date < CURRENT_DATE) AS is_expired
FROM "PROVIDER_VERIFICATION_DOCUMENTS"
WHERE provider_id = CAST(:user_id AS uuid)
  AND deleted_at IS NULL
  AND status = 'VERIFIED'
  AND expiry_date IS NOT NULL
  AND expiry_date <= (CURRENT_DATE + (CAST(:within_days AS int) * INTERVAL '1 day'))
ORDER BY expiry_date ASC;
