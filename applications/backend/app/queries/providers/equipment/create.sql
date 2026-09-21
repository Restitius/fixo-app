-- PROV.EQUIPMENT.CREATE - register a piece of equipment
INSERT INTO "PROVIDER_EQUIPMENT" (provider_id, name, category, serial_number, condition, purchase_date, notes)
VALUES (
    CAST(:provider_id AS uuid), :name, :category, :serial_number,
    :condition, CAST(:purchase_date AS date), :notes
)
RETURNING equipment_id, provider_id, name, category, serial_number, condition,
          status, assigned_member_id, purchase_date, notes, created_at;
