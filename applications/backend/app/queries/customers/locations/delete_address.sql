-- CUS.LOCATION.ADDRESS.DELETE — soft delete; defaults die with the row.
UPDATE "CUSTOMER_ADDRESSES"
   SET deleted_at = now(),
       is_default = FALSE
 WHERE address_id = CAST(:address_id AS uuid)
   AND customer_id = CAST(:customer_id AS uuid)
   AND deleted_at IS NULL
RETURNING address_id;