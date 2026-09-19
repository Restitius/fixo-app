-- CUS.LOCATION.ADDRESS.UPDATE — editable fields only; ownership re-checked.
UPDATE "CUSTOMER_ADDRESSES"
   SET label                 = COALESCE(:label, label),
       recipient_name        = COALESCE(:recipient_name, recipient_name),
       phone                 = COALESCE(:phone, phone),
       street_address        = COALESCE(:street_address, street_address),
       city                  = COALESCE(:city, city),
       region                = COALESCE(:region, region),
       postal_code           = COALESCE(:postal_code, postal_code),
       latitude              = COALESCE(:latitude, latitude),
       longitude             = COALESCE(:longitude, longitude),
       delivery_instructions = COALESCE(:delivery_instructions, delivery_instructions),
       updated_at            = now()
 WHERE address_id = CAST(:address_id AS uuid)
   AND customer_id = CAST(:customer_id AS uuid)
   AND deleted_at IS NULL
RETURNING address_id, label, recipient_name, phone, street_address, city,
          region, postal_code, latitude, longitude, delivery_instructions,
          is_default, updated_at;