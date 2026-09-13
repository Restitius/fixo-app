SELECT
    COALESCE(AVG("completion_rate"), 0) AS "avg_completion_rate",
    COALESCE(AVG("on_time_rate"), 0) AS "avg_on_time_rate",
    COALESCE(AVG("avg_rating"), 0) AS "avg_rating",
    COALESCE(AVG("response_time_minutes"), 0) AS "avg_response_time_minutes",
    COALESCE(SUM("jobs_completed"), 0) AS "total_jobs_completed",
    COALESCE(SUM("jobs_cancelled"), 0) AS "total_jobs_cancelled",
    COALESCE(SUM("revenue"), 0) AS "total_revenue",
    COUNT(*) AS "periods_count"
FROM "PROVIDER_KPIS"
WHERE "provider_id" = :user_id;