-- CUS.PROPERTY.ROOMS.REMOVE — drop one room of an owned property.
DELETE FROM "PROPERTY_ROOMS" r
 USING "PROPERTIES" p
 WHERE r.property_id = p.property_id
   AND r.room_id = CAST(:room_id AS uuid)
   AND p.customer_id = CAST(:customer_id AS uuid)
RETURNING r.room_id;