-- PROV.DSL.REQUESTS.CREATE
-- Create one DSL request for a provider.
-- Parameters: :provider_id, :dsl_kind, :subject_type, :subject_id, :title,
--             :dsl, :status, :priority, :reason, :requested_by, :parent_id, :root_request_id
INSERT INTO "PROVIDER_DSL_REQUESTS" (
    id,
    provider_id,
    dsl_kind,
    subject_type,
    subject_id,
    title,
    dsl,
    status,
    priority,
    reason,
    requested_by,
    parent_id,
    root_request_id
) VALUES (
    :id,
    :provider_id,
    :dsl_kind,
    :subject_type,
    :subject_id,
    :title,
    :dsl,
    :status,
    :priority,
    :reason,
    :requested_by,
    :parent_id,
    :root_request_id
) RETURNING id, created_at, updated_at;
