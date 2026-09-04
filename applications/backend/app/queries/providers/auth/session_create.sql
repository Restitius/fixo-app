-- PROV.AUTH.SESSION.CREATE -- open a provider refresh session after login
INSERT INTO "PROVIDER_AUTH_SESSIONS" (provider_id, refresh_token_hash, device_info, ip_address, expires_at)
VALUES (CAST(:user_id AS uuid), :refresh_token_hash, :device_info, :ip_address, now() + make_interval(secs => :ttl_seconds))
RETURNING session_id;