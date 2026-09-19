-- CUS.REBOOK.CREATE.V1 - open a new DRAFT service request from a past booking.
-- Prefills service/address from the booking; description notes the origin.
INSERT INTO "SERVICE_REQUESTS" (
    request_number, customer_id, service_id, address_id, description, status
)
SELECT 'SR-' || to_char(now(), 'YYMMDDHH24MI') || '-' || upper(substr(md5(random()::text), 1, 4)),
       b.customer_id, b.service_id, b.address_id,
       'Rebook of booking ' || b.booking_number,
       'DRAFT'
  FROM "BOOKINGS" b
 WHERE b.booking_id = CAST(:booking_id AS uuid)
   AND b.customer_id = CAST(:customer_id AS uuid)
   AND b.status IN ('PAID', 'CLOSED', 'COMPLETED')
RETURNING request_id, request_number;
