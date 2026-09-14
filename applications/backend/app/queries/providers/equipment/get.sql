-- PROV.EQUIPMENT.GET - single owned equipment record
SELECT e.equipment_id, e.name, e.category, e.serial_number, e.condition, e.status,
       e.assigned_member_id, m.full_name AS assigned_member_name,
       e.purchase_date, e.notes, e.created_at, e.updated_at
FROM "PROVIDER_EQUIPMENT" e
LEFT JOIN "PROVIDER_TEAM_MEMBERS" m ON m.member_id = e.assigned_member_id
WHERE e.equipment_id = CAST(:equipment_id AS uuid)
  AND e.provider_id = CAST(:user_id AS uuid);
