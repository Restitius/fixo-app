-- PROV.EQUIPMENT.LIST - the provider's equipment registry
SELECT e.equipment_id, e.name, e.category, e.serial_number, e.condition, e.status,
       e.assigned_member_id, m.full_name AS assigned_member_name,
       e.purchase_date, e.notes, e.created_at, e.updated_at
FROM "PROVIDER_EQUIPMENT" e
LEFT JOIN "PROVIDER_TEAM_MEMBERS" m ON m.member_id = e.assigned_member_id
WHERE e.provider_id = CAST(:user_id AS uuid)
  AND (CAST(:status AS varchar) IS NULL OR e.status = :status)
  AND (CAST(:category AS varchar) IS NULL OR e.category = :category)
ORDER BY e.created_at DESC
LIMIT :limit OFFSET :offset;
