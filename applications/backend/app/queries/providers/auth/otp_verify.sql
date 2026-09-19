-- PROV.AUTH.OTP.VERIFY -- expiry/attempts/consume handled atomically in DB
SELECT "SP_PROVIDER_VERIFY_OTP"(
           CAST(:user_id AS uuid),
           :purpose,
           :code_hash
       ) AS ok;