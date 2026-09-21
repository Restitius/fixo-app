-- CUS.AUTH.CUSTOMER.CREATE
INSERT INTO "CUSTOMERS" (
    full_name, phone, email, password_hash,
    preferred_language, terms_accepted_at, privacy_accepted_at
)
VALUES (
    :full_name, :phone, :email, :password_hash,
    :preferred_language,
    CASE WHEN :terms_accepted THEN now() END,
    CASE WHEN :privacy_accepted THEN now() END
)
RETURNING customer_id, full_name, email, phone, status;