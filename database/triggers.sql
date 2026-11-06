CREATE OR REPLACE FUNCTION update_paper_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_update_paper_timestamp ON papers;

CREATE TRIGGER trg_update_paper_timestamp
BEFORE UPDATE ON papers
FOR EACH ROW
EXECUTE FUNCTION update_paper_timestamp();
