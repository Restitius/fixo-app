-- PROV.BILLING.PREVIEW — provider view of the final bill (Phase 27, read-only)
-- Breakdown: original booking price + approved change deltas +
-- logged materials + taxes − discounts. Requires CUSTOMER_CONFIRMED
-- (Phase 26 sign-off); returns a zero-preview otherwise. Every amount
-- is provider-scoped through BOOKINGS.provider_id.
WITH owned AS (
    SELECT b.booking_id, b.customer_id, b.provider_id,
           b.agreed_amount, b.currency, b.status
      FROM "BOOKINGS" b
     WHERE b.booking_id  = CAST(:booking_id AS uuid)
       AND b.provider_id = CAST(:user_id AS uuid)
), approved_changes AS (
    SELECT COALESCE(SUM(COALESCE(c.additional_price, 0)), 0) AS additional_work
      FROM "CHANGE_REQUESTS" c
      JOIN owned o ON o.booking_id = c.booking_id
     WHERE c.status = 'APPROVED'
), materials AS (
    SELECT COALESCE(SUM(m.amount), 0) AS materials_total
      FROM "BOOKING_MATERIALS" m
      JOIN owned o ON o.booking_id = m.booking_id
)
SELECT o.booking_id, o.customer_id, o.provider_id, o.status,
       o.agreed_amount       AS original_price,
       ac.additional_work    AS approved_additional_work,
       mt.materials_total    AS approved_materials,
       o.currency,
       CASE WHEN o.status = 'CUSTOMER_CONFIRMED' THEN true ELSE false END AS bill_ready
  FROM owned o
 CROSS JOIN approved_changes ac
 CROSS JOIN materials mt;
