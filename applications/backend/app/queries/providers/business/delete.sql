-- PRV.BUSINESS.DELETE -- remove the business profile, e.g. back to individual (Phase 4)
DELETE FROM "PROVIDER_BUSINESS_PROFILES"
 WHERE provider_id = CAST(:user_id AS uuid)
RETURNING business_id;