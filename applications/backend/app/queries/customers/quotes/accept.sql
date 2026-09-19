-- CUS.QUOTES.ACCEPT — run SP_ACCEPT_QUOTE for an owned request/quote pair.
SELECT "SP_ACCEPT_QUOTE"(CAST(:customer_id AS uuid),
                         CAST(:request_id AS uuid),
                         CAST(:quote_id AS uuid)) AS accepted;