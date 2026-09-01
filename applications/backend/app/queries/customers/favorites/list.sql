-- CUS.FAVORITE.LIST.V1 - the customer's favorite providers with profile detail.
SELECT f.favorite_id, f.provider_id, p.display_name, p.headline, p.city,
       p.rating_avg, p.rating_count, p.jobs_completed, f.created_at
  FROM "FAVORITES" f
  JOIN "PROVIDERS" p ON p.provider_id = f.provider_id
 WHERE f.customer_id = CAST(:customer_id AS uuid)
 ORDER BY f.created_at DESC
 LIMIT CAST(:limit AS INT) OFFSET CAST(:offset AS INT);
