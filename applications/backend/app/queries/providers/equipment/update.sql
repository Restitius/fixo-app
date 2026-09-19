-- PROV.EQUIPMENT.UPDATE - modify equipment details/condition/status (ownership-scoped)
UPDATE "PROVIDER_EQUIPMENT"
SET name          = COALESCE(:name, name),
    category      = COALESCE(CAST(:category AS varchar), category),
    serial_number = COALESCE(:serial_number, serial_number),
    condition     = COALESCE(CAST(:condition AS varchar), condition),
    status        = COALESCE(CAST(:status AS varchar), status),
    notes         = COALESCE(:notes, notes),
    updated_at    = now()
WHERE equipment_id = CAST(:equipment_id AS uuid)
  AND provider_id = CAST(:user_id AS uuid)
RETURNING equipment_id, name, category, serial_number, condition, status, notes, updated_at;
