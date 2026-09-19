-- PRV.SERVICE.UPSERT -- create/replace the provider's configuration for one service (Provider Req Phase 6)
-- Full-replace PUT semantics; any edit resets the approval lifecycle to DRAFT.
WITH upserted AS (
    INSERT INTO "PROVIDER_SERVICES" (
        provider_id, service_id, display_name, description, years_experience,
        pricing_model, minimum_charge, duration_minutes, is_emergency_available,
        tools, materials, warranty, photos, status, created_at, updated_at
    )
    VALUES (
        CAST(:user_id AS uuid), CAST(:service_id AS uuid),
        :display_name, :description, :years_experience,
        :pricing_model, :minimum_charge, :duration_minutes, :is_emergency_available,
        CAST(:tools AS jsonb), CAST(:materials AS jsonb),
        CAST(:warranty AS jsonb), CAST(:photos AS jsonb),
        'DRAFT', now(), now()
    )
    ON CONFLICT (provider_id, service_id) DO UPDATE SET
        display_name           = EXCLUDED.display_name,
        description            = EXCLUDED.description,
        years_experience       = EXCLUDED.years_experience,
        pricing_model          = EXCLUDED.pricing_model,
        minimum_charge         = EXCLUDED.minimum_charge,
        duration_minutes       = EXCLUDED.duration_minutes,
        is_emergency_available = EXCLUDED.is_emergency_available,
        tools                  = EXCLUDED.tools,
        materials              = EXCLUDED.materials,
        warranty               = EXCLUDED.warranty,
        photos                 = EXCLUDED.photos,
        status                 = 'DRAFT',
        reviewed_by            = NULL,
        reviewed_at            = NULL,
        review_notes           = NULL,
        updated_at             = now()
    RETURNING provider_id, service_id, display_name, description, years_experience,
              pricing_model, minimum_charge, duration_minutes, is_emergency_available,
              tools, materials, warranty, photos, status, created_at, updated_at
)
SELECT u.service_id, u.display_name, u.description, u.years_experience,
       u.pricing_model, u.minimum_charge, u.duration_minutes,
       u.is_emergency_available, u.tools, u.materials, u.warranty, u.photos,
       u.status, u.created_at, u.updated_at,
       s.name AS service_name, s.slug AS service_slug,
       c.code AS category_code, c.name AS category_name
  FROM upserted u
  JOIN "SERVICES" s ON s.service_id = u.service_id
  JOIN "SERVICE_CATEGORIES" c ON c.category_id = s.category_id;