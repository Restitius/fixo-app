-- PRV.VER.SUBMIT -- declare the verification package submitted (Provider Req Phase 5)
-- Allowed from NOT_SUBMITTED and after a REJECTED / MORE_INFO_REQUIRED verdict
-- (fix-and-resubmit loop); SUBMITTED / UNDER_REVIEW / VERIFIED are terminal here.
UPDATE "PROVIDERS"
   SET verification_status = 'SUBMITTED',
       updated_at = now()
 WHERE provider_id = CAST(:user_id AS uuid)
   AND verification_status IN ('NOT_SUBMITTED', 'REJECTED', 'MORE_INFO_REQUIRED')
RETURNING verification_status;
