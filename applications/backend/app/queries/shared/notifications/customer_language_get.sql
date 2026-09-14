-- NTF.CUSTOMER_LANGUAGE.GET — recipient contact + preferred_language for delivery.
SELECT preferred_language, phone, email
FROM "CUSTOMERS" WHERE customer_id = CAST(:customer_id AS uuid);
