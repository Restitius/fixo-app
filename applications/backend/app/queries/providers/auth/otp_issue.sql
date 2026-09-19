-- PROV.AUTH.OTP.ISSUE -- atomic invalidate+insert via DB function
SELECT "SP_PROVIDER_ISSUE_OTP"(
           CAST(:user_id AS uuid),
           :channel,
           :purpose,
           :code_hash,
           :ttl_minutes
       ) AS otp_id;