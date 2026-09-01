-- CUS.RECURRING.GENERATE_REQUEST - materialize one due subscription.
-- Atomic: lock the row, open a DRAFT request, advance the cycle. If the row
-- is not due (lost race) every CTE is empty and nothing happens.
WITH src AS (
    SELECT * FROM "RECURRING_SERVICES"
     WHERE recurring_id = CAST(:recurring_id AS uuid)
       AND status = 'ACTIVE'
       AND next_run_date <= CURRENT_DATE
     FOR UPDATE SKIP LOCKED
), ins AS (
    INSERT INTO "SERVICE_REQUESTS" (
        request_number, customer_id, service_id, address_id, description, status)
    SELECT 'SR-' || to_char(now(), 'YYMMDDHH24MI') || '-' || upper(substr(md5(random()::text), 1, 4)),
           s.customer_id, s.service_id, s.address_id,
           'Auto-generated from recurring ' || s.recurring_number || ' (' || s.frequency || ')',
           'DRAFT'
      FROM src s
    RETURNING request_id, request_number
), adv AS (
    UPDATE "RECURRING_SERVICES" r
       SET last_request_id = i.request_id,
           next_run_date = CASE s.frequency
               WHEN 'WEEKLY'    THEN s.next_run_date + 7
               WHEN 'BIWEEKLY'  THEN s.next_run_date + 14
               WHEN 'MONTHLY'   THEN (s.next_run_date + INTERVAL '1 month')::date
               WHEN 'QUARTERLY' THEN (s.next_run_date + INTERVAL '3 months')::date
           END,
           updated_at = now()
      FROM src s, ins i
     WHERE r.recurring_id = s.recurring_id
    RETURNING r.next_run_date
)
SELECT i.request_id, i.request_number, a.next_run_date
  FROM ins i JOIN adv a ON true;
