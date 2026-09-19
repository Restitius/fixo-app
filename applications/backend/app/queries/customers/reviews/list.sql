-- CUS.REVIEW.LIST.V1 - reviews written by the authenticated customer.
SELECT r.review_id, r.booking_id, r.provider_id, p.display_name AS provider_name,
       r.rating, r.comment, r.status, r.created_at
  FROM "REVIEWS" r
  JOIN "PROVIDERS" p ON p.provider_id = r.provider_id
 WHERE r.customer_id = CAST(:customer_id AS uuid)
 ORDER BY r.created_at DESC
 LIMIT CAST(:limit AS INT) OFFSET CAST(:offset AS INT);
