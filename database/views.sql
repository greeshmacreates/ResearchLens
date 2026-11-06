CREATE OR REPLACE VIEW paper_summary AS
SELECT
    p.paper_id,
    p.title,
    p.abstract,
    p.publication_year,
    p.doi,
    p.url,
    COALESCE(
        STRING_AGG(DISTINCT a.author_name, ', ' ORDER BY a.author_name),
        'Unknown'
    ) AS authors,
    COALESCE(
        STRING_AGG(DISTINCT t.topic_name, ', ' ORDER BY t.topic_name),
        'Uncategorized'
    ) AS topics,
    COUNT(DISTINCT c.citing_paper_id) AS citation_count
FROM papers p
LEFT JOIN paper_authors pa
    ON p.paper_id = pa.paper_id
LEFT JOIN authors a
    ON pa.author_id = a.author_id
LEFT JOIN paper_topics pt
    ON p.paper_id = pt.paper_id
LEFT JOIN topics t
    ON pt.topic_id = t.topic_id
LEFT JOIN citations c
    ON p.paper_id = c.cited_paper_id
GROUP BY
    p.paper_id,
    p.title,
    p.abstract,
    p.publication_year,
    p.doi,
    p.url;
