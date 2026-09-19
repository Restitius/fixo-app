-- PROV.CALENDAR.DAY -- single day view: events + working hours (Phase 15)
SELECT source, event_id, title, start_at, end_at, status, details
  FROM (
    SELECT 'booking' AS source,
           b.booking_id::text AS event_id,
           b.booking_number || ' - ' || s.name AS title,
           b.scheduled_date::timestamp AS start_at,
           (b.scheduled_date + COALESCE(
               (regexp_match(b.time_window, '(\d+)'))[1]::interval,
               '1 hour'::interval
           )) AS end_at,
           b.status,
           jsonb_build_object(
               'booking_id', b.booking_id,
               'booking_number', b.booking_number,
               'service_name', s.name,
               'customer_name', c.full_name,
               'time_window', b.time_window
           ) AS details
      FROM "BOOKINGS" b
      JOIN "SERVICES" s ON s.service_id = b.service_id
      JOIN "CUSTOMERS" c ON c.customer_id = b.customer_id
     WHERE b.provider_id = CAST(:user_id AS uuid)
       AND b.scheduled_date = CAST(:date AS date)
       AND b.status NOT IN ('COMPLETED', 'CANCELLED', 'DECLINED')
    UNION ALL
    SELECT 'blocked' AS source,
           t.time_off_id::text AS event_id,
           COALESCE(t.reason, 'Unavailable') AS title,
           t.starts_at AS start_at,
           t.ends_at AS end_at,
           'BLOCKED' AS status,
           jsonb_build_object('time_off_id', t.time_off_id) AS details
      FROM "PROVIDER_TIME_OFF" t
     WHERE t.provider_id = CAST(:user_id AS uuid)
       AND t.starts_at::date = CAST(:date AS date)
    UNION ALL
    SELECT 'unavailable' AS source,
           w.hours_id::text AS event_id,
           'Unavailable' AS title,
           (CAST(:date AS date) + w.start_time)::timestamp AS start_at,
           (CAST(:date AS date) + w.end_time)::timestamp AS end_at,
           'UNAVAILABLE' AS status,
           jsonb_build_object('hours_id', w.hours_id, 'day_of_week', w.day_of_week) AS details
      FROM "PROVIDER_WORKING_HOURS" w
     WHERE w.provider_id = CAST(:user_id AS uuid)
       AND w.is_available = FALSE
       AND w.day_of_week = EXTRACT(DOW FROM CAST(:date AS date))::int
  ) events
 ORDER BY start_at;
