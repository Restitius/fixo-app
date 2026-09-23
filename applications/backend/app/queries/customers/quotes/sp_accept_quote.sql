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
    v_request_number varchar(24);
BEGIN
    -- Quote must belong to this customer's request AND still be open.
    SELECT q.provider_id, r.request_number INTO v_provider, v_request_number
      FROM "QUOTATIONS" q
      JOIN "SERVICE_REQUESTS" r ON r.request_id = q.request_id
     WHERE q.quote_id = p_quote_id
       AND q.request_id = p_request_id
       AND q.status = 'SUBMITTED'
       AND r.customer_id = p_customer_id;

    IF v_provider IS NULL THEN
        RETURN FALSE;
    END IF;

    WITH expired AS (
        UPDATE "QUOTATIONS"
           SET status = 'EXPIRED', updated_at = now()
         WHERE request_id = p_request_id
           AND status = 'SUBMITTED'
        RETURNING quote_id, provider_id
    )
    INSERT INTO "NOTIFICATION_OUTBOX" (event_key, recipient_type, recipient_id, payload)
    SELECT 'NTF.QUOTE.EXPIRED.V1', 'provider', provider_id,
           jsonb_build_object(
               'request_id', p_request_id,
               'request_number', v_request_number,
               'quote_id', quote_id
           )
      FROM expired
     WHERE quote_id <> p_quote_id;

    UPDATE "QUOTATIONS"
       SET status = 'ACCEPTED', updated_at = now()
     WHERE quote_id = p_quote_id;

    INSERT INTO "NOTIFICATION_OUTBOX" (event_key, recipient_type, recipient_id, payload)
    VALUES (
        'NTF.QUOTE.ACCEPTED.V1',
        'provider',
        v_provider,
        jsonb_build_object(
            'request_id', p_request_id,
            'request_number', v_request_number,
            'quote_id', p_quote_id
        )
    );

    UPDATE "SERVICE_REQUESTS"
       SET selected_provider_id = v_provider,
           updated_at = now()
     WHERE request_id = p_request_id;

    RETURN TRUE;
END;
$$;
