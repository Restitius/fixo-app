-- =============================================================================
-- QRY: SHARED.LOOKUP.BY_TYPE
-- Purpose: Generic key/value lookup rows (currencies, categories, statuses).
-- Params:  lookup_type, active_only (boolean)
-- =============================================================================

SELECT
    l.lookup_id,
    l.lookup_type,
    l.lookup_key,
    l.lookup_value,
    l.sort_order
FROM lookups AS l
WHERE l.lookup_type = :lookup_type
  AND (:active_only = FALSE OR l.is_active = TRUE)
ORDER BY l.sort_order, l.lookup_key;
