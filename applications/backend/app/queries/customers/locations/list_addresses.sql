-- CUS.LOCATION.ADDRESS.LIST — all active addresses, default first.
SELECT address_id, label, recipient_name, phone, street_address, city,
       region, postal_code, latitude, longitude, delivery_instructions,
       is_default, created_at
  FROM "CUSTOMER_ADDRESSES"
 WHERE customer_id = CAST(:customer_id AS uuid)
   AND deleted_at IS NULL
 ORDER BY is_default DESC, created_at DESC;