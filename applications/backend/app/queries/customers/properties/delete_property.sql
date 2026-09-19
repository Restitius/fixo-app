-- CUS.PROPERTY.DELETE — soft delete (is_active off); rooms ride via FK cascade? No:
-- rows stay so historical bookings keep their room references.
UPDATE "PROPERTIES"
   SET is_active = FALSE,
       updated_at = now()
 WHERE property_id = CAST(:property_id AS uuid)
   AND customer_id = CAST(:customer_id AS uuid)
   AND is_active
RETURNING property_id;