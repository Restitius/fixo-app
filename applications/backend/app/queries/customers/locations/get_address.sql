-- CUS.LOCATION.ADDRESS.GET — one owned, live address (ownership enforced here).
SELECT address_id, label, recipient_name, phone, street_address, city,
       region, postal_code, latitude, longitude, delivery_instructions,
       is_default, created_at, updated_at
  FROM "CUSTOMER_ADDRESSES"
 WHERE address_id = CAST(:address_id AS uuid)
   AND customer_id = CAST(:customer_id AS uuid)
   AND deleted_at IS NULL;