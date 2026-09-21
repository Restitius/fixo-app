-- CUS.BOOKING.CLOSE — Phase 16: atomic completion via SP_CLOSE_BOOKING.
SELECT * FROM "SP_CLOSE_BOOKING"(CAST(:booking_id AS uuid))
AS t(customer_id, provider_id, amount, wallet_credited, loyalty_earned, booking_status);
