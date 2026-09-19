-- CUS.PROPERTY.LIST — active properties with their address summary attached.
SELECT p.property_id, p.name, p.property_type, p.bedrooms, p.bathrooms,
       p.year_built, p.notes, p.address_id, p.created_at,
       a.label      AS address_label,
       a.street_address AS address_street,
       a.city       AS address_city
  FROM "PROPERTIES" p
  LEFT JOIN "CUSTOMER_ADDRESSES" a ON a.address_id = p.address_id
 WHERE p.customer_id = CAST(:customer_id AS uuid)
   AND p.is_active
 ORDER BY p.created_at DESC;