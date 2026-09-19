-- CUS.WARRANTY.CLAIM.V1 - file a claim against an own ACTIVE, unexpired warranty.
-- Marks the warranty CLAIMED and opens the claim row atomically.
WITH owned AS (
    SELECT w.warranty_id, w.provider_id
      FROM "WARRANTIES" w
     WHERE w.warranty_id = CAST(:warranty_id AS uuid)
       AND w.customer_id = CAST(:customer_id AS uuid)
       AND w.status = 'ACTIVE'
       AND w.expires_at > now()
     FOR UPDATE
), claim AS (
    INSERT INTO "WARRANTY_CLAIMS" (warranty_id, customer_id, provider_id, description)
    SELECT o.warranty_id, CAST(:customer_id AS uuid), o.provider_id, :description
      FROM owned o
    RETURNING claim_id, warranty_id, status
)
UPDATE "WARRANTIES" w
   SET status = 'CLAIMED', updated_at = now()
  FROM claim c
 WHERE w.warranty_id = c.warranty_id
RETURNING c.claim_id, c.status;
