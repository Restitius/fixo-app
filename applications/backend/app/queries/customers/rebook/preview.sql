-- CUS.REBOOK.PREVIEW.V1 - preview rebooking a completed booking.
SELECT b.booking_id, b.booking_number, b.service_id, s.name AS service_name,
       b.provider_id, p.display_name AS provider_name,
       b.address_id, a.label AS address_label,
       b.scheduled_date, b.time_window, b.agreed_amount, b.currency
  FROM "BOOKINGS" b
  JOIN "SERVICES" s ON s.service_id = b.service_id
  JOIN "PROVIDERS" p ON p.provider_id = b.provider_id
  LEFT JOIN "CUSTOMER_ADDRESSES" a ON a.address_id = b.address_id
 WHERE b.booking_id = CAST(:booking_id AS uuid)
   AND b.customer_id = CAST(:customer_id AS uuid)
   AND b.status IN ('PAID', 'CLOSED', 'COMPLETED');
