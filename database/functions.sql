CREATE OR REPLACE FUNCTION search_papers_by_year(
    start_year INTEGER,
    end_year INTEGER
)
RETURNS TABLE (
    paper_id BIGINT,
    title TEXT,
    publication_year INTEGER
)
LANGUAGE plpgsql
AS $$
BEGIN
    IF start_year IS NULL OR end_year IS NULL THEN
        RAISE EXCEPTION 'Start year and end year cannot be NULL';
    END IF;

    IF start_year > end_year THEN
        RAISE EXCEPTION 'Start year must be less than or equal to end year';
    END IF;

    RETURN QUERY
    SELECT
        p.paper_id,
        p.title,
        p.publication_year
    FROM papers p
    WHERE p.publication_year BETWEEN start_year AND end_year
    ORDER BY p.publication_year, p.title;
END;
$$;
