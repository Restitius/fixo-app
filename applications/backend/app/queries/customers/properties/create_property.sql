-- CUS.PROPERTY.CREATE — register a home/office owned by the customer.
INSERT INTO "PROPERTIES" (
    customer_id, name, property_type, address_id,
    bedrooms, bathrooms, year_built, notes
)
VALUES (
    CAST(:customer_id AS uuid), :name,
    COALESCE(:property_type, 'HOUSE'),
    CAST(NULLIF(:address_id, '') AS uuid),
    :bedrooms, :bathrooms, :year_built, :notes
)
RETURNING property_id, name, property_type, address_id,
          bedrooms, bathrooms, year_built, notes, created_at;