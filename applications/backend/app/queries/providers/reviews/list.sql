SELECT "id", "provider_id", "booking_id", "customer_id", "rating", "title", "body",
       "status", "created_at", "updated_at"
FROM "PROVIDER_REVIEWS"
WHERE "provider_id" = :provider_id
  AND (:status IS NULL OR "status" = :status)
  AND (:min_rating IS NULL OR "rating" >= :min_rating)
ORDER BY "created_at" DESC
LIMIT :limit OFFSET :offset;