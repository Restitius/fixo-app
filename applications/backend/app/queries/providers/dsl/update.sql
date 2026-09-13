-- PROV.DSL.REQUESTS.UPDATE
-- Update mutable DSL request fields. Provider ownership is enforced by
-- the WHERE clause.
-- Parameters: :provider_id, :id, :status, :priority, :reason,
--             :title, :dsl, :resolved_by, :parent_id, :root_request_id
UPDATE PROVIDER_DSL_REQUESTS
SET
    status = COALESCE(:status::text, status),
    priority = COALESCE(:priority::text, priority),
    reason = COALESCE(:reason, reason),
    title = COALESCE(:title, title),
    dsl = CASE WHEN :dsl IS NOT NULL THEN :dsl ELSE dsl END,
    parent_id = COALESCE(:parent_id::text, parent_id),
    root_request_id = COALESCE(:root_request_id::text, root_request_id),
    resolved_by = CASE WHEN :resolved_by::text IS NOT NULL THEN :resolved_by::text ELSE resolved_by END,
    resolved_at = CASE WHEN :resolved_by::text IS NOT NULL THEN now() ELSE resolved_at END,
    updated_at = now()
WHERE
    provider_id = :provider_id
    AND id = :id
RETURNING id, status, priority, updated_at;
