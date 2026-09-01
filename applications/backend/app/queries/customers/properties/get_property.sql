-- CUS.PROPERTY.GET — one owned, active property with rooms pre-aggregated.
SELECT p.property_id, p.name, p.property_type, p.bedrooms, p.bathrooms,
       p.year_built, p.notes, p.address_id, p.created_at, p.updated_at,
       a.label      AS address_label,
       a.street_address AS address_street,
       a.city       AS address_city,
       COALESCE((
           SELECT json_agg(json_build_object(
                      'room_id', r.room_id, 'room_type', r.room_type,
                      'name', r.name, 'notes', r.notes) ORDER BY r.created_at)
             FROM "PROPERTY_ROOMS" r
            WHERE r.property_id = p.property_id
       ), '[]'::json) AS rooms
  FROM "PROPERTIES" p
  LEFT JOIN "CUSTOMER_ADDRESSES" a ON a.address_id = p.address_id
 WHERE p.property_id = CAST(:property_id AS uuid)
   AND p.customer_id = CAST(:customer_id AS uuid)
   AND p.is_active;