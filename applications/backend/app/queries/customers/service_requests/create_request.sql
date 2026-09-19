-- CUS.REQUEST.CREATE — new DRAFT with a human-friendly request number.
INSERT INTO "SERVICE_REQUESTS" (
    customer_id, service_id, property_id, address_id,
    description, preferred_date, time_window,
    request_number, status
)
VALUES (
    CAST(:customer_id AS uuid),
    CAST(:service_id AS uuid),
    CAST(NULLIF(:property_id, '') AS uuid),
    CAST(NULLIF(:address_id, '') AS uuid),
    :description,
    CAST(COALESCE(NULLIF(:preferred_date, ''), NULL) AS date),
    NULLIF(:time_window, ''),
    'SR-' || to_char(now(), 'YYMMDDHH24MI') || '-' || upper(substr(md5(random()::text), 1, 4)),
    'DRAFT'
)
RETURNING request_id, request_number, status, created_at;