SELECT "id", "provider_id", "period", "period_start", "period_end",
       "completion_rate", "on_time_rate", "avg_rating", "response_time_minutes",
       "jobs_completed", "jobs_cancelled", "revenue", "created_at", "updated_at"
FROM "PROVIDER_KPIS"
WHERE "provider_id" = :user_id
  AND (CAST(:period AS varchar) IS NULL OR "period" = :period)
ORDER BY "period_start" DESC
LIMIT :limit OFFSET :offset;