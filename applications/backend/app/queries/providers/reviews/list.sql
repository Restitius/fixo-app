SELECT "id", "provider_id", "booking_id", "customer_id", "rating", "title", "body",
       "status", "created_at", "updated_at"
FROM "PROVIDER_REVIEWS"
WHERE "provider_id" = :user_id
  AND (CAST(:status AS varchar) IS NULL OR "status" = :status)
  AND (CAST(:min_rating AS smallint) IS NULL OR "rating" >= :min_rating)
ORDER BY "created_at" DESC
LIMIT :limit OFFSET :offset;