SELECT "id", "provider_id", "booking_id", "customer_id", "rating", "title", "body",
       "status", "created_at", "updated_at"
FROM "PROVIDER_REVIEWS"
WHERE "provider_id" = :user_id AND "id" = :review_id;