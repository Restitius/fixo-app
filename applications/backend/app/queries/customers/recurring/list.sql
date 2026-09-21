-- CUS.RECURRING.LIST - the customer's subscriptions with service context.
SELECT r.recurring_id, r.recurring_number, r.service_id, s.name AS service_name,
       r.address_id, a.label AS address_label, r.frequency, r.next_run_date,
       r.time_window, r.status, r.last_request_id
  FROM "RECURRING_SERVICES" r
  JOIN "SERVICES" s ON s.service_id = r.service_id
  LEFT JOIN "CUSTOMER_ADDRESSES" a ON a.address_id = r.address_id
 WHERE r.customer_id = CAST(:customer_id AS uuid)
 ORDER BY r.next_run_date ASC
 LIMIT CAST(:limit AS int) OFFSET CAST(:offset AS int);
