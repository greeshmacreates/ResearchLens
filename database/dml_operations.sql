-- ResearchLens: DML Operations Demonstration

BEGIN;

-- 1. INSERT: Create a temporary paper
INSERT INTO papers (title, abstract, publication_year)
VALUES (
    'ResearchLens DML Demo',
    'Temporary paper for demonstrating DML operations.',
    2026
);

-- 2. SELECT: Retrieve the inserted paper
SELECT paper_id, title, publication_year
FROM papers
WHERE title = 'ResearchLens DML Demo';

-- 3. UPDATE: Modify the paper title
UPDATE papers
SET title = 'ResearchLens DML Demo - Updated'
WHERE title = 'ResearchLens DML Demo';

-- Verify the update
SELECT paper_id, title
FROM papers
WHERE title = 'ResearchLens DML Demo - Updated';

-- 4. DELETE: Remove the temporary paper
DELETE FROM papers
WHERE title = 'ResearchLens DML Demo - Updated';

-- Verify deletion
SELECT COUNT(*) AS remaining_demo_records
FROM papers
WHERE title = 'ResearchLens DML Demo - Updated';

-- Undo all demonstration changes
ROLLBACK;
