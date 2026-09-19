-- CUS.QUOTES.AUTO_CREATE — instant estimate from a matched provider's rate card.
INSERT INTO "QUOTATIONS" (request_id, provider_id, amount, lead_time_days, message)
VALUES (CAST(:request_id AS uuid), CAST(:provider_id AS uuid),
        :amount, :lead_time_days, :message)
ON CONFLICT (request_id, provider_id) DO NOTHING
RETURNING quote_id, amount;