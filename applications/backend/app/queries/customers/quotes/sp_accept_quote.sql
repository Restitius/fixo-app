-- SP_ACCEPT_QUOTE — accept one quote and expire its siblings.
-- Sequential statements inside the function see each other's effects
-- (the same snapshot rule that bit us in Phase 4).
CREATE OR REPLACE FUNCTION "SP_ACCEPT_QUOTE"(
    p_customer_id uuid,
    p_request_id  uuid,
    p_quote_id    uuid
)
RETURNS boolean
LANGUAGE plpgsql AS $$
DECLARE
    v_provider uuid;
BEGIN
    -- Quote must belong to this customer's request AND still be open.
    SELECT q.provider_id INTO v_provider
      FROM "QUOTATIONS" q
      JOIN "SERVICE_REQUESTS" r ON r.request_id = q.request_id
     WHERE q.quote_id = p_quote_id
       AND q.request_id = p_request_id
       AND q.status = 'SUBMITTED'
       AND r.customer_id = p_customer_id;

    IF v_provider IS NULL THEN
        RETURN FALSE;
    END IF;

    UPDATE "QUOTATIONS"
       SET status = 'EXPIRED'
     WHERE request_id = p_request_id
       AND status = 'SUBMITTED';

    UPDATE "QUOTATIONS"
       SET status = 'ACCEPTED'
     WHERE quote_id = p_quote_id;

    UPDATE "SERVICE_REQUESTS"
       SET selected_provider_id = v_provider,
           updated_at = now()
     WHERE request_id = p_request_id;

    RETURN TRUE;
END;
$$;