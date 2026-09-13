-- PROV.DSL.REQUESTS.RESOLVE
-- Close a DSL request as resolved. Provider ownership is enforced.
-- Parameters: :provider_id, :id, :resolved_by
UPDATE PROVIDER_DSL_REQUESTS
SET
    status = 'closed',
    resolved_by = :resolved_by::text,
    resolved_at = now(),
    updated_at = now()
WHERE
    provider_id = :provider_id
    AND id = :id
RETURNING id, status, resolved_by, resolved_at;
