-- PRV.QUOTE.GET — one of this provider's quotations with full breakdown
SELECT q.quote_id, q.request_id, r.request_number,
       s.name AS service_name, s.slug AS service_slug,
       q.amount AS total_amount, q.currency, q.lead_time_days,
       q.labour_cost, q.materials_cost, q.transport_cost, q.inspection_fee,
       q.additional_charges, q.tax_amount, q.discount_amount, q.platform_fee,
       q.estimated_hours, q.proposed_start_date, q.notes, q.terms,
       q.status, q.valid_until, q.submitted_at, q.viewed_at, q.created_at, q.updated_at
  FROM "QUOTATIONS" q
  JOIN "SERVICE_REQUESTS" r ON r.request_id = q.request_id
  JOIN "SERVICES" s ON s.service_id = r.service_id
 WHERE q.quote_id = CAST(:quote_id AS uuid)
   AND q.provider_id = CAST(:user_id AS uuid);