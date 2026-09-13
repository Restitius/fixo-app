-- PROV.DSL.REQUESTS.LIST
-- Read DSL requests for a provider, newest first.
-- Parameters: :provider_id, :status, :dsl_kind, :limit, :offset
SELECT
    d.id,
    d.dsl_kind,
    d.subject_type,
    d.subject_id,
    d.title,
    d.status,
    d.priority,
    d.reason,
    d.requested_by,
    d.resolved_by,
    d.parent_id,
    d.root_request_id,
    d.created_at,
    d.updated_at
FROM
    PROVIDER_DSL_REQUESTS d
WHERE
    d.provider_id = :provider_id
    AND (:status::text IS NULL OR d.status = :status)
    AND (:dsl_kind::text IS NULL OR d.dsl_kind = :dsl_kind)
ORDER BY
    d.created_at DESC
LIMIT :limit
OFFSET :offset;
