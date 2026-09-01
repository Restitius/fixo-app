-- CUS.BOOKING.GET_INTERNAL — provider-side booking view (internal channel).
SELECT b.booking_id, b.booking_number, b.status, b.customer_id,
       b.provider_id, b.scheduled_date, b.time_window
  FROM "BOOKINGS" b
 WHERE b.booking_id = CAST(:booking_id AS uuid);