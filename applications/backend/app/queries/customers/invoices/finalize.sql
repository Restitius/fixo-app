-- CUS.INVOICE.FINALIZE — run SP_FINALIZE_INVOICE for an owned booking.
SELECT * FROM "SP_FINALIZE_INVOICE"(CAST(:customer_id AS uuid),
                                     CAST(:booking_id AS uuid),
                                     CAST(COALESCE(:tax_rate, 0.18) AS numeric));