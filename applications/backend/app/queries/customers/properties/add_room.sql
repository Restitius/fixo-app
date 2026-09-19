-- CUS.PROPERTY.ROOMS.ADD — attach a room to an owned, active property.
INSERT INTO "PROPERTY_ROOMS" (property_id, room_type, name, notes)
SELECT p.property_id, :room_type, :name, :notes
  FROM "PROPERTIES" p
 WHERE p.property_id = CAST(:property_id AS uuid)
   AND p.customer_id = CAST(:customer_id AS uuid)
   AND p.is_active
RETURNING room_id, property_id, room_type, name, notes, created_at;