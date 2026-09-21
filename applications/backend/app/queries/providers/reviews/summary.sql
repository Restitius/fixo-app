SELECT
    COUNT(*) AS "total_count",
    COALESCE(AVG("rating"), 0) AS "average_rating",
    COUNT(*) FILTER (WHERE "rating" = 5) AS "five_star",
    COUNT(*) FILTER (WHERE "rating" = 4) AS "four_star",
    COUNT(*) FILTER (WHERE "rating" = 3) AS "three_star",
    COUNT(*) FILTER (WHERE "rating" = 2) AS "two_star",
    COUNT(*) FILTER (WHERE "rating" = 1) AS "one_star",
    COUNT(*) FILTER (WHERE "created_at" >= date_trunc('month', now())) AS "this_month"
FROM "PROVIDER_REVIEWS"
WHERE "provider_id" = :user_id AND "status" = 'published';