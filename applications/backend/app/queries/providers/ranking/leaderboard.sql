-- PROV.RANKING.LEADERBOARD — top providers by rank score, with level and badges.
-- Public visibility — no ownership filter required.
SELECT "provider_id", "rank_score", "rank_level", "badges",
       "completed_jobs", "avg_rating", "last_computed_at"
FROM "PROVIDER_RANKING"
ORDER BY "rank_score" DESC
LIMIT :limit OFFSET :offset;