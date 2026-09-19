-- PRV.BUSINESS.UPSERT -- create or partially update the business profile (Phase 4)
-- Absent (NULL) params keep the stored value on the update path; the insert
-- path (row absent) requires business_name (NOT NULL — service enforces on
-- create). UPDATE-then-INSERT via CTE because INSERT..ON CONFLICT validates
-- NOT NULL on the proposed row before conflict arbitration.
WITH updated AS (
    UPDATE "PROVIDER_BUSINESS_PROFILES" SET
        business_name       = COALESCE(:business_name,       business_name),
        logo_url            = COALESCE(:logo_url,            logo_url),
        registration_number = COALESCE(:registration_number, registration_number),
        tax_number          = COALESCE(:tax_number,          tax_number),
        business_email      = COALESCE(:business_email,      business_email),
        business_phone      = COALESCE(:business_phone,      business_phone),
        address             = COALESCE(:address,             address),
        city                = COALESCE(:city,                city),
        region              = COALESCE(:region,              region),
        country             = COALESCE(:country,             country),
        description         = COALESCE(:description,         description),
        year_established    = COALESCE(:year_established,    year_established),
        num_employees       = COALESCE(:num_employees,       num_employees),
        website             = COALESCE(:website,             website),
        social              = COALESCE(CAST(:social AS jsonb), social),
        updated_at          = now()
     WHERE provider_id = CAST(:user_id AS uuid)
    RETURNING business_id, provider_id, business_name, logo_url,
        registration_number, tax_number, business_email, business_phone,
        address, city, region, country, description,
        year_established, num_employees, website, social,
        created_at, updated_at
), inserted AS (
    INSERT INTO "PROVIDER_BUSINESS_PROFILES" (
        provider_id, business_name, logo_url, registration_number, tax_number,
        business_email, business_phone, address, city, region, country,
        description, year_established, num_employees, website, social
    )
    SELECT CAST(:user_id AS uuid), :business_name, :logo_url, :registration_number,
           :tax_number, :business_email, :business_phone, :address, :city, :region,
           :country, :description, :year_established, :num_employees, :website,
           COALESCE(CAST(:social AS jsonb), '{}'::jsonb)
     WHERE NOT EXISTS (SELECT 1 FROM updated)
    RETURNING business_id, provider_id, business_name, logo_url,
        registration_number, tax_number, business_email, business_phone,
        address, city, region, country, description,
        year_established, num_employees, website, social,
        created_at, updated_at
)
SELECT * FROM updated
UNION ALL
SELECT * FROM inserted;