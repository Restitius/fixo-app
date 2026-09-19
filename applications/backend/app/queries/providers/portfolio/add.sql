-- PROV.PORTFOLIO.ADD — create a portfolio item for a provider.
INSERT INTO "PROVIDER_PORTFOLIO" (
    "provider_id", "title", "description", "service_category",
    "before_image_url", "after_image_url", "completed_on",
    "is_featured", "status"
) VALUES (
    :provider_id, :title, :description, :service_category,
    :before_image_url, :after_image_url, :completed_on,
    :is_featured, :status
)
RETURNING "id", "provider_id", "title", "description", "service_category",
          "before_image_url", "after_image_url", "completed_on", "is_featured",
          "status", "created_at", "updated_at";