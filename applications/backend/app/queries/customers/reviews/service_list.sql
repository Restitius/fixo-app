-- CUS.REVIEW.SERVICE_LIST.V1 - public reviews of a provider (optionally per service).
SELECT r.review_id, r.rating, r.comment, r.created_at,
       c.full_name AS customer_name
  FROM "REVIEWS" r
  JOIN "CUSTOMERS" c ON c.customer_id = r.customer_id
 WHERE r.provider_id = CAST(:provider_id AS uuid)
   AND (CAST(:service_id AS uuid) IS NULL OR EXISTS (
        SELECT 1 FROM "BOOKINGS" b
         WHERE b.booking_id = r.booking_id AND b.service_id = CAST(:service_id AS uuid)))
 ORDER BY r.created_at DESC
 LIMIT CAST(:limit AS INT) OFFSET CAST(:offset AS INT);
