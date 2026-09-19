-- PROV.WALLET.LEDGER — the provider's full wallet transaction history (Phase 29).
-- Example entry: Booking #FX12390 — customer paid TZS 120,000,
-- commission TZS 12,000, provider earnings TZS 108,000. Newest first.
SELECT l.entry_id, l.entry_type, l.amount, l.running_balance,
       l.currency, l.reference_type, l.reference_id, l.description,
       l.created_at,
       b.booking_number
  FROM "PROVIDER_WALLET_LEDGER" l
  JOIN "PROVIDER_WALLETS" w ON w.wallet_id = l.wallet_id
  LEFT JOIN "BOOKINGS" b ON b.booking_id = l.reference_id
                        AND l.reference_type = 'BOOKING'
 WHERE w.provider_id = CAST(:user_id AS uuid)
 ORDER BY l.created_at DESC
 LIMIT CAST(:limit AS int) OFFSET CAST(:offset AS int);