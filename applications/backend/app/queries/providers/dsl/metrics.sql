-- PROV.DSL.PROVIDER_METRICS.GET
-- Read provider DSL lifetime metrics for a period.
-- Parameters: :provider_id, :period
SELECT
    m.provider_id,
    m.period,
    m.total_requests,
    m.resolved_requests,
    m.canceled_requests,
    m.escalated_requests,
    m.avg_resolution_hours,
    m.updated_at
FROM
    PROVIDER_DSL_PROVIDER_METRICS m
WHERE
    m.provider_id = :provider_id
    AND m.period = :period;
