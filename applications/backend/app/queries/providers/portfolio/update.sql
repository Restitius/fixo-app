-- PROV.PORTFOLIO.UPDATE — update a portfolio item (ownership-scoped).
UPDATE "PROVIDER_PORTFOLIO"
SET "title"            = COALESCE(:title, "title"),
    "description"      = COALESCE(:description, "description"),
    "service_category" = COALESCE(:service_category, "service_category"),
    "before_image_url" = COALESCE(:before_image_url, "before_image_url"),
    "after_image_url"  = COALESCE(:after_image_url, "after_image_url"),
    "completed_on"     = COALESCE(:completed_on, "completed_on"),
    "is_featured"      = COALESCE(:is_featured, "is_featured"),
    "status"           = COALESCE(:status, "status"),
    "updated_at"       = now()
WHERE "provider_id" = :user_id AND "id" = :portfolio_id
RETURNING "id", "provider_id", "title", "description", "service_category",
          "before_image_url", "after_image_url", "completed_on", "is_featured",
          "status", "created_at", "updated_at";