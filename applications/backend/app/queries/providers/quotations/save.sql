-- PRV.QUOTE.SAVE — create a DRAFT or upgrade my quote with a professional
-- breakdown; converting a submitted/auto-estimate back to DRAFT on edit
WITH updated AS (
    UPDATE "QUOTATIONS" q
       SET amount            = :amount,
           currency          = :currency,
           lead_time_days    = :lead_time_days,
           labour_cost       = :labour_cost,
           materials_cost    = :materials_cost,
           transport_cost    = :transport_cost,
           inspection_fee    = :inspection_fee,
           additional_charges= :additional_charges,
           tax_amount        = :tax_amount,
           discount_amount   = :discount_amount,
           platform_fee      = :platform_fee,
           estimated_hours   = :estimated_hours,
           proposed_start_date = :proposed_start_date,
           notes             = :notes,
           terms             = :terms,
           status            = 'DRAFT',
           updated_at        = now()
      WHERE q.provider_id = CAST(:user_id AS uuid)
        AND q.request_id = CAST(:request_id AS uuid)
        AND q.status IN ('DRAFT', 'SUBMITTED')
        AND EXISTS (SELECT 1
                      FROM "MATCH_CANDIDATES" mc
                      JOIN "SERVICE_REQUESTS" r ON r.request_id = mc.request_id
                     WHERE mc.provider_id = CAST(:user_id AS uuid)
                       AND mc.request_id = CAST(:request_id AS uuid)
                       AND r.status IN ('VALID', 'SUBMITTED'))
    RETURNING q.quote_id, q.status
), created AS (
    INSERT INTO "QUOTATIONS" (
        request_id, provider_id, amount, currency, lead_time_days,
        labour_cost, materials_cost, transport_cost, inspection_fee,
        additional_charges, tax_amount, discount_amount, platform_fee,
        estimated_hours, proposed_start_date, notes, terms, status
    )
    SELECT CAST(:request_id AS uuid), CAST(:user_id AS uuid), :amount,
           :currency, :lead_time_days,
           :labour_cost, :materials_cost, :transport_cost, :inspection_fee,
           :additional_charges, :tax_amount, :discount_amount, :platform_fee,
           :estimated_hours, :proposed_start_date, :notes, :terms, 'DRAFT'
     WHERE NOT EXISTS (SELECT 1 FROM updated)
       AND EXISTS (SELECT 1
                     FROM "MATCH_CANDIDATES" mc
                     JOIN "SERVICE_REQUESTS" r ON r.request_id = mc.request_id
                    WHERE mc.provider_id = CAST(:user_id AS uuid)
                      AND mc.request_id = CAST(:request_id AS uuid)
                      AND r.status IN ('VALID', 'SUBMITTED'))
    RETURNING quote_id, status
)
SELECT quote_id, status FROM created
UNION ALL
SELECT quote_id, status FROM updated;