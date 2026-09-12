-- PROV.PORTFOLIO.LIST — provider portfolio items, newest first.
-- Optional status filter.
SELECT "id", "provider_id", "title", "description", "service_category",
       "before_image_url", "after_image_url", "completed_on", "is_featured",
       "status", "created_at", "updated_at"
FROM "PROVIDER_PORTFOLIO"
WHERE "provider_id" = :provider_id
  AND (:status IS NULL OR "status" = :status)
ORDER BY "is_featured" DESC, "created_at" DESC
LIMIT :limit OFFSET :offset;