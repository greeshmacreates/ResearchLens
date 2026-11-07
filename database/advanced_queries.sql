
-- =========================================================
-- ResearchLens: Advanced SQL Query Demonstrations
-- PostgreSQL 17
-- =========================================================


-- 1. NESTED QUERY
-- Find papers published after the average publication year.

SELECT
    paper_id,
    title,
    publication_year
FROM papers
WHERE publication_year > (
    SELECT AVG(publication_year)
    FROM papers
    WHERE publication_year IS NOT NULL
)
ORDER BY publication_year;


-- 2. CORRELATED SUBQUERY
-- Find authors who have written more papers than
-- the average number of papers per author.

SELECT
    a.author_id,
    a.author_name
FROM authors a
WHERE (
    SELECT COUNT(*)
    FROM paper_authors pa
    WHERE pa.author_id = a.author_id
) > (
    SELECT AVG(author_count)
    FROM (
        SELECT COUNT(*) AS author_count
        FROM paper_authors
        GROUP BY author_id
    ) AS author_statistics
)
ORDER BY a.author_name;


-- 3. RECURSIVE QUERY
-- Traverse citation relationships starting from paper 5.
-- Follow papers cited by the current paper.
-- The path prevents infinite cycles.

WITH RECURSIVE citation_walk AS (
    SELECT
        c.citing_paper_id AS start_paper_id,
        c.cited_paper_id AS current_paper_id,
        1 AS depth,
        ARRAY[
            c.citing_paper_id,
            c.cited_paper_id
        ]::BIGINT[] AS path
    FROM citations c
    WHERE c.citing_paper_id = 5

    UNION ALL

    SELECT
        cw.start_paper_id,
        c.cited_paper_id,
        cw.depth + 1,
        cw.path || c.cited_paper_id
    FROM citation_walk cw
    JOIN citations c
        ON c.citing_paper_id = cw.current_paper_id
    WHERE NOT c.cited_paper_id = ANY(cw.path)
)
SELECT
    cw.start_paper_id,
    p.paper_id,
    p.title,
    cw.depth,
    cw.path
FROM citation_walk cw
JOIN papers p
    ON p.paper_id = cw.current_paper_id
ORDER BY cw.depth, p.paper_id;


-- 4. JOIN QUERY
-- Display papers with their authors, topics and citation counts.

SELECT
    p.paper_id,
    p.title,
    STRING_AGG(
        DISTINCT a.author_name,
        ', '
        ORDER BY a.author_name
    ) AS authors,
    STRING_AGG(
        DISTINCT t.topic_name,
        ', '
        ORDER BY t.topic_name
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
GROUP BY p.paper_id, p.title
ORDER BY citation_count DESC, p.title;


-- 5. COMMON TABLE EXPRESSION (CTE)
-- Find the most popular research topics.

WITH topic_statistics AS (
    SELECT
        t.topic_id,
        t.topic_name,
        COUNT(DISTINCT pt.paper_id) AS paper_count
    FROM topics t
    LEFT JOIN paper_topics pt
        ON t.topic_id = pt.topic_id
    GROUP BY t.topic_id, t.topic_name
)
SELECT
    topic_name,
    paper_count,
    RANK() OVER (
        ORDER BY paper_count DESC
    ) AS topic_rank
FROM topic_statistics
ORDER BY topic_rank, topic_name;

