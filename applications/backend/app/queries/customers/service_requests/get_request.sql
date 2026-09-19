-- CUS.REQUEST.GET — one owned request with service + location context.
SELECT r.request_id, r.request_number, r.status, r.description,
       r.preferred_date, r.time_window, r.validation_notes,
       r.submitted_at, r.created_at, r.updated_at,
       r.service_id, r.address_id, r.property_id, r.selected_provider_id,
       s.name AS service_name, s.slug AS service_slug, s.is_active AS service_is_active,
       p.name AS property_name,
       a.label AS address_label, a.city AS address_city, a.region AS address_region
  FROM "SERVICE_REQUESTS" r
  JOIN "SERVICES" s        ON s.service_id = r.service_id
  LEFT JOIN "PROPERTIES" p          ON p.property_id = r.property_id
  LEFT JOIN "CUSTOMER_ADDRESSES" a ON a.address_id = r.address_id
 WHERE r.request_id = CAST(:request_id AS uuid)
   AND r.customer_id = CAST(:customer_id AS uuid);