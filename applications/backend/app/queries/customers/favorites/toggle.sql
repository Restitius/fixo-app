-- CUS.FAVORITE.TOGGLE.V1 - save/un-save a provider; returns the new state.
-- DELETE wins when the pair exists (returning its row), otherwise INSERT.
WITH removed AS (
    DELETE FROM "FAVORITES"
     WHERE customer_id = CAST(:customer_id AS uuid)
       AND provider_id = CAST(:provider_id AS uuid)
    RETURNING favorite_id
), inserted AS (
    INSERT INTO "FAVORITES" (customer_id, provider_id)
    SELECT CAST(:customer_id AS uuid), CAST(:provider_id AS uuid)
     WHERE NOT EXISTS (SELECT 1 FROM removed)
    RETURNING favorite_id
)
SELECT (SELECT COUNT(*) FROM inserted)::INT > 0 AS is_favorite,
       (SELECT COUNT(*) FROM "FAVORITES"
         WHERE customer_id = CAST(:customer_id AS uuid))::INT AS favorites_count;
