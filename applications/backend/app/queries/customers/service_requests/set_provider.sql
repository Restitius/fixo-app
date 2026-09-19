-- CUS.REQUEST.SET_PROVIDER — record the customer's chosen provider.
UPDATE "SERVICE_REQUESTS"
   SET selected_provider_id = CAST(:provider_id AS uuid),
       updated_at = now()
 WHERE request_id = CAST(:request_id AS uuid)
   AND customer_id = CAST(:customer_id AS uuid)
RETURNING request_id, selected_provider_id;