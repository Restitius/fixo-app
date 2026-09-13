SELECT
    COUNT(*) AS "total_count",
    COALESCE(SUM("gross_amount"), 0) AS "total_gross",
    COALESCE(SUM("commission_amount"), 0) AS "total_commission",
    COALESCE(SUM("tax_amount"), 0) AS "total_tax",
    COALESCE(SUM("net_amount"), 0) AS "total_net",
    COUNT(*) FILTER (WHERE "status" = 'overdue') AS "overdue_count"
FROM "PROVIDER_INVOICES"
WHERE "provider_id" = :provider_id;