-- CUS.REVIEW.STATS.V1 - aggregate rating stats for a provider.
SELECT COUNT(*)::INT AS total,
       COALESCE(ROUND(AVG(rating)::numeric, 2), 0) AS avg_rating,
       COUNT(*) FILTER (WHERE rating = 5)::INT AS five_stars,
       COUNT(*) FILTER (WHERE rating <= 2)::INT AS low_stars
  FROM "REVIEWS"
 WHERE provider_id = CAST(:provider_id AS uuid);
