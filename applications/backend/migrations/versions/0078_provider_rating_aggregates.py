"""Keep PROVIDERS.rating_avg / rating_count / jobs_completed in step with reality.

Nothing updated the provider aggregates when a customer submitted, changed or
removed a rating, so provider cards, matching scores and the catalogue always
showed the seed values. The trigger applies each change incrementally rather
than recomputing from RATINGS, which preserves the baseline already stored on
providers whose historical ratings are not present as rows. A second trigger
counts a job when its booking becomes CLOSED.
"""

from alembic import op

revision = "0078"
down_revision = "0077"


def upgrade() -> None:
    op.execute(
        """
        CREATE OR REPLACE FUNCTION "SP_APPLY_PROVIDER_RATING"() RETURNS trigger
        LANGUAGE plpgsql AS $$
        DECLARE
            v_avg   numeric;
            v_count integer;
        BEGIN
            IF TG_OP = 'INSERT' THEN
                SELECT rating_avg, rating_count INTO v_avg, v_count
                  FROM "PROVIDERS" WHERE provider_id = NEW.provider_id FOR UPDATE;
                IF NOT FOUND THEN RETURN NEW; END IF;
                UPDATE "PROVIDERS"
                   SET rating_avg = ROUND((v_avg * v_count + NEW.rating) / (v_count + 1), 2),
                       rating_count = v_count + 1
                 WHERE provider_id = NEW.provider_id;
            ELSIF TG_OP = 'UPDATE' THEN
                IF NEW.rating IS DISTINCT FROM OLD.rating THEN
                    SELECT rating_avg, rating_count INTO v_avg, v_count
                      FROM "PROVIDERS" WHERE provider_id = NEW.provider_id FOR UPDATE;
                    IF NOT FOUND OR v_count = 0 THEN RETURN NEW; END IF;
                    UPDATE "PROVIDERS"
                       SET rating_avg = ROUND((v_avg * v_count - OLD.rating + NEW.rating) / v_count, 2)
                     WHERE provider_id = NEW.provider_id;
                END IF;
            ELSIF TG_OP = 'DELETE' THEN
                SELECT rating_avg, rating_count INTO v_avg, v_count
                  FROM "PROVIDERS" WHERE provider_id = OLD.provider_id FOR UPDATE;
                IF NOT FOUND OR v_count <= 0 THEN RETURN OLD; END IF;
                UPDATE "PROVIDERS"
                   SET rating_avg = CASE WHEN v_count = 1 THEN 0
                                         ELSE ROUND((v_avg * v_count - OLD.rating) / (v_count - 1), 2) END,
                       rating_count = v_count - 1
                 WHERE provider_id = OLD.provider_id;
                RETURN OLD;
            END IF;
            RETURN NEW;
        END;
        $$;
        """
    )
    op.execute('DROP TRIGGER IF EXISTS "TR_RATING_PROVIDER_AGGREGATE" ON "RATINGS"')
    op.execute(
        """
        CREATE TRIGGER "TR_RATING_PROVIDER_AGGREGATE"
        AFTER INSERT OR UPDATE OR DELETE ON "RATINGS"
        FOR EACH ROW EXECUTE FUNCTION "SP_APPLY_PROVIDER_RATING"()
        """
    )


    op.execute(
        """
        CREATE OR REPLACE FUNCTION "SP_COUNT_PROVIDER_JOB"() RETURNS trigger
        LANGUAGE plpgsql AS $$
        BEGIN
            IF NEW.status = 'CLOSED' AND OLD.status IS DISTINCT FROM 'CLOSED' THEN
                UPDATE "PROVIDERS" SET jobs_completed = jobs_completed + 1
                 WHERE provider_id = NEW.provider_id;
            END IF;
            RETURN NEW;
        END;
        $$;
        """
    )
    op.execute('DROP TRIGGER IF EXISTS "TR_BOOKING_PROVIDER_JOBS" ON "BOOKINGS"')
    op.execute(
        """
        CREATE TRIGGER "TR_BOOKING_PROVIDER_JOBS"
        AFTER UPDATE OF status ON "BOOKINGS"
        FOR EACH ROW EXECUTE FUNCTION "SP_COUNT_PROVIDER_JOB"()
        """
    )


def downgrade() -> None:
    op.execute('DROP TRIGGER IF EXISTS "TR_BOOKING_PROVIDER_JOBS" ON "BOOKINGS"')
    op.execute('DROP FUNCTION IF EXISTS "SP_COUNT_PROVIDER_JOB"()')
    op.execute('DROP TRIGGER IF EXISTS "TR_RATING_PROVIDER_AGGREGATE" ON "RATINGS"')
    op.execute('DROP FUNCTION IF EXISTS "SP_APPLY_PROVIDER_RATING"()')
