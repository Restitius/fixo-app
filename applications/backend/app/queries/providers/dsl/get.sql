-- PROV.DSL.REQUESTS.GET
-- Read one DSL request owned by a provider.
-- Parameters: :user_id, :id
SELECT
    d.id,
    d.dsl_kind,
    d.subject_type,
    d.subject_id,
    d.title,
    d.dsl,
    d.status,
    d.priority,
    d.reason,
    d.requested_by,
    d.resolved_by,
    d.resolved_at,
    d.parent_id,
    d.root_request_id,
    d.created_at,
    d.updated_at
FROM
    "PROVIDER_DSL_REQUESTS" d
WHERE
    d.provider_id = :user_id
    AND d.id = :id;
