-- CUS.BOOKING.CREATE — snapshot the accepted quote into a CONFIRMED booking.
INSERT INTO "BOOKINGS" (
    request_id, customer_id, provider_id, quote_id, service_id,
    address_id, scheduled_date, time_window,
    agreed_amount, currency, booking_number, status,
    arrival_code
)
SELECT r.request_id, r.customer_id, q.provider_id, q.quote_id, r.service_id,
       r.address_id,
       COALESCE(r.preferred_date, CAST(now() + interval '2 days' AS date)),
       COALESCE(r.time_window, 'MORNING'),
       q.amount, q.currency,
       'BK-' || to_char(now(), 'YYMMDDHH24MI') || '-' || upper(substr(md5(random()::text), 1, 4)),
       'CONFIRMED',
       lpad((random() * 999999)::int::text, 6, '0')
  FROM "SERVICE_REQUESTS" r
  JOIN "QUOTATIONS" q ON q.request_id = r.request_id
 WHERE q.quote_id = CAST(:quote_id AS uuid)
   AND r.customer_id = CAST(:customer_id AS uuid)
   AND r.status = 'QUOTE_ACCEPTED'
   AND q.status = 'ACCEPTED'
RETURNING booking_id, booking_number, status, agreed_amount, currency, arrival_code;