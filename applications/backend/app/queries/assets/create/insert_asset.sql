-- ASSET.CREATE - insert an asset owned by the authenticated customer.
INSERT INTO "ASSETS" (
    asset_code, customer_id, property_id, name, asset_type, brand,
    serial_number, purchase_value, current_value, currency,
    purchased_at, warranty_until, notes
) VALUES (
    'AST-' || upper(substr(md5(random()::text), 1, 8)),
    CAST(:customer_id AS uuid),
    CAST(:property_id AS uuid),
    :name, lower(:asset_type), :brand, :serial_number,
    :purchase_value, :purchase_value, COALESCE(:currency, 'TZS'),
    CAST(:purchased_at AS date), CAST(:warranty_until AS date), :notes
RETURNING asset_id, asset_code, name, status;

