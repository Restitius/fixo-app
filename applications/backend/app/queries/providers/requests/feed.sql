-- PRV.REQUESTS.FEED — incoming job requests awaiting this provider's response
SELECT mc.match_id, mc.score, mc.rank_pos, mc.strategy,
       mc.created_at AS matched_at,
       mc.created_at + interval '4 hours' AS respond_by,
       r.request_id, r.request_number, r.description,
       r.preferred_date, r.time_window, r.status AS request_status,
       r.submitted_at,
       s.name AS service_name, s.slug AS service_slug,
       c.full_name AS customer_name,
       prop.name AS property_name, prop.property_type,
       prop.bedrooms, prop.bathrooms,
       addr.city, addr.region, addr.street_address,
       addr.latitude, addr.longitude,
       pp.base_amount AS estimated_earnings,
       pp.pricing_model AS my_pricing_model,
       q.quote_id AS my_quote_id, q.amount AS my_quote_amount,
       q.status AS my_quote_status
  FROM "MATCH_CANDIDATES" mc
  JOIN "SERVICE_REQUESTS" r ON r.request_id = mc.request_id
  JOIN "SERVICES" s ON s.service_id = r.service_id
  JOIN "CUSTOMERS" c ON c.customer_id = r.customer_id
  LEFT JOIN "PROPERTIES" prop ON prop.property_id = r.property_id
  LEFT JOIN "CUSTOMER_ADDRESSES" addr ON addr.address_id = r.address_id
  LEFT JOIN "PROVIDER_SERVICE_PRICING" pp
    ON pp.provider_id = mc.provider_id AND pp.service_id = r.service_id
  LEFT JOIN "QUOTATIONS" q
    ON q.request_id = mc.request_id AND q.provider_id = mc.provider_id
 WHERE mc.provider_id = CAST(:user_id AS uuid)
   AND r.status IN ('VALID', 'SUBMITTED')
   AND NOT EXISTS (SELECT 1 FROM "PROVIDER_REQUEST_RESPONSES" resp
                    WHERE resp.provider_id = mc.provider_id
                      AND resp.request_id = mc.request_id
                      AND resp.response_type IN ('ACCEPTED', 'DECLINED'))
 ORDER BY mc.created_at DESC;