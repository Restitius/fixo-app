SELECT "id", "provider_id", "invoice_number", "period_start", "period_end",
       "gross_amount", "commission_amount", "tax_amount", "net_amount",
       "currency", "status", "issued_at", "due_at", "paid_at",
       "created_at", "updated_at"
FROM "PROVIDER_INVOICES"
WHERE "provider_id" = :user_id AND "id" = :invoice_id;