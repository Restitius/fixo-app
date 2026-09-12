-- ASSET.CREATE - insert an asset owned by the authenticated customer.
-- property_id, when given, must belong to the same customer — the FK alone
-- only guarantees the property exists, not that it's theirs.
INSERT INTO "ASSETS" (
    asset_code, customer_id, property_id, name, asset_type, brand,
    serial_number, purchase_value, current_value, currency,
    purchased_at, warranty_until, notes
)
SELECT
    'AST-' || upper(substr(md5(random()::text), 1, 8)),
    CAST(:customer_id AS uuid),
    CAST(:property_id AS uuid),
    :name, lower(:asset_type), :brand, :serial_number,
    :purchase_value, :purchase_value, COALESCE(:currency, 'TZS'),
    CAST(:purchased_at AS date), CAST(:warranty_until AS date), :notes
 WHERE :property_id IS NULL OR EXISTS (
    SELECT 1 FROM "PROPERTIES" p
     WHERE p.property_id = CAST(:property_id AS uuid)
       AND p.customer_id = CAST(:customer_id AS uuid)
       AND p.is_active
 )
RETURNING asset_id, asset_code, name, status;

