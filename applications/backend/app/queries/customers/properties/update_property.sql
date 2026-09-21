-- CUS.PROPERTY.UPDATE — editable fields only; ownership re-checked.
-- clear_address=TRUE unlinks the attached address; otherwise a provided
-- address_id replaces it and NULL keeps the current link.
UPDATE "PROPERTIES"
   SET name          = COALESCE(:name, name),
       property_type = COALESCE(:property_type, property_type),
       address_id   = CASE
                        WHEN CAST(COALESCE(:clear_address, FALSE) AS boolean) THEN NULL
                        ELSE COALESCE(CAST(NULLIF(:address_id, '') AS uuid), address_id)
                      END,
       bedrooms     = COALESCE(:bedrooms, bedrooms),
       bathrooms    = COALESCE(:bathrooms, bathrooms),
       year_built   = COALESCE(:year_built, year_built),
       notes        = COALESCE(:notes, notes),
       updated_at   = now()
 WHERE property_id = CAST(:property_id AS uuid)
   AND customer_id = CAST(:customer_id AS uuid)
   AND is_active
RETURNING property_id, name, property_type, address_id, bedrooms, bathrooms,
          year_built, notes, updated_at;