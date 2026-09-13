-- PROV.DSL.EXECUTION_LOGS.LIST
-- Read execution steps for a DSL request, in execution order.
-- Parameters: :dsl_request_id
SELECT
    e.id,
    e.step_order,
    e.action,
    e.status,
    e.summary,
    e.error,
    e.started_at,
    e.finished_at
FROM
    PROVIDER_DSL_EXECUTION_LOGS e
WHERE
    e.dsl_request_id = :dsl_request_id
ORDER BY
    e.step_order ASC;
