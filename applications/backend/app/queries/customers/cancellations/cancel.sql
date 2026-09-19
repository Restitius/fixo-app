-- Atomic cancel + policy-adjusted wallet refund
SELECT * FROM "SP_CANCEL_BOOKING"(
    CAST(:booking_id AS uuid),
    CAST(:customer_id AS uuid),
    :reason,
    CAST(:fee_amount AS numeric),
    CAST(:refund_amount AS numeric),
    :requested_by
);
