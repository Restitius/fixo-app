-- PROV.EQUIPMENT.RETIRE - retire a piece of equipment (terminal, ownership-scoped)
UPDATE "PROVIDER_EQUIPMENT"
SET status = 'RETIRED',
    assigned_member_id = NULL,
    updated_at = now()
WHERE equipment_id = CAST(:equipment_id AS uuid)
  AND provider_id = CAST(:user_id AS uuid)
  AND status <> 'RETIRED'
RETURNING equipment_id, status, updated_at;
