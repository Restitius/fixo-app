-- CUS.RECURRING.DUE - scheduler feed: ACTIVE subscriptions due today or earlier.
SELECT recurring_id, customer_id, service_id, address_id,
       recurring_number, frequency, next_run_date
  FROM "RECURRING_SERVICES"
 WHERE status = 'ACTIVE'
   AND next_run_date <= CURRENT_DATE
 ORDER BY next_run_date
 LIMIT CAST(:limit AS int);
