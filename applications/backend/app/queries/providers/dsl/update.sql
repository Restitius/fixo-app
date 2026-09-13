-- PROV.DSL.REQUESTS.UPDATE
-- Update mutable DSL request fields. Provider ownership is enforced by
-- the WHERE clause.
-- Parameters: :user_id, :id, :status, :priority, :reason,
--             :title, :dsl, :resolved_by, :parent_id, :root_request_id
UPDATE "PROVIDER_DSL_REQUESTS"
SET
    status = COALESCE(CAST(:status AS text), status),
    priority = COALESCE(CAST(:priority AS text), priority),
    reason = COALESCE(:reason, reason),
    title = COALESCE(:title, title),
    dsl = CASE WHEN :dsl IS NOT NULL THEN :dsl ELSE dsl END,
    parent_id = COALESCE(CAST(:parent_id AS text), parent_id),
    root_request_id = COALESCE(CAST(:root_request_id AS text), root_request_id),
    resolved_by = CASE WHEN CAST(:resolved_by AS text) IS NOT NULL THEN CAST(:resolved_by AS text) ELSE resolved_by END,
    resolved_at = CASE WHEN CAST(:resolved_by AS text) IS NOT NULL THEN now() ELSE resolved_at END,
    updated_at = now()
WHERE
    provider_id = :user_id
    AND id = :id
RETURNING id, status, priority, updated_at;
