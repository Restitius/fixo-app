-- PROV.AUTH.PROVIDER.REGISTER -- create a provider principal (Requirement Phase 1)
INSERT INTO "PROVIDERS" (
    display_name, first_name, middle_name, last_name,
    email, phone, password_hash, account_type,
    country, region, city, district, preferred_language, referral_code,
    terms_accepted_at, privacy_accepted_at
)
VALUES (
    :display_name, :first_name, NULLIF(:middle_name, ''), :last_name,
    :email, NULLIF(:phone, ''), :password_hash, :account_type,
    NULLIF(:country, ''), NULLIF(:region, ''), NULLIF(:city, ''), NULLIF(:district, ''),
    :preferred_language, NULLIF(:referral_code, ''),
    CASE WHEN :terms_accepted THEN now() END,
    CASE WHEN :privacy_accepted THEN now() END
)
RETURNING provider_id, display_name, email, phone, status, account_type;