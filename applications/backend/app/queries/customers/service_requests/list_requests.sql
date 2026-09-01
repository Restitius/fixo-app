-- CUS.REQUEST.LIST — customer's requests, newest first, optional status filter.
SELECT r.request_id, r.request_number, r.status, r.description,
       r.preferred_date, r.time_window, r.created_at,
       s.name AS service_name, s.slug AS service_slug
  FROM "SERVICE_REQUESTS" r
  JOIN "SERVICES" s ON s.service_id = r.service_id
 WHERE r.customer_id = CAST(:customer_id AS uuid)
   AND (CAST(:status AS varchar) IS NULL OR r.status = :status)
 ORDER BY r.created_at DESC
 LIMIT CAST(:limit AS int) OFFSET CAST(:offset AS int);