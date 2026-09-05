-- PRV.BUSINESS.GET -- provider's own business profile (Requirement Phase 4)
SELECT business_id, provider_id, business_name, logo_url,
       registration_number, tax_number, business_email, business_phone,
       address, city, region, country, description,
       year_established, num_employees, website, social,
       created_at, updated_at
  FROM "PROVIDER_BUSINESS_PROFILES"
 WHERE provider_id = CAST(:user_id AS uuid);