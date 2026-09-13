-- PROV.DSL.EXECUTION_LOGS.INSERT
-- Write one execution step for a DSL request.
-- Parameters: :id, :dsl_request_id, :step_order, :action, :status,
--             :summary, :error, :started_at, :finished_at
INSERT INTO PROVIDER_DSL_EXECUTION_LOGS (
    id,
    dsl_request_id,
    step_order,
    action,
    status,
    summary,
    error,
    started_at,
    finished_at
) VALUES (
    :id,
    :dsl_request_id,
    :step_order,
    :action,
    :status,
    :summary,
    :error,
    :started_at,
    :finished_at
) RETURNING id, step_order, status;
