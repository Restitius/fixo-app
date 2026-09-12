-- PROV.PORTFOLIO.DELETE — remove a portfolio item (ownership-scoped).
DELETE FROM "PROVIDER_PORTFOLIO"
WHERE "provider_id" = :provider_id AND "id" = :portfolio_id
RETURNING "id";