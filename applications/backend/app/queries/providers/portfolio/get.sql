-- PROV.PORTFOLIO.GET — single portfolio item by id (ownership-scoped).
SELECT "id", "provider_id", "title", "description", "service_category",
       "before_image_url", "after_image_url", "completed_on", "is_featured",
       "status", "created_at", "updated_at"
FROM "PROVIDER_PORTFOLIO"
WHERE "provider_id" = :user_id AND "id" = :portfolio_id;