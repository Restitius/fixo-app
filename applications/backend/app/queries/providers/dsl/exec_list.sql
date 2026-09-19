-- PROV.DSL.EXECUTION_LOGS.LIST
-- Read execution steps for a DSL request, in execution order.
-- Ownership enforced in SQL (defense in depth; the service also checks it
-- via a prior PROV.DSL.REQUESTS.GET call before reaching here).
-- Parameters: :dsl_request_id, :user_id
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
    "PROVIDER_DSL_EXECUTION_LOGS" e
WHERE
    e.dsl_request_id = :dsl_request_id
    AND EXISTS (
        SELECT 1 FROM "PROVIDER_DSL_REQUESTS" d
        WHERE d.id = e.dsl_request_id AND d.provider_id = :user_id
    )
ORDER BY
    e.step_order ASC;
