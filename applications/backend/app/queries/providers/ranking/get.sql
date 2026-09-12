-- PROV.RANKING.GET — current ranking signals for a provider.
-- Returns one row per provider (unique index on provider_id).
SELECT "id", "provider_id", "rank_score", "rank_level", "badges",
       "completed_jobs", "recurring_customers", "referrals",
       "avg_completion_rate", "avg_on_time_rate", "avg_rating",
       "last_computed_at", "created_at", "updated_at"
FROM "PROVIDER_RANKING"
WHERE "provider_id" = :provider_id;