-- CUS.REQUEST.UPDATE — draft-only edits (description / schedule / links).
UPDATE "SERVICE_REQUESTS"
   SET description     = COALESCE(:description, description),
       preferred_date  = CASE
                           WHEN CAST(COALESCE(:clear_schedule, FALSE) AS boolean) THEN NULL
                           ELSE COALESCE(CAST(NULLIF(:preferred_date, '') AS date), preferred_date)
                         END,
       time_window     = COALESCE(NULLIF(:time_window, ''), time_window),
       address_id      = CASE WHEN CAST(COALESCE(:clear_address, FALSE) AS boolean) THEN NULL
                              ELSE COALESCE(CAST(NULLIF(:address_id, '') AS uuid), address_id) END,
       property_id     = CASE WHEN CAST(COALESCE(:clear_property, FALSE) AS boolean) THEN NULL
                              ELSE COALESCE(CAST(NULLIF(:property_id, '') AS uuid), property_id) END,
       updated_at      = now()
 WHERE request_id = CAST(:request_id AS uuid)
   AND customer_id = CAST(:customer_id AS uuid)
   AND status = 'DRAFT'
RETURNING request_id, status, updated_at;