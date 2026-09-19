-- CUS.LOCATION.ADDRESS.SET_DEFAULT — sequential updates inside SP (snapshot-safe).
SELECT "SP_SET_DEFAULT_ADDRESS"(CAST(:customer_id AS uuid), CAST(:address_id AS uuid)) AS ok;