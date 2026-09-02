-- CUS.CATALOG.CATEGORIES — active categories with live service counts and
-- real pricing/rating/jobs aggregates from providers who offer this category.
WITH provider_category AS (
    SELECT s.category_id, p.provider_id, p.rating_avg, p.jobs_completed,
           MIN(ps.base_amount) AS min_amount
      FROM "PROVIDER_SERVICES" ps
      JOIN "SERVICES" s ON s.service_id = ps.service_id AND s.is_active
      JOIN "PROVIDERS" p ON p.provider_id = ps.provider_id AND p.is_active
     GROUP BY s.category_id, p.provider_id, p.rating_avg, p.jobs_completed
), category_stats AS (
    SELECT category_id,
           MIN(min_amount) AS min_price,
           ROUND(AVG(rating_avg)::numeric, 1) AS avg_rating,
           SUM(jobs_completed) AS total_jobs,
           COUNT(DISTINCT provider_id) AS provider_count
      FROM provider_category
     GROUP BY category_id
)
SELECT c.category_id, c.code, c.name, c.description, c.icon,
       count(s.service_id) FILTER (WHERE s.is_active) AS service_count,
       cs.min_price, cs.avg_rating, cs.total_jobs, cs.provider_count
  FROM "SERVICE_CATEGORIES" c
  LEFT JOIN "SERVICES" s ON s.category_id = c.category_id
  LEFT JOIN category_stats cs ON cs.category_id = c.category_id
 WHERE c.is_active
 GROUP BY c.category_id, c.code, c.name, c.description, c.icon, c.sort_order,
          cs.min_price, cs.avg_rating, cs.total_jobs, cs.provider_count
 ORDER BY c.sort_order;