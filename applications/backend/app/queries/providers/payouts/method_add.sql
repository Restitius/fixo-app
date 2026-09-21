-- PROV.PAYOUT.METHODS.ADD — register a payout method for the provider (Phase 30).
INSERT INTO "PROVIDER_PAYOUT_METHODS"
       (provider_id, method_type, provider_name, account_holder,
        account_number, mobile_number, currency, is_default)
SELECT CAST(:user_id AS uuid), CAST(:method_type AS varchar),
       CAST(:provider_name AS varchar), CAST(:account_holder AS varchar),
       CAST(:account_number AS varchar), CAST(:mobile_number AS varchar),
       CAST(COALESCE(:currency, 'TZS') AS varchar), CAST(:is_default AS boolean)
 WHERE NOT EXISTS (
         SELECT 1 FROM "PROVIDER_PAYOUT_METHODS"
          WHERE provider_id = CAST(:user_id AS uuid)
            AND method_type = CAST(:method_type AS varchar))
RETURNING method_id, provider_id, method_type, provider_name,
          account_holder, account_number, mobile_number, currency,
          is_default, created_at;