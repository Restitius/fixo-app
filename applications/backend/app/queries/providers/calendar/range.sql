-- PROV.CALENDAR.RANGE -- provider's calendar events in a date range (Phase 15)
-- Union of: confirmed/pending bookings, blocked periods (time-off).
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
               'time_window', b.time_window,
               'agreed_amount', b.agreed_amount,
               'currency', b.currency
           ) AS details
      FROM "BOOKINGS" b
      JOIN "SERVICES" s ON s.service_id = b.service_id
      JOIN "CUSTOMERS" c ON c.customer_id = b.customer_id
     WHERE b.provider_id = CAST(:user_id AS uuid)
       AND b.scheduled_date BETWEEN CAST(:from_date AS date) AND CAST(:to_date AS date)
       AND b.status NOT IN ('COMPLETED', 'CANCELLED', 'DECLINED')
    UNION ALL
    SELECT 'blocked' AS source,
           t.time_off_id::text AS event_id,
           COALESCE(t.reason, 'Unavailable') AS title,
           t.starts_at AS start_at,
           t.ends_at AS end_at,
           'BLOCKED' AS status,
           jsonb_build_object('time_off_id', t.time_off_id, 'reason', t.reason) AS details
      FROM "PROVIDER_TIME_OFF" t
     WHERE t.provider_id = CAST(:user_id AS uuid)
       AND t.starts_at < CAST(:to_date AS date) + INTERVAL '1 day'
       AND t.ends_at > CAST(:from_date AS date)
  ) events
 ORDER BY start_at;
