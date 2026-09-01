-- CUS.LOCATION.ADDRESS.CREATE — atomic via SP_CREATE_ADDRESS (demote-then-insert).
SELECT * FROM "SP_CREATE_ADDRESS"(
    CAST(:customer_id AS uuid), :label, :recipient_name, :phone,
    :street_address, :city, :region, :postal_code,
    :latitude, :longitude, :delivery_instructions,
    CAST(COALESCE(:is_default, FALSE) AS boolean)
);